import { ArrowRight } from "lucide-react";

export const CLIP = {
  bg: "#F9F9F9",
  card: "#12141D",
  yellow: "#F9C846",
  red: "#E74C3C",
} as const;

export function ClipCtaButton({ label, type = "button" }: { label: string; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      className="w-full h-14 rounded-xl font-semibold text-base text-black flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
      style={{ backgroundColor: CLIP.yellow }}
    >
      {label}
      <ArrowRight className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}
