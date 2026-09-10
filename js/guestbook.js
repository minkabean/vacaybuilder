import { supabase, DB_CONFIGURED } from "./db.js";
import { EVENT_SLUG } from "./config.js";

const form = document.querySelector("[data-guestbook-form]");
const list = document.querySelector("[data-guestbook-list]");
const note = document.querySelector("[data-guestbook-note]");
let session = null;
let eventId = null;

function esc(value="") {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function getEventId() {
  const { data, error } = await supabase.from("events").select("id").eq("slug", EVENT_SLUG).single();
  if (error) throw error;
  eventId = data.id;
}

async function load() {
  if (!DB_CONFIGURED || !list) return;
  if (!eventId) await getEventId();
  const { data, error } = await supabase
    .from("guest_book_entries")
    .select("id,message,created_at,profiles!guest_book_entries_author_id_fkey(display_name)")
    .eq("event_id", eventId)
    .eq("status","visible")
    .order("created_at",{ascending:false});
  if (error) { console.error(error); return; }
  list.innerHTML = (data || []).length ? data.map(x => `
    <article class="guestbook-entry">
      <blockquote>“${esc(x.message)}”</blockquote>
      <small>${esc(x.profiles?.display_name || "Guest")}</small>
    </article>`).join("") : `<div class="dynamic-empty">No guest-book messages yet.</div>`;
}

document.addEventListener("trina-auth-change", async e => {
  session = e.detail.session;
  if (form) {
    form.querySelector("button").disabled = !DB_CONFIGURED || !session;
    note.textContent = !DB_CONFIGURED ? "Connect Supabase to enable messages."
      : session ? "Leave Trina a birthday, retirement, or trip message." : "Sign in with Google to leave a message.";
  }
  if (DB_CONFIGURED) await load();
});

form?.addEventListener("submit", async e => {
  e.preventDefault();
  if (!session || !eventId) return;
  const message = new FormData(form).get("message")?.trim();
  if (!message) return;
  const { error } = await supabase.from("guest_book_entries").insert({
    event_id:eventId, author_id:session.user.id, message
  });
  if (error) { note.textContent = error.message; return; }
  form.reset();
  note.textContent = "Message added.";
  await load();
});

if (!DB_CONFIGURED && list) {
  list.innerHTML = `<div class="dynamic-empty">Guest Book is built and waiting for the database connection.</div>`;
}
