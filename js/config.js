// V17 database configuration.
// Paste the two public values from Supabase Project Settings > API.
// Do NOT put a service_role key in this file.
export const SUPABASE_URL = "https://yublqayznzbquqxkpaff.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uaFQ8iR-9Wfw1SMHET7Q7g_TDFVyjGd";
export const EVENT_SLUG = "trina-60-retirement-2029";

export const DB_CONFIGURED =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
