import { motion } from "framer-motion";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";

type Props = {
  children: React.ReactNode;
  stepIndex: number;
  stepCount?: number;
  projectId: string;
  projectName?: string;
};

export function OnboardingShell({
  children,
  stepIndex,
  stepCount = 4,
  projectId,
  projectName,
}: Props) {
  const progress = stepCount > 0 ? (stepIndex / stepCount) * 100 : 0;

  return (
    <motion.div className="min-h-screen bg-muted/20 flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <FlowPageHeader
        hideExit
        title={projectName ? `Настройка · ${projectName}` : "Настройка проекта"}
        className="bg-card/80"
      />

      <div className="border-b border-border bg-card/60">
        <div className="container max-w-2xl mx-auto px-4 pb-3">
          <motion.div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-money transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </motion.div>
        </div>
      </div>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 md:py-12">{children}</main>
    </motion.div>
  );
}
