/** Резервный список, если VITE_ADMIN_EMAILS не задан при сборке (CI). */
const DEFAULT_ADMIN_EMAILS = ["tvtska@gmail.com", "d.pishalkin@gmail.com"];

/** Список email админов (как на сервере ADMIN_EMAILS). */
export function getAdminEmails(): string[] {
  const fromEnv = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function isAdminEmailsConfiguredInBuild(): boolean {
  return Boolean(import.meta.env.VITE_ADMIN_EMAILS?.trim());
}
