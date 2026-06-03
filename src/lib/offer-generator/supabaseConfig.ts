/** Edge Functions — тот же проект, что и основной Supabase (pqzb). */
export function offerSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return { url, anonKey };
}
