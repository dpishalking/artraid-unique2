import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  onReset: () => void;
};

type State = { error: Error | null };

export class AuditReportErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Audit report render failed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center">
          <p className="font-display text-lg font-semibold text-foreground">
            Отчёт получен, но не удалось отобразить его на экране
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Попробуйте запустить анализ ещё раз. Если повторится — напишите в поддержку.
          </p>
          <Button type="button" className="mt-6" onClick={() => { this.setState({ error: null }); this.props.onReset(); }}>
            Новый разбор
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
