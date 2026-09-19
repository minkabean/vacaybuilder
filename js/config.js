// V17 database configuration.
// Paste the two public values from Supabase Project Settings > API.
// Do NOT put a service_role key in this file.
export const SUPABASE_URL = "YOUR_SUPABASE_URL";
export const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
export const EVENT_SLUG = "trina-60-retirement-2029";

export const DB_CONFIGURED =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
