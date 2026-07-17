import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Play, Pause, RotateCcw, ChevronsRight, Swords } from "lucide-react";

import { AgentAvatar } from "@/components/AgentAvatar";
import {
  type Strategy,
  emptyStrategy,
  loadStrategies,
} from "@/lib/strategies";
import { Backtester } from "@/lib/backtester";

export type BattleStep = {
  tick: { minute: string; home_odds: string; away_odds: string; draw_odds: string; market_move: string };
  a: { bankroll: number; note: string };
  b: { bankroll: number; note: string };
};

const search = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
}).parse;

export const Route = createFileRoute("/vs")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Arena — AgentVS" },
      { name: "description", content: "Head-to-head agent battles on live prediction markets." },
    ],
  }),
  component: VsPage,
});

// A canned opponent so the arena works out of the box.
const OPPONENT: Strategy = {
  id: "opp-fade",
  name: "FADE.THE.FAV",
  description: "Backs the underdog when the market moves against them.",
  rules: [
    {
      id: "r1", name: "Fade the favourite",
      conditions: [
        { id: "c1", field: "away_odds", op: ">=", value: 2.6 },
        { id: "c2", field: "market_move", op: ">", value: 2 },
      ],
      action: { side: "away", stakePct: 4 },
    },
    {
      id: "r2", name: "Bankroll guard",
      conditions: [{ id: "c1", field: "bankroll_pct", op: ">", value: 40 }],
      action: { side: "skip", stakePct: 0 },
    },
  ],
  createdAt: 0, updatedAt: 0,
};

function VsPage() {
  const { a, b } = Route.useSearch();
  const [saved, setSaved] = useState<Strategy[]>([]);
  const [agentA, setAgentA] = useState<Strategy | null>(null);
  const [agentB, setAgentB] = useState<Strategy>(OPPONENT);
  const [seed, setSeed] = useState(7);

  useEffect(() => {
    const list = loadStrategies();
    setSaved(list);
    const fallbackA = list[0] ?? emptyStrategy();
    setAgentA(list.find((s) => s.id === a) ?? fallbackA);
    if (b) setAgentB(list.find((s) => s.id === b) ?? OPPONENT);
  }, [a, b]);

  const [slug, setSlug] = useState("super-bowl-champion-2026-731");
  const [steps, setSteps] = useState<BattleStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runMatch = async () => {
    if (!agentA) return;
    setLoading(true);
    setIdx(0);
    setPlaying(false);
    try {
      const apiKey = "vd_cJ6EjdkKC6s2ZMJ4kg8pWP8IyDsXoDoiS4wCAG0MG4fW";
      const ticks = await Backtester.fetchTicks(apiKey, slug);
      const tradesA = Backtester.runSimulation(agentA, slug, ticks);
      const tradesB = Backtester.runSimulation(agentB, slug, ticks);
      
      const combinedSteps: BattleStep[] = [];
      let bankA = 10000;
      let bankB = 10000;
      
      ticks.forEach((t) => {
        const trA = tradesA.find(x => x.timestamp === t.timestamp);
        const trB = tradesB.find(x => x.timestamp === t.timestamp);
        if (trA) bankA += trA.pnl;
        if (trB) bankB += trB.pnl;
        
        combinedSteps.push({
          tick: { minute: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), home_odds: t.home_odds.toFixed(2), away_odds: t.away_odds.toFixed(2), draw_odds: "0", market_move: t.market_move.toFixed(2) },
          a: { bankroll: bankA, note: trA ? `${trA.result === 'win' ? '+' : '-'}$${Math.abs(trA.pnl).toFixed(0)} on ${trA.side}` : 'skip' },
          b: { bankroll: bankB, note: trB ? `${trB.result === 'win' ? '+' : '-'}$${Math.abs(trB.pnl).toFixed(0)} on ${trB.side}` : 'skip' },
        });
      });
      setSteps(combinedSteps);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) { setPlaying(false); return; }
    timer.current = setTimeout(() => setIdx((i) => i + 1), 550);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, idx, steps.length]);

  if (!agentA) return null;
  const step = steps[idx];
  const winning = step ? (step.a.bankroll >= step.b.bankroll ? "a" : "b") : "a";

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-xs tracking-widest text-primary">THE ARENA</div>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold"><Swords className="h-6 w-6" /> Head-to-head</h1>
        </div>
        <div className="flex gap-2">
          <select
            value={agentA.id}
            onChange={(e) => setAgentA(saved.find((s) => s.id === e.target.value) ?? agentA)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {saved.length === 0 && <option>{agentA.name}</option>}
            {saved.map((s) => <option key={s.id} value={s.id}>You: {s.name}</option>)}
          </select>
          <select
            value={agentB.id}
            onChange={(e) => {
              const found = saved.find((s) => s.id === e.target.value);
              setAgentB(found ?? OPPONENT);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value={OPPONENT.id}>Opponent: {OPPONENT.name}</option>
            {saved.filter((s) => s.id !== agentA.id).map((s) => <option key={s.id} value={s.id}>Opponent: {s.name}</option>)}
          </select>
          <input 
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Market (e.g. super-bowl-champion)"
            className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm mono"
          />
          <button onClick={runMatch} disabled={loading} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold glow-sky disabled:opacity-50 inline-flex items-center gap-2">
             <Swords className="h-4 w-4" /> {loading ? "Fetching..." : "Run Match"}
          </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="glass relative overflow-hidden rounded-2xl p-8">
        <div className="absolute inset-0 opacity-30" />
        <div className="relative grid grid-cols-3 items-center gap-6">
          <PlayerPanel side="sky" name={agentA.name} bankroll={step?.a.bankroll ?? 1000} note={step?.a.note ?? "—"} highlight={winning === "a"} />

          <div className="flex flex-col items-center">
            <div className="mono text-xs tracking-widest text-muted-foreground">TICK {idx + 1} / {steps.length}</div>
            <div className="text-6xl font-black text-gradient-vs">VS</div>
            <div className="mt-3 grid w-full max-w-[220px] gap-1 rounded-md border border-border/70 bg-background/60 p-3 mono text-[11px]">
              {step && (
                <>
                  <Row label="minute" value={step.tick.minute} />
                  <Row label="home" value={step.tick.home_odds} />
                  <Row label="draw" value={step.tick.draw_odds} />
                  <Row label="away" value={step.tick.away_odds} />
                  <Row label="move %" value={step.tick.market_move} />
                </>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setPlaying((p) => !p)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground glow-sky">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {playing ? "Pause" : "Play"}
              </button>
              <button onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <PlayerPanel side="rose" name={agentB.name} bankroll={step?.b.bankroll ?? 1000} note={step?.b.note ?? "—"} highlight={winning === "b"} />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TimelineCard side="sky" title={agentA.name} steps={steps} pick={(s) => s.a} idx={idx} onSelect={setIdx} />
        <TimelineCard side="rose" title={agentB.name} steps={steps} pick={(s) => s.b} idx={idx} onSelect={setIdx} />
      </div>

      <div className="mt-8 text-center">
        <Link to="/build" className="mono text-xs text-muted-foreground hover:text-primary">← back to strategy lab</Link>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function PlayerPanel({ side, name, bankroll, note, highlight }: { side: "sky" | "rose"; name: string; bankroll: number; note: string; highlight: boolean }) {
  const color = side === "sky" ? "var(--sky)" : "var(--rose)";
  return (
    <div className={`flex flex-col items-center gap-3 rounded-xl p-4 transition ${highlight ? (side === "sky" ? "glow-sky" : "glow-rose") : ""}`}>
      <AgentAvatar side={side} name={name} animated={highlight} />
      <div className="w-full rounded-lg border border-border/70 bg-background/60 p-3">
        <div className="mono text-[10px] text-muted-foreground">BANKROLL</div>
        <div className="text-3xl font-bold" style={{ color }}>${bankroll.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div className="mt-2 mono text-[11px] text-foreground/80 truncate">{note}</div>
      </div>
    </div>
  );
}

function TimelineCard({
  side, title, steps, pick, idx, onSelect,
}: { side: "sky" | "rose"; title: string; steps: BattleStep[]; pick: (s: BattleStep) => { bankroll: number; note: string }; idx: number; onSelect: (i: number) => void }) {
  const color = side === "sky" ? "var(--sky)" : "var(--rose)";
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="mono text-[10px] tracking-widest" style={{ color }}>{title}</div>
        <div className="mono text-[10px] text-muted-foreground">bankroll over time</div>
      </div>
      <Sparkline values={steps.map((s) => pick(s).bankroll)} color={color} />
      <div className="mt-3 max-h-56 space-y-1 overflow-auto pr-1">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full rounded px-2 py-1 text-left mono text-[11px] hover:bg-secondary ${i === idx ? "bg-secondary" : ""}`}
          >
            <span className="text-muted-foreground">t{String(i).padStart(2, "0")}</span>{" "}
            <span style={{ color }}>${pick(s).bankroll.toFixed(0)}</span>{" "}
            <span className="text-foreground/80">{pick(s).note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 400, h = 60;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-16 w-full">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
    </svg>
  );
}
