/** Человекочитаемые сообщения для ошибок Supabase Auth. */
export function mapAuthErrorMessage(raw: string): string {
  const m = raw.trim();
  const lower = m.toLowerCase();

  if (lower.includes("email rate limit exceeded") || lower.includes("over_email_send_rate_limit")) {
    return (
      "Лимит отправки писем на сервере авторизации (слишком много попыток за час). " +
      "Подождите 30–60 минут или зарегистрируйтесь по логину без почты — например, ivan."
    );
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Такой логин или email уже занят — войдите";
  }

  if (lower.includes("invalid login credentials")) {
    return "Неверный логин или пароль";
  }

  if (lower.includes("user already registered")) {
    return "Аккаунт уже есть — войдите";
  }

  if (lower.includes("password") && lower.includes("weak")) {
    return "Пароль слишком простой — добавьте символы";
  }

  if (lower.includes("signup is disabled")) {
    return "Регистрация временно отключена";
  }

  return m || "Не удалось выполнить вход";
}
