import { cn } from "@/lib/utils";

type Props = {
  side: "sky" | "rose";
  name?: string;
  className?: string;
  size?: number;
  animated?: boolean;
};

export function AgentAvatar({ side, name, className, size = 96, animated = true }: Props) {
  const color = side === "sky" ? "var(--sky)" : "var(--rose)";
  const glow = side === "sky" ? "glow-sky" : "glow-rose";
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn("relative rounded-full glass", glow, animated && "animate-soft-pulse")}
        style={{ width: size, height: size }}
      >
        <div
          className={cn("absolute inset-3 rounded-full", animated && "animate-float")}
          style={{
            background: `radial-gradient(circle at 30% 25%, ${color}, transparent 70%)`,
            border: "1px solid oklch(1 0 0 / 0.5)",
          }}
        >
          <div className="absolute inset-0 rounded-full" style={{
            background: "radial-gradient(circle at 35% 25%, oklch(1 0 0 / 0.55), transparent 45%)",
          }} />
        </div>
      </div>
      {name && <div className="mono text-[11px] tracking-wide text-muted-foreground">{name}</div>}
    </div>
  );
}
