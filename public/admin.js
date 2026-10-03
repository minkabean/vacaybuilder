const root = document.querySelector("[data-admin-content]"),
  session = document.querySelector("[data-admin-session]");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function api(path, opt = {}) {
  const r = await fetch("/admin/api" + path, {
    headers:
      opt.body instanceof FormData
        ? opt.headers || {}
        : { "content-type": "application/json", ...(opt.headers || {}) },
    ...opt,
  });
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(d?.error || `Request failed (${r.status})`);
  return d;
}
const formObj = (f) => Object.fromEntries(new FormData(f));
const button = (label, attrs = "") => `<button ${attrs}>${label}</button>`;
const showError = (e) => {
  root.innerHTML = `<div class="vb-error"><strong>This section could not be loaded.</strong><p>${esc(e.message)}</p></div>`;
};
async function init() {
  const me = await api("/me");
  session.innerHTML = `Signed in as <strong>${esc(me.name || me.email)}</strong> · <a href="/cdn-cgi/access/logout">Sign out</a>`;
  document
    .querySelectorAll("[data-tab]")
    .forEach((b) => (b.onclick = () => load(b.dataset.tab).catch(showError)));
  const requested = new URLSearchParams(location.search).get("tab");
  const allowed = [
    "trip",
    "hotels",
    "costs",
    "activities",
    "announcements",
    "page-history",
    "ideas",
    "guestbook",
    "photos",
    "people",
    "audit",
  ];
  await load(allowed.includes(requested) ? requested : "trip");
}
async function load(tab) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const currentUrl = new URL(location.href);
  currentUrl.searchParams.set("tab", tab);
  history.replaceState(null, "", currentUrl);
  root.innerHTML = "<p>Loading…</p>";
  const d = await api("/" + tab);
  if (tab === "trip") {
    root.innerHTML = `<h2>Trip details</h2><form class="vb-form" data-form><label>Title<input name="title" value="${esc(d.title)}" required></label><label>Subtitle<input name="subtitle" value="${esc(d.subtitle || "")}"></label><label>Destination<input name="destination" value="${esc(d.destination || "")}"></label><div class="vb-grid-form"><label>Start date<input type="date" name="start_date" value="${esc(d.start_date || "")}"></label><label>End date<input type="date" name="end_date" value="${esc(d.end_date || "")}"></label></div><label>Welcome message<textarea name="welcome_message">${esc(d.welcome_message || "")}</textarea></label><label>Trina's lodging status<input name="host_lodging_status" value="${esc(d.host_lodging_status || "Not booked yet")}"></label><label>Trina's hotel<input name="host_hotel" value="${esc(d.host_hotel || "")}"></label><button>Save Trip</button></form>`;
    root.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      await api("/trip", {
        method: "PUT",
        body: JSON.stringify(formObj(e.target)),
      });
      alert("Trip saved.");
    };
    return;
  }
  if (tab === "hotels")
    return listEditor("Hotels", d, "hotel", [
      "name",
      "room_type",
      "area",
      "nightly_rate",
      "booking_url",
      "notes",
    ]);
  if (tab === "costs")
    return listEditor("Example Costs", d, "cost", [
      "label",
      "detail",
      "amount_text",
    ]);
  if (tab === "activities")
    return listEditor("Confirmed Schedule", d, "activity", [
      "title",
      "category",
      "location",
      "event_date",
      "event_time",
      "cost_text",
      "description",
    ]);
  if (tab === "announcements")
    return listEditor("Announcements", d, "announcement", [
      "title",
      "body",
      "status",
    ]);
  if (tab === "page-history") {
    const pageNames = {
      "/home.html": "Home",
      "/guide.html": "Overview",
      "/getting-here.html": "Travel",
      "/stay.html": "Stay",
      "/budget.html": "Costs",
      "/plans.html": "Schedule",
      "/explore.html": "Things to Do",
      "/culture.html": "Culture",
      "/beaches.html": "Beaches & Wellness",
      "/food.html": "Food & Shopping",
      "/before-you-go.html": "Before You Go",
      "/community.html": "Community",
      "/about-marthas-vineyard.html": "About Martha's Vineyard",
    };
    const currentPages = new Set();
    const versions = d.map((x) => {
      const isCurrent = !currentPages.has(x.page_path);
      currentPages.add(x.page_path);
      return `<article class="audit-row"><time datetime="${esc(x.created_at)}">${esc(new Date(`${x.created_at}Z`).toLocaleString())}</time><div><strong>${esc(pageNames[x.page_path] || x.page_path)}${isCurrent ? " · Current" : ""}</strong><span>${esc(x.change_note || "Page saved")} · ${esc(x.actor_email || "System")}</span>${isCurrent ? "" : `<button data-revert-page="${x.id}" data-page-name="${esc(pageNames[x.page_path] || x.page_path)}">Revert this page to this version</button>`}</div></article>`;
    });
    root.innerHTML = `<h2>Page History</h2><p>Edit wording directly on the public page. Every Save Page creates one complete restore point for that page.</p><div class="page-history-actions">${Object.entries(pageNames).map(([path, name]) => `<a href="${path}">${esc(name)} <span>Edit page</span></a>`).join("")}</div><h3>Saved versions</h3><div class="audit-list">${versions.join("") || "<p>No page edits have been saved yet. Open a page above and choose Edit Page.</p>"}</div>`;
    root.querySelectorAll("[data-revert-page]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm(`Restore the entire ${b.dataset.pageName} page to this saved version?`)) return;
        await api(`/page-revisions/${b.dataset.revertPage}/revert`, { method: "POST", body: "{}" });
        alert("The complete page was restored. You can open it to review the result.");
        load("page-history");
      };
    });
    return;
  }
  if (tab === "ideas") {
    root.innerHTML = `<h2>Guest ideas</h2><p>Approve ideas to show them publicly.</p>${d.map((x) => `<article class="vb-admin-row"><div><strong>${esc(x.title)}</strong><p>${esc(x.description || "")}</p><small>${esc(x.email || "")} · ${esc(x.status)}</small></div><div class="vb-actions">${button("Approve", `data-mod="idea" data-id="${x.id}" data-status="approved"`)}${button("Hide", `data-mod="idea" data-id="${x.id}" data-status="hidden"`)}</div></article>`).join("") || "<p>No ideas yet.</p>"}`;
    bindModeration();
    return;
  }
  if (tab === "guestbook") {
    root.innerHTML = `<h2>Guest Book</h2>${d.map((x) => `<article class="vb-admin-row"><div><p>“${esc(x.message)}”</p><small>${esc(x.email || "")} · ${esc(x.status)}</small></div><div class="vb-actions">${button("Publish", `data-mod="guestbook" data-id="${x.id}" data-status="published"`)}${button("Hide", `data-mod="guestbook" data-id="${x.id}" data-status="hidden"`)}</div></article>`).join("") || "<p>No messages yet.</p>"}`;
    bindModeration();
    return;
  }
  if (tab === "photos") {
    root.innerHTML = `<h2>Photos</h2><div class="vb-photo-grid">${d.map((x) => `<figure><img src="/api/public/photo/${x.id}" alt=""><figcaption>${esc(x.caption || "")} · ${esc(x.status)}<br>${button("Publish", `data-mod="photo" data-id="${x.id}" data-status="published"`)} ${button("Hide", `data-mod="photo" data-id="${x.id}" data-status="hidden"`)}</figcaption></figure>`).join("") || "<p>No photos yet.</p>"}</div>`;
    bindModeration();
    return;
  }
  if (tab === "people") {
    root.innerHTML = `<h2>People & access</h2><form class="vb-form vb-grid-form" data-add-person><label>Email<input type="email" name="email" required></label><label>Role<select name="role"><option value="guest">Guest</option><option value="organizer">Organizer</option></select></label><button>Add / update person</button></form><div class="vb-admin-list">${d.map((x) => `<article class="vb-admin-row"><div><strong>${esc(x.display_name || x.email)}</strong><small>${esc(x.email)}</small></div><span>${esc(x.role)}</span></article>`).join("")}</div>`;
    root.querySelector("[data-add-person]").onsubmit = async (e) => {
      e.preventDefault();
      await api("/people", {
        method: "POST",
        body: JSON.stringify(formObj(e.target)),
      });
      e.target.reset();
      load("people");
    };
    return;
  }
  if (tab === "audit") {
    root.innerHTML = `<h2>Activity Log</h2><p>This permanent history shows portal sign-ins and changes made by organizers and guests.</p><div class="audit-list">${d.map((x) => `<article class="audit-row"><time datetime="${esc(x.created_at)}">${esc(new Date(`${x.created_at}Z`).toLocaleString())}</time><div><strong>${esc(x.summary)}</strong><span>${esc(x.actor_email || "System")} · ${esc(x.action)} · ${esc(x.entity_type)}</span></div></article>`).join("") || "<p>No activity has been recorded yet.</p>"}</div>`;
    return;
  }
}
function listEditor(title, rows, type, fields) {
  const labels = {
    name: "Name",
    room_type: "Room type",
    area: "Area",
    nightly_rate: "Nightly rate",
    booking_url: "Booking URL",
    notes: "Notes",
    label: "Label",
    detail: "Detail",
    amount_text: "Amount shown",
    title: "Title",
    category: "Category",
    location: "Location",
    event_date: "Date",
    event_time: "Time",
    cost_text: "Cost",
    description: "Description",
    body: "Message",
    status: "Status",
  };
  root.innerHTML = `<h2>${title}</h2><details class="vb-add-box"><summary>Add ${type}</summary><form class="vb-form vb-grid-form" data-new>${fields.map((f) => `<label>${labels[f] || f}<${["notes", "description", "body"].includes(f) ? "textarea" : "input"} name="${f}" ${f === "name" || f === "label" || f === "title" ? "required" : ""}>${["notes", "description", "body"].includes(f) ? `</textarea>` : ""}</label>`).join("")}<button>Add</button></form></details><div class="vb-admin-list">${rows.map((x) => `<details class="vb-admin-row"><summary><strong>${esc(x.name || x.label || x.title)}</strong><span>${esc(x.nightly_rate != null ? "$" + x.nightly_rate : x.amount_text || x.status || x.cost_text || "")}</span></summary><form class="vb-form vb-grid-form" data-edit data-id="${x.id}">${fields.map((f) => `<label>${labels[f] || f}<${["notes", "description", "body"].includes(f) ? "textarea" : "input"} name="${f}" value="${["notes", "description", "body"].includes(f) ? "" : esc(x[f] ?? "")}">${["notes", "description", "body"].includes(f) ? esc(x[f] ?? "") + "</textarea>" : ""}</label>`).join("")}<div class="vb-actions"><button>Save</button><button type="button" data-delete="${x.id}">Delete</button></div></form></details>`).join("")}</div>`;
  root.querySelector("[data-new]").onsubmit = async (e) => {
    e.preventDefault();
    await api("/" + type + "s", {
      method: "POST",
      body: JSON.stringify(formObj(e.target)),
    });
    load(
      type === "hotel"
        ? "hotels"
        : type === "cost"
          ? "costs"
          : type === "activity"
            ? "activities"
            : "announcements",
    );
  };
  root.querySelectorAll("[data-edit]").forEach(
    (f) =>
      (f.onsubmit = async (e) => {
        e.preventDefault();
        await api(`/${type}s/${f.dataset.id}`, {
          method: "PUT",
          body: JSON.stringify(formObj(f)),
        });
        alert("Saved.");
      }),
  );
  root.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (confirm("Delete this item?")) {
          await api(`/${type}s/${b.dataset.delete}`, { method: "DELETE" });
          load(
            type === "hotel"
              ? "hotels"
              : type === "cost"
                ? "costs"
                : type === "activity"
                  ? "activities"
                  : "announcements",
          );
        }
      }),
  );
}
function bindModeration() {
  root.querySelectorAll("[data-mod]").forEach(
    (b) =>
      (b.onclick = async () => {
        await api(`/moderate/${b.dataset.mod}/${b.dataset.id}`, {
          method: "PUT",
          body: JSON.stringify({ status: b.dataset.status }),
        });
        load(
          b.dataset.mod === "idea"
            ? "ideas"
            : b.dataset.mod === "guestbook"
              ? "guestbook"
              : "photos",
        );
      }),
  );
}
init().catch((e) => {
  session.textContent = e.message;
  showError(e);
});
