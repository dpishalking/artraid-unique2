import { Outlet } from "react-router-dom";

export function StudioLayout() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-foreground">
      <header className="border-b border-white/10 bg-[#0c0c0f]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300 text-sm font-bold">
              S
            </span>
            <span className="text-sm font-medium text-white/90">Forge Studio</span>
          </div>
          <span className="text-[11px] text-white/40">Конфигуратор лендинга</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
