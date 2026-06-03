/** Преобразует логин или email в адрес для Supabase Auth (signInWithPassword). */
export function resolveAuthEmail(raw: string): string {
  const login = raw.trim();
  if (!login) throw new Error("Укажите email или логин");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) {
    return login.toLowerCase();
  }

  const safe = login
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!safe) throw new Error("Недопустимый логин");

  return `${safe}@login.local`;
}
