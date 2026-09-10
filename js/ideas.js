import { supabase, DB_CONFIGURED } from "./db.js";
import { EVENT_SLUG } from "./config.js";

const list = document.querySelector("[data-idea-list]");
const form = document.querySelector("[data-idea-form]");
const formNote = document.querySelector("[data-idea-form-note]");
let session = null;
let eventId = null;
let ideas = [];
let myResponses = new Map();

function esc(value="") {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function getEventId() {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("slug", EVENT_SLUG)
    .single();
  if (error) throw error;
  eventId = data.id;
}

async function load() {
  if (!DB_CONFIGURED || !list) return;
  try {
    if (!eventId) await getEventId();

    const { data, error } = await supabase
      .from("activity_ideas")
      .select(`
        id,title,description,category,suggested_date,suggested_time,meeting_place,status,created_at,
        profiles!activity_ideas_created_by_fkey(display_name),
        activity_responses(response,user_id)
      `)
      .eq("event_id", eventId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    ideas = data || [];
    render();
  } catch (e) {
    list.innerHTML = `<div class="dynamic-empty">Could not load guest ideas yet.</div>`;
    console.error(e);
  }
}

function render() {
  if (!ideas.length) {
    list.innerHTML = `<div class="dynamic-empty">No guest-submitted ideas yet. Be the first when sign-in is enabled.</div>`;
    return;
  }
  list.innerHTML = ideas.map(idea => {
    const responses = idea.activity_responses || [];
    const going = responses.filter(r => r.response === "going").length;
    const interested = responses.filter(r => r.response === "interested").length;
    const mine = responses.find(r => r.user_id === session?.user?.id)?.response || "";
    const by = idea.profiles?.display_name || "Guest";
    return `<article class="dynamic-idea-card">
      <div class="dynamic-idea-card-top">
        <div>
          <div class="eyebrow">${esc(idea.category || "Guest Idea")}</div>
          <h3>${esc(idea.title)}</h3>
        </div>
        <small>Added by ${esc(by)}</small>
      </div>
      ${idea.description ? `<p>${esc(idea.description)}</p>` : ""}
      <div class="dynamic-idea-meta">
        ${idea.suggested_date ? `<span>${esc(idea.suggested_date)}</span>` : ""}
        ${idea.suggested_time ? `<span>${esc(idea.suggested_time)}</span>` : ""}
        ${idea.meeting_place ? `<span>Meet: ${esc(idea.meeting_place)}</span>` : ""}
      </div>
      <div class="dynamic-idea-actions">
        <button data-response="going" data-id="${idea.id}" class="${mine==="going"?"active":""}" ${session?"":"disabled"}>Going · ${going}</button>
        <button data-response="interested" data-id="${idea.id}" class="${mine==="interested"?"active":""}" ${session?"":"disabled"}>Interested · ${interested}</button>
      </div>
    </article>`;
  }).join("");

  list.querySelectorAll("[data-response]").forEach(btn => btn.addEventListener("click", async () => {
    if (!session) return;
    const ideaId = btn.dataset.id;
    const response = btn.dataset.response;
    await supabase.from("activity_responses").upsert({
      activity_id: ideaId,
      user_id: session.user.id,
      response
    }, { onConflict: "activity_id,user_id" });
    await load();
  }));
}

document.addEventListener("trina-auth-change", async e => {
  session = e.detail.session;
  if (form) {
    form.querySelector("button[type=submit]").disabled = !DB_CONFIGURED || !session;
    if (formNote) {
      formNote.textContent = !DB_CONFIGURED
        ? "Connect Supabase in js/config.js to enable guest submissions."
        : session ? "You are signed in. Your idea will appear for everyone." : "Sign in with Google to add an idea.";
    }
  }
  if (DB_CONFIGURED) await load();
});

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!session || !eventId) return;
    const fd = new FormData(form);
    const payload = {
      event_id: eventId,
      created_by: session.user.id,
      title: fd.get("title")?.trim(),
      description: fd.get("description")?.trim() || null,
      category: fd.get("category") || "Other",
      suggested_date: fd.get("suggested_date") || null,
      suggested_time: fd.get("suggested_time") || null,
      meeting_place: fd.get("meeting_place")?.trim() || null
    };
    const { error } = await supabase.from("activity_ideas").insert(payload);
    if (error) {
      formNote.textContent = error.message;
      return;
    }
    form.reset();
    formNote.textContent = "Idea added.";
    await load();
  });
}

if (!DB_CONFIGURED && list) {
  list.innerHTML = `<div class="dynamic-empty">Database features are built and waiting for the Supabase project URL and publishable key.</div>`;
}
