import { supabase, DB_CONFIGURED } from "./db.js";

const statusEls = document.querySelectorAll("[data-auth-status]");
const signInBtns = document.querySelectorAll("[data-sign-in]");
const signOutBtns = document.querySelectorAll("[data-sign-out]");

function displayName(user) {
  return user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Guest";
}

function render(session) {
  const user = session?.user;
  statusEls.forEach(el => {
    el.textContent = !DB_CONFIGURED
      ? "Database not connected yet"
      : user ? `Signed in as ${displayName(user)}` : "Browsing as guest";
  });
  signInBtns.forEach(b => b.hidden = !DB_CONFIGURED || !!user);
  signOutBtns.forEach(b => b.hidden = !DB_CONFIGURED || !user);
  document.dispatchEvent(new CustomEvent("trina-auth-change", { detail: { session } }));
}

if (!DB_CONFIGURED) {
  render(null);
} else {
  const { data: { session } } = await supabase.auth.getSession();
  render(session);

  supabase.auth.onAuthStateChange((_event, session) => render(session));

  signInBtns.forEach(btn => btn.addEventListener("click", async () => {
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo }
    });
  }));

  signOutBtns.forEach(btn => btn.addEventListener("click", async () => {
    await supabase.auth.signOut();
  }));
}
