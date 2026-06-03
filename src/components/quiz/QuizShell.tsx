import { motion } from "framer-motion";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";

type Props = {
  children: React.ReactNode;
  stepIndex: number;
  stepCount: number;
  showProgress?: boolean;
};

export function QuizShell({ children, stepIndex, stepCount, showProgress = true }: Props) {
  const progress = stepCount > 0 ? ((stepIndex + 1) / stepCount) * 100 : 0;

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col bg-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <FlowPageHeader hideExit title="Квиз · мастерская проекта" className="bg-muted/20" />

      {showProgress ? (
        <div className="container max-w-lg mx-auto px-4 w-full">
          <motion.div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-money"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        </div>
      ) : null}

      <main className="flex-1 container max-w-lg mx-auto px-4 py-6 w-full flex flex-col justify-center">
        {children}
      </main>
    </motion.div>
  );
}
