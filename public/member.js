const q = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function api(path, opt = {}) {
  const r = await fetch("/member/api" + path, opt);
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.error || `Request failed (${r.status})`);
  return d;
}
function setStatus(message, isError = false) {
  const status = q("[data-member-status]");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}
async function refresh() {
  const d = await api("/bootstrap");
  q("[data-member-session]").innerHTML =
    `Signed in as <strong>${esc(d.me.name || d.me.email)}</strong> · <a href="/cdn-cgi/access/logout">Sign out</a>`;
  const organizerLink = q("[data-member-organizer]");
  if (organizerLink) organizerLink.hidden = d.me.role !== "organizer";
  q("[data-member-ideas]").innerHTML =
    d.ideas
      .map(
        (i) =>
          `<article class="vb-card"><div><span>${esc(i.category || "Guest Idea")}</span><h3>${esc(i.title)}</h3><p>${esc(i.description || "")}</p><small>${esc([i.suggested_date, i.suggested_time, i.meeting_place].filter(Boolean).join(" · "))}</small></div><div class="vb-actions"><button data-response="going" data-id="${i.id}" class="${i.my_response === "going" ? "active" : ""}">Going · ${i.going_count || 0}</button><button data-response="interested" data-id="${i.id}" class="${i.my_response === "interested" ? "active" : ""}">Interested · ${i.interested_count || 0}</button></div></article>`,
      )
      .join("") || "<p>No ideas yet.</p>";
  q("[data-member-guestbook-list]").innerHTML =
    d.guestbook
      .map(
        (g) =>
          `<article class="vb-card"><p>“${esc(g.message)}”</p><small>${esc(g.display_name || "Guest")}</small></article>`,
      )
      .join("") || "<p>No messages yet.</p>";
  q("[data-member-photos]").innerHTML =
    d.photos
      .map(
        (p) =>
          `<figure><img loading="lazy" src="/api/public/photo/${p.id}" alt="${esc(p.caption || "Trip photo")}"><figcaption>${esc(p.caption || "")}</figcaption></figure>`,
      )
      .join("") || "<p>No photos yet.</p>";
  document.querySelectorAll("[data-response]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          b.disabled = true;
          await api(`/ideas/${b.dataset.id}/response`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ response: b.dataset.response }),
          });
          setStatus(`Your response was updated to ${b.dataset.response}.`);
          await refresh();
        } catch (error) {
          setStatus(error.message, true);
          b.disabled = false;
        }
      }),
  );
}
q("[data-member-idea]").onsubmit = async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  try {
    button.disabled = true;
    setStatus("Adding your idea…");
    const data = Object.fromEntries(new FormData(e.target));
    await api("/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    e.target.reset();
    setStatus("Your idea was added.");
    await refresh();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
};
q("[data-member-guestbook]").onsubmit = async (e) => {
  e.preventDefault();
  const button = e.target.querySelector("button");
  try {
    button.disabled = true;
    setStatus("Adding your message…");
    const data = Object.fromEntries(new FormData(e.target));
    await api("/guestbook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    e.target.reset();
    setStatus("Your guest-book message was added.");
    await refresh();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
};
q("[data-member-photo]").onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Uploading…";
  try {
    setStatus("Uploading your photo…");
    await api("/photos", { method: "POST", body: fd });
    e.target.reset();
    setStatus("Your photo was uploaded.");
    await refresh();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload Photo";
  }
};
refresh()
  .then(() => {
    const section = new URLSearchParams(location.search).get("section");
    if (["ideas", "guestbook", "photos"].includes(section))
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  })
  .catch((e) => {
    q("[data-member-session]").textContent = e.message;
    setStatus(e.message, true);
  });
