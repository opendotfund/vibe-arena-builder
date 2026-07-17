import { cn } from "@/lib/utils";

type Props = {
  side: "cyan" | "magenta";
  name?: string;
  className?: string;
  size?: number;
  animated?: boolean;
};

export function AgentAvatar({ side, name, className, size = 96, animated = true }: Props) {
  const color = side === "cyan" ? "var(--cyan)" : "var(--magenta)";
  const glow = side === "cyan" ? "glow-cyan" : "glow-magenta";
  const pulse = side === "cyan" ? "animate-pulse-cyan" : "animate-pulse-magenta";
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn("relative rounded-full", glow, animated && pulse)}
        style={{ width: size, height: size, background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)` }}
      >
        <div
          className={cn("absolute inset-2 rounded-full border-2", animated && "animate-float")}
          style={{ borderColor: color, background: "oklch(0.14 0.03 270 / 0.85)" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1.5">
              <span className="h-2 w-2 rounded-full animate-spark" style={{ background: color }} />
              <span className="h-2 w-2 rounded-full animate-spark" style={{ background: color, animationDelay: "0.4s" }} />
            </div>
          </div>
          <div className="absolute inset-x-4 bottom-4 h-0.5 rounded-full" style={{ background: color, opacity: 0.6 }} />
        </div>
      </div>
      {name && <div className="mono text-xs tracking-widest opacity-80">{name}</div>}
    </div>
  );
}
