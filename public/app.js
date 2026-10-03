const API = "/api/public";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  Number(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number(n) % 1 ? 2 : 0,
  });
const nav = [
  ["guide.html", "Overview"],
  ["getting-here.html", "Travel"],
  ["stay.html", "Stay"],
  ["budget.html", "Costs"],
  ["plans.html", "Schedule"],
  ["explore.html", "Things to Do"],
  ["before-you-go.html", "Before You Go"],
  ["community.html", "Community"],
];
async function get(path) {
  const r = await fetch(API + path, { credentials: "same-origin" });
  if (!r.ok) throw new Error("Unable to load trip updates");
  return r.json();
}
function buildNav() {
  const file = location.pathname.split("/").pop() || "home.html";
  document.body.classList.add(`page-${file.replace(/\.html$/, "")}`);
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main-content";
  if (main && !document.querySelector(".skip-link")) {
    const skip = document.createElement("a");
    skip.className = "skip-link";
    skip.href = "#main-content";
    skip.textContent = "Skip to main content";
    document.body.prepend(skip);
  }
  document.querySelectorAll(".nav-links").forEach((root) => {
    root.id = root.id || "main-navigation";
    root.innerHTML = nav
      .map(
        ([href, label]) =>
          `<a href="/${href}" ${file === href ? 'aria-current="page"' : ""}>${label}</a>`,
      )
      .join("");
    const header = root.closest(".nav");
    if (header && !header.querySelector(".nav-toggle")) {
      const toggle = document.createElement("button");
      toggle.className = "nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", root.id);
      toggle.textContent = "Menu";
      toggle.onclick = () => {
        const open = toggle.getAttribute("aria-expanded") !== "true";
        toggle.setAttribute("aria-expanded", String(open));
        root.classList.toggle("is-open", open);
      };
      header.insertBefore(toggle, root);
    }
  });
}
function addEditorialImages() {
  const path = location.pathname === "/" ? "/home.html" : location.pathname;
  const images = {
    "/getting-here.html": [
      "/vineyard-arrival.webp",
      "A passenger ferry approaching a calm New England island harbor",
      "Your arrival is part of the experience",
    ],
    "/about-marthas-vineyard.html": [
      "/oak-bluffs-cottages.webp",
      "Historic Victorian cottages and hydrangeas along an Oak Bluffs lane",
      "A storied summer community",
    ],
  };
  const config = images[path];
  if (!config || document.querySelector(".chapter-image")) return;
  const hero = document.querySelector(".page-hero, .about-hero");
  if (!hero) return;
  const figure = document.createElement("figure");
  figure.className = "chapter-image";
  figure.dataset.pageEditorIgnore = "true";
  figure.innerHTML = `<img src="${config[0]}" alt="${config[1]}" loading="eager"><figcaption>${config[2]}</figcaption>`;
  hero.after(figure);
}
function enhanceLongPages() {
  if (location.pathname.endsWith("about-marthas-vineyard.html")) {
    const section = document.querySelector(".mv-sections");
    const headings = section ? [...section.querySelectorAll("article h2")] : [];
    if (headings.length) {
      const contents = document.createElement("nav");
      contents.className = "page-contents";
      contents.setAttribute("aria-label", "On this page");
      contents.dataset.pageEditorIgnore = "true";
      contents.innerHTML = `<strong>On this page</strong><div>${headings
        .map((heading, index) => {
          heading.id = heading.id || `about-section-${index + 1}`;
          return `<a href="#${heading.id}">${heading.textContent}</a>`;
        })
        .join("")}</div>`;
      section.before(contents);
    }
  }
  const main = document.querySelector("main");
  if (main && main.scrollHeight > 2400 && !document.querySelector(".back-to-top")) {
    const top = document.createElement("a");
    top.className = "back-to-top";
    top.href = "#main-content";
    top.textContent = "Back to top";
    top.dataset.pageEditorIgnore = "true";
    main.append(top);
  }
}
function initChecklist() {
  const boxes = [...document.querySelectorAll(".checklist-grid input[type=checkbox]")];
  if (!boxes.length) return;
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem("trina-before-you-go-checklist") || "{}");
  } catch {}
  boxes.forEach((box, index) => {
    box.checked = Boolean(saved[index]);
    box.addEventListener("change", () => {
      const state = Object.fromEntries(boxes.map((item, i) => [i, item.checked]));
      localStorage.setItem("trina-before-you-go-checklist", JSON.stringify(state));
    });
  });
}
async function loadSession() {
  let s = { signed_in: false };
  try {
    s = await get("/session");
  } catch {}
  document.querySelectorAll(".auth-strip").forEach((strip) => {
    const status = strip.querySelector(".auth-status"),
      sign = strip.querySelector(".vb-auth-link"),
      org = strip.querySelector(".vb-organizer-link");
    sign.textContent = "Guest Ideas";
    let guestBook = strip.querySelector(".vb-guestbook-link");
    if (!guestBook) {
      guestBook = document.createElement("a");
      guestBook.className = "auth-button vb-guestbook-link";
      guestBook.textContent = "Guest Book";
      sign.after(guestBook);
    }
    let photos = strip.querySelector(".vb-photos-link");
    if (!photos) {
      photos = document.createElement("a");
      photos.className = "auth-button vb-photos-link";
      photos.textContent = "Photos";
      guestBook.after(photos);
    }
    if (s.signed_in) {
      status.textContent = `Signed in as ${s.name || s.email}`;
      sign.href = "/member?section=ideas";
      guestBook.href = "/member?section=guestbook";
      photos.href = "/member?section=photos";
      if (org) org.hidden = s.role !== "organizer";
      document
        .querySelectorAll("[data-auth-required]")
        .forEach((el) => (el.hidden = false));
    } else {
      status.textContent = "Guest participation";
      sign.href = "/participate.html?section=ideas";
      guestBook.href = "/participate.html?section=guestbook";
      photos.href = "/participate.html?section=photos";
      if (org) org.hidden = true;
      document
        .querySelectorAll("[data-auth-required]")
        .forEach((el) => (el.hidden = true));
    }
  });
  document.querySelectorAll('a[href^="/member"]').forEach((link) => {
    if (s.signed_in || link.matches("[data-participation-login]")) return;
    const target = new URL(link.href, location.origin);
    const section = target.searchParams.get("section") || "ideas";
    link.href = `/participate.html?section=${encodeURIComponent(section)}`;
  });
  if (location.pathname.endsWith("/participate.html")) {
    const section = new URLSearchParams(location.search).get("section") || "ideas";
    const allowed = ["ideas", "guestbook", "photos"];
    const selected = allowed.includes(section) ? section : "ideas";
    if (s.signed_in) {
      location.replace(`/member?section=${selected}`);
      return s;
    }
    const details = {
      ideas: ["Sign in to share an idea", "Suggest an activity, respond Going or Interested, and coordinate with the group."],
      guestbook: ["Sign in to write in the guest book", "Leave Trina a birthday, retirement, or trip message with your name."],
      photos: ["Sign in to share a photo", "Upload a photo and caption to the shared trip gallery."],
    }[selected];
    const title = document.querySelector("[data-participation-title]");
    const copy = document.querySelector("[data-participation-copy]");
    const login = document.querySelector("[data-participation-login]");
    if (title) title.textContent = details[0];
    if (copy) copy.textContent = details[1];
    if (login) login.href = `/member?section=${selected}`;
  }
  return s;
}
async function loadDynamicContent() {
  try {
    const data = await get("/bootstrap");
    const {
      hotels,
      costs,
      activities,
      ideas,
      guestbook,
      announcements,
      content,
    } = data;
    document.querySelectorAll("[data-content-key]").forEach((el) => {
      const v = content?.[el.dataset.contentKey];
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-public-hotels]").forEach((root) => {
      root.innerHTML = hotels
        .map(
          (h) =>
            `<article class="hotel-card"><div class="hotel-card-top"><span>${esc(h.area || "Oak Bluffs")}</span><strong>${h.nightly_rate != null ? money(h.nightly_rate) + "/night" : "Rate TBD"}</strong></div><h3>${esc(h.name)}</h3><p>${esc(h.room_type || "")}</p>${h.notes ? `<p>${esc(h.notes)}</p>` : ""}</article>`,
        )
        .join("");
    });
    document.querySelectorAll("[data-public-hotel-prices]").forEach((root) => {
      root.innerHTML = hotels
        .map(
          (h) =>
            `<article><div><h3>${esc(h.name)}</h3><p>${esc(h.room_type || "")}</p></div><strong>${h.nightly_rate != null ? money(h.nightly_rate) : "TBD"} <small>/ night</small></strong></article>`,
        )
        .join("");
    });
    document.querySelectorAll("[data-public-costs]").forEach((root) => {
      root.innerHTML = costs
        .map(
          (c) =>
            `<div class="budget-line"><span>${esc(c.label)}${c.detail ? ` <small>${esc(c.detail)}</small>` : ""}</span><strong>${esc(c.amount_text)}</strong></div>`,
        )
        .join("");
    });
    const free = activities.filter(
      (a) => String(a.cost_text || "").toLowerCase() === "free",
    );
    document
      .querySelectorAll("[data-public-free-activities]")
      .forEach((root) => {
        root.innerHTML = free
          .map(
            (a) =>
              `<article><div><h3>${esc(a.title)}</h3>${a.location || a.event_time ? `<p>${esc([a.location, a.event_time].filter(Boolean).join(" · "))}</p>` : ""}</div><strong>Free</strong></article>`,
          )
          .join("");
      });
    document.querySelectorAll("[data-public-activities]").forEach((root) => {
      root.innerHTML = activities.length
        ? activities
            .map(
              (a) =>
                `<article class="schedule-item"><div><span>${esc(a.category || "Group plan")}</span><h3>${esc(a.title)}</h3>${a.description ? `<p>${esc(a.description)}</p>` : ""}</div><div class="schedule-meta">${[
                  a.event_date,
                  a.event_time,
                  a.location,
                  a.cost_text,
                ]
                  .filter(Boolean)
                  .map((v) => `<span>${esc(v)}</span>`)
                  .join("")}</div></article>`,
            )
            .join("")
        : '<div class="quiet-empty"><h3>No confirmed group plans yet</h3><p>Details will appear here as Trina confirms them.</p></div>';
    });
    document.querySelectorAll("[data-public-ideas]").forEach((root) => {
      root.innerHTML = ideas.length
        ? ideas
            .map(
              (i) =>
                `<article class="dynamic-idea-card"><div><span>${esc(i.category || "Guest Idea")}</span><h3>${esc(i.title)}</h3><p>${esc(i.description || "")}</p></div><div><strong>${i.going_count || 0} Going</strong><span>${i.interested_count || 0} Interested</span></div></article>`,
            )
            .join("")
        : "<p>No guest ideas have been posted yet.</p>";
    });
    document.querySelectorAll("[data-public-guestbook]").forEach((root) => {
      root.innerHTML = guestbook.length
        ? guestbook
            .map(
              (g) =>
                `<article class="vb-message"><p>“${esc(g.message)}”</p><small>${esc(g.display_name || "Guest")}</small></article>`,
            )
            .join("")
        : "<p>No messages have been added yet.</p>";
    });
    document.querySelectorAll("[data-public-announcements]").forEach((sec) => {
      if (!announcements.length) return;
      sec.hidden = false;
      sec.querySelector("[data-announcement-list]").innerHTML = announcements
        .map(
          (a) =>
            `<article class="vb-announcement"><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p></article>`,
        )
        .join("");
    });
  } catch (e) {
    console.warn(e);
  }
}

function editableFields() {
  const main = document.querySelector("main");
  if (!main) return [];
  const dynamic = "[data-public-hotels],[data-public-hotel-prices],[data-public-costs],[data-public-free-activities],[data-public-activities],[data-public-ideas],[data-public-guestbook],[data-announcement-list],form,.vb-portal,[data-page-editor-ignore]";
  return [...main.querySelectorAll("h1,h2,h3,p,li,.eyebrow,.home-kicker,.action")]
    .filter((el) => !el.closest(dynamic))
    .map((el, index) => {
      el.dataset.pageField = `field-${index}`;
      return el;
    });
}
const capturePage = () =>
  editableFields().map((el) => ({ key: el.dataset.pageField, text: el.textContent }));
const pageSchema = () =>
  editableFields()
    .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].sort().join(".")}`)
    .join("|");
async function loadPageRevision() {
  const path = location.pathname === "/" ? "/home.html" : location.pathname;
  if (!document.querySelector("main") || ["/participate.html", "/member", "/member.html", "/admin", "/admin.html"].includes(path)) return;
  try {
    const revision = await get(`/page?path=${encodeURIComponent(path)}`);
    if (!revision.fields) return;
    const elements = editableFields();
    if (
      (revision.schema && revision.schema !== pageSchema()) ||
      (!revision.schema && revision.fields.length !== elements.length)
    ) {
      console.warn("A saved page version belongs to an older layout and was not applied.");
      return;
    }
    const byKey = new Map(elements.map((el) => [el.dataset.pageField, el]));
    revision.fields.forEach((field) => {
      const el = byKey.get(field.key);
      if (el) el.textContent = field.text;
    });
  } catch (e) {
    console.warn(e);
  }
}
function initPageEditor(sessionData) {
  if (sessionData?.role !== "organizer" || !document.querySelector("main")) return;
  const path = location.pathname === "/" ? "/home.html" : location.pathname;
  if (path === "/participate.html") return;
  const bar = document.createElement("div");
  bar.className = "page-edit-bar";
  bar.innerHTML = `<span>Organizer tools</span><button data-start-page-edit>Edit Page</button><button data-save-page hidden>Save Page</button><button data-cancel-page hidden>Cancel</button><a href="/admin?tab=page-history">History</a>`;
  document.body.append(bar);
  let before = [];
  let beforeSchema = "";
  const start = bar.querySelector("[data-start-page-edit]");
  const save = bar.querySelector("[data-save-page]");
  const cancel = bar.querySelector("[data-cancel-page]");
  const setEditing = (editing) => {
    document.body.classList.toggle("page-editing", editing);
    editableFields().forEach((el) => {
      el.contentEditable = editing ? "true" : "false";
      if (editing) el.setAttribute("role", "textbox");
      else el.removeAttribute("role");
    });
    start.hidden = editing;
    save.hidden = !editing;
    cancel.hidden = !editing;
  };
  start.onclick = () => {
    before = capturePage();
    beforeSchema = pageSchema();
    setEditing(true);
    editableFields()[0]?.focus();
  };
  cancel.onclick = () => {
    const byKey = new Map(editableFields().map((el) => [el.dataset.pageField, el]));
    before.forEach((field) => {
      const el = byKey.get(field.key);
      if (el) el.textContent = field.text;
    });
    setEditing(false);
  };
  save.onclick = async () => {
    save.disabled = true;
    save.textContent = "Saving…";
    try {
      const response = await fetch("/admin/api/page-save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path,
          before_fields: before,
          before_schema: beforeSchema,
          fields: capturePage(),
          schema: pageSchema(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The page could not be saved");
      setEditing(false);
      bar.querySelector("span").textContent = "Page saved";
      setTimeout(() => (bar.querySelector("span").textContent = "Organizer tools"), 2500);
    } catch (e) {
      alert(e.message);
    } finally {
      save.disabled = false;
      save.textContent = "Save Page";
    }
  };
}
async function load() {
  buildNav();
  addEditorialImages();
  const sessionPromise = loadSession();
  await loadDynamicContent();
  await loadPageRevision();
  initPageEditor(await sessionPromise);
  enhanceLongPages();
  initChecklist();
}
document.addEventListener("DOMContentLoaded", load);
