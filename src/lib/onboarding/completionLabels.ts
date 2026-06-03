/** Подписи шкалы «Заполненность проекта» для онбординга (по % памяти). */
export function onboardingFillLabel(percent: number): string {
  if (percent <= 30) return "Сервис знает о проекте минимум";
  if (percent <= 60) return "Уже можно получить первые результаты";
  if (percent <= 85) return "Генерации становятся заметно точнее";
  return "Проект готов к глубокому маркетинговому усилению";
}

export function onboardingFillTone(percent: number): "muted" | "ok" | "good" | "great" {
  if (percent <= 30) return "muted";
  if (percent <= 60) return "ok";
  if (percent <= 85) return "good";
  return "great";
}
