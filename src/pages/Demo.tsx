import { Link } from "react-router-dom";
import { ArrowRight, Copy, Check, User, Lock, CreditCard, Layers, ScanSearch } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</div>
        <div className="font-mono text-sm font-medium text-foreground">{value}</div>
      </div>
      <button
        onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-money" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-16">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-5">
            Тестовый доступ для модерации
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Демо-доступ</h1>
          <p className="text-muted-foreground text-sm">
            Страница для модераторов ЮKassa — войдите в аккаунт и ознакомьтесь с сервисом
          </p>
        </div>

        {/* Credentials */}
        <div className="rounded-2xl border border-border bg-card/70 p-6 mb-6 space-y-3 backdrop-blur">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Данные для входа</span>
          </div>
          <CopyField label="Email" value="demo@pishalking.com" />
          <CopyField label="Пароль" value="Demo2026!" />
          <Button asChild className="w-full h-11 bg-gradient-money text-primary-foreground font-semibold mt-2 rounded-xl">
            <Link to="/auth">
              Войти в аккаунт <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Flow description */}
        <div className="rounded-2xl border border-border bg-card/70 p-6 mb-6 backdrop-blur">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Путь пользователя и платёжный флоу</span>
          </div>
          <ol className="space-y-4">
            {[
              {
                step: "1",
                title: "Регистрация / вход",
                desc: "Пользователь регистрируется по email или через Google на pishalking.com/auth",
              },
              {
                step: "2",
                title: "Выбор инструмента",
                desc: "На главной pishalking.com выбирает: провести аудит сайта или создать прототип лендинга",
              },
              {
                step: "3",
                title: "Создание прототипа",
                desc: "Пользователь заполняет бриф в конструкторе (pishalking.com/prototype) и нажимает «Собрать прототип» — генерируется лендинг из 19 блоков. Сейчас генерация бесплатна.",
              },
              {
                step: "4",
                title: "Проекты и офферы",
                desc: "В мастерской проекта (pishalking.com/projects) можно связать аудит, оффер и прототип в одном контексте",
              },
              {
                step: "5",
                title: "Шаринг отчёта",
                desc: "После аудита доступна публичная ссылка на отчёт — её можно отправить коллеге или клиенту",
              },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {step}
                </div>
                <div>
                  <div className="font-semibold text-sm mb-0.5">{title}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Key pages */}
        <div className="rounded-2xl border border-border bg-card/70 p-6 mb-6 backdrop-blur">
          <div className="font-semibold text-sm mb-4">Ключевые страницы сервиса</div>
          <div className="space-y-2">
            {[
              { href: "/", label: "Главная страница", desc: "Выбор инструмента" },
              { href: "/cabinet", label: "Мастерская проекта", desc: "Дашборд, проекты, контекст и память" },
              { href: "/audit", label: "Аудит сайта", desc: "Бесплатный AI-анализ" },
              { href: "/prototype", label: "Конструктор прототипа", desc: "Создание лендинга" },
              { href: "/oferta", label: "Пользовательское соглашение", desc: "Публичная оферта" },
              { href: "/privacy", label: "Политика конфиденциальности", desc: "Обработка данных" },
            ].map(({ href, label, desc }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">pishalking.com{href}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        {/* What is sold */}
        <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
          <div className="font-semibold text-sm mb-4">Что продаётся</div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Layers className="h-5 w-5 text-money shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">Генерация прототипов лендингов</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  AI-сборка смыслового прототипа из 19 блоков. На период тестирования — бесплатно для всех пользователей.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <ScanSearch className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">AI-аудит сайта — бесплатно</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Анализ сайта по 11 маркетинговым фреймворкам. Не является платной услугой.
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ИП Можарова А.Н. · ИНН 222391963986 · tvtska@gmail.com
        </p>
      </div>
    </div>
  );
}
