/** Фоновые блики и зерно — только внутри Idea Lab */
export function IdeaLabAmbient() {
  return (
    <div className="idea-lab-grain pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute -right-[20%] -top-[30%] h-[min(70vh,520px)] w-[min(80vw,640px)] rounded-full bg-amber-500/[0.07] blur-[120px]" />
      <div className="absolute -bottom-[25%] -left-[15%] h-[min(50vh,400px)] w-[min(60vw,480px)] rounded-full bg-orange-600/[0.05] blur-[100px]" />
      <div className="absolute left-1/2 top-0 h-px w-[min(90%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
    </div>
  );
}
