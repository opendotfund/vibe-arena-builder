import { createFileRoute, Link } from "@tanstack/react-router";
import { AgentAvatar } from "@/components/AgentAvatar";
import { ArrowRight, Sparkles, Cpu, Trophy, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs mono tracking-widest">
            <Sparkles className="h-3 w-3 text-primary" /> VIBE-CODE YOUR BETTING AGENT
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.05]">
            Build an agent. <br />
            <span className="text-gradient-vs">Send it to war.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Drag-and-drop rules, or import your own strategy in plain English —
            we convert it. Then match up head-to-head against another player's
            agent on live prediction markets.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/build" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground glow-sky">
              Create an agent <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/vs" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-semibold hover:bg-secondary">
              Watch a battle
            </Link>
          </div>

          {/* Live arena preview */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <ArenaPreview />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border/60 bg-background/40 py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap mono text-xs tracking-widest text-muted-foreground gap-10">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-10">
              <span>▲ CYAN.AGENT bet HOME @ 2.35 → +48u</span>
              <span>● MARKET move −4.2% (5m)</span>
              <span>▼ MAGENTA.AGENT bet AWAY @ 3.10 → −20u</span>
              <span>◆ ROUND 7 · 30m to KO</span>
              <span>▲ CYAN.AGENT bet DRAW @ 3.25 → +65u</span>
              <span>● IMPLIED_HOME_PROB 41.3%</span>
              <span>▼ MAGENTA.AGENT skip · bankroll 78%</span>
              <span>◆ TX ODDS · WORLDCUP FEED · LIVE</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="mono text-xs tracking-widest text-primary">HOW IT WORKS</div>
          <h2 className="mt-2 text-4xl font-bold">Three steps to the arena</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Wand2, title: "Vibe-code rules", desc: "Snap conditions and actions together. IF home_odds ≥ 2.5 AND implied_prob < 45% THEN BET 5% on HOME." },
            { icon: Cpu, title: "Or import in English", desc: "Paste your napkin strategy. Gemini rewrites it into structured rules your agent can run." },
            { icon: Trophy, title: "Battle head-to-head", desc: "Your agent squares off against another player's on a live TX Odds feed. Winner takes the bankroll." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-xl p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="glass rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" />
          <div className="relative">
            <h2 className="text-4xl font-bold">Ready to deploy?</h2>
            <p className="mt-3 text-muted-foreground">Your first agent takes about 90 seconds.</p>
            <Link to="/build" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground glow-sky">
              Build my agent <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ArenaPreview() {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-8">
      <div className="absolute inset-0 opacity-30" />
      <div className="relative grid grid-cols-3 items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <AgentAvatar side="sky" name="CYAN.AGENT" />
          <div className="w-full rounded-lg border border-border/70 bg-background/50 p-3 text-left">
            <div className="mono text-[10px] text-muted-foreground">BANKROLL</div>
            <div className="text-2xl font-bold text-primary">$1,240</div>
            <BarGauge pct={72} color="sky" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="mono text-xs tracking-widest text-muted-foreground">ROUND 07</div>
          <div className="text-6xl font-black text-gradient-vs">VS</div>
          <div className="mono text-xs text-muted-foreground">30:00 TO KO</div>
          <div className="mt-2 w-full space-y-1.5 rounded-md border border-border/70 bg-background/60 p-3 mono text-[11px]">
            <div className="flex justify-between"><span className="text-muted-foreground">home</span><span>2.35</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">draw</span><span>3.25</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">away</span><span>3.10</span></div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <AgentAvatar side="rose" name="MAGENTA.AGENT" />
          <div className="w-full rounded-lg border border-border/70 bg-background/50 p-3 text-left">
            <div className="mono text-[10px] text-muted-foreground">BANKROLL</div>
            <div className="text-2xl font-bold" style={{ color: "var(--rose)" }}>$860</div>
            <BarGauge pct={44} color="rose" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BarGauge({ pct, color }: { pct: number; color: "sky" | "rose" }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        style={{
          width: `${pct}%`,
          background: color === "sky" ? "var(--sky)" : "var(--rose)",
          animation: "bar-fill 1.4s ease-out",
        }}
        className="h-full"
      />
    </div>
  );
}
