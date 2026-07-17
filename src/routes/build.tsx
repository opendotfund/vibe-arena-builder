import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles, Save, Play, FileCode2, Loader2 } from "lucide-react";

import {
  type ConditionField,
  type Operator,
  type Strategy,
  type Rule,
  FIELD_LABELS,
  emptyStrategy,
  loadStrategies,
  upsertStrategy,
  deleteStrategy,
  newId,
  strategyToPseudocode,
} from "@/lib/strategies";
import { importStrategy } from "@/lib/import-strategy.functions";
import { BacktestPanel } from "@/components/BacktestPanel";

export const Route = createFileRoute("/build")({
  head: () => ({
    meta: [
      { title: "Build your agent — AgentVS" },
      { name: "description", content: "Drag-and-drop rules or import your strategy in plain English." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    new: search.new ? 1 : undefined,
  }),
  component: Build,
});

const FIELDS: ConditionField[] = [
  "home_odds", "away_odds", "draw_odds",
  "implied_home_prob", "implied_away_prob",
  "market_move", "minutes_to_kickoff", "bankroll_pct",
];
const OPS: Operator[] = [">", ">=", "<", "<=", "=="];

function Build() {
  const navigate = useNavigate();
  const [list, setList] = useState<Strategy[]>([]);
  const [current, setCurrent] = useState<Strategy>(() => emptyStrategy());
  const [importOpen, setImportOpen] = useState(false);

  const search = Route.useSearch();

  useEffect(() => {
    const l = loadStrategies();
    setList(l);
    if (l[0]) setCurrent(l[0]);
  }, []);

  useEffect(() => {
    if (search.new) {
      setCurrent(emptyStrategy());
      navigate({ to: "/build", search: {}, replace: true });
    }
  }, [search.new, navigate]);

  const update = (patch: Partial<Strategy>) => setCurrent((s) => ({ ...s, ...patch, updatedAt: Date.now() }));

  const updateRule = (rid: string, patch: Partial<Rule>) =>
    update({ rules: current.rules.map((r) => (r.id === rid ? { ...r, ...patch } : r)) });

  const addRule = () =>
    update({
      rules: [
        ...current.rules,
        { id: newId(), name: `Rule ${current.rules.length + 1}`, conditions: [], action: { side: "home", stakePct: 2 } },
      ],
    });

  const save = () => {
    upsertStrategy(current);
    setList(loadStrategies());
    toast.success("Strategy saved");
  };

  const remove = (id: string) => {
    deleteStrategy(id);
    const l = loadStrategies();
    setList(l);
    if (current.id === id) setCurrent(l[0] ?? emptyStrategy());
  };

  const newStrat = () => setCurrent(emptyStrategy());

  const sendToBattle = () => {
    upsertStrategy(current);
    navigate({ to: "/vs", search: { a: current.id } });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="mono text-xs tracking-widest text-primary">STRATEGY LAB</div>
          <h1 className="mt-1 text-3xl font-bold">Build your agent</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
            <Sparkles className="h-4 w-4 text-primary" /> Import with AI
          </button>
          <button onClick={newStrat} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
            <Plus className="h-4 w-4" /> New
          </button>
          <button onClick={save} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground glow-sky">
            <Save className="h-4 w-4" /> Save
          </button>
          <button onClick={sendToBattle} className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground glow-rose">
            <Play className="h-4 w-4" /> Battle
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr_320px]">
        {/* Saved strategies */}
        <aside className="glass rounded-xl p-3 h-fit">
          <div className="mono text-[10px] text-muted-foreground px-2 py-1 tracking-widest">MY AGENTS</div>
          {list.length === 0 && <div className="px-2 py-6 text-xs text-muted-foreground">No agents yet. Save one to see it here.</div>}
          <ul className="space-y-1">
            {list.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setCurrent(s)}
                  className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-secondary ${current.id === s.id ? "bg-secondary" : ""}`}
                >
                  <div className="truncate font-medium">{s.name}</div>
                  <div className="mono text-[10px] text-muted-foreground">{s.rules.length} rules</div>
                </button>
                <button onClick={() => remove(s.id)} className="ml-auto text-[10px] text-muted-foreground hover:text-destructive px-2">delete</button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Rule editor */}
        <section className="glass rounded-xl p-6">
          <input
            value={current.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full bg-transparent text-2xl font-bold outline-none"
          />
          <input
            value={current.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Short description…"
            className="mt-1 w-full bg-transparent text-sm text-muted-foreground outline-none"
          />

          <div className="mt-6 space-y-4">
            {current.rules.map((rule, idx) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                index={idx}
                onChange={(p) => updateRule(rule.id, p)}
                onDelete={() => update({ rules: current.rules.filter((r) => r.id !== rule.id) })}
              />
            ))}
            <button
              onClick={addRule}
              className="w-full rounded-lg border border-dashed border-border/70 py-4 text-sm text-muted-foreground hover:bg-secondary"
            >
              <Plus className="mr-1 inline h-4 w-4" /> Add rule
            </button>
          </div>
        </section>

        {/* Pseudocode preview & Backtest */}
        <div className="flex flex-col gap-6 h-fit sticky top-24">
          <aside className="glass rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2 mono text-[10px] text-muted-foreground tracking-widest">
              <FileCode2 className="h-3.5 w-3.5" /> AGENT PROGRAM
            </div>
            <pre className="mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/90">
  {strategyToPseudocode(current)}
            </pre>
            <div className="mt-4 text-[11px] text-muted-foreground">
              This is the program your agent runs each market tick. Rules are evaluated top-to-bottom; the first matching rule fires.
            </div>
            <Link to="/vs" search={{ a: current.id }} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground glow-rose">
              <Play className="h-4 w-4" /> Send to arena
            </Link>
          </aside>

          <BacktestPanel strategy={current} />
        </div>
      </div>

      {importOpen && <ImportDialog onClose={() => setImportOpen(false)} onImport={(s) => { setCurrent({ ...s, id: newId(), createdAt: Date.now(), updatedAt: Date.now() }); setImportOpen(false); toast.success("Strategy imported"); }} />}
    </main>
  );
}

function RuleCard({
  rule, index, onChange, onDelete,
}: { rule: Rule; index: number; onChange: (p: Partial<Rule>) => void; onDelete: () => void }) {
  const addCondition = () =>
    onChange({
      conditions: [...rule.conditions, { id: newId(), field: "home_odds", op: ">=", value: 2 }],
    });

  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-4">
      <div className="flex items-center gap-3">
        <span className="mono text-[10px] rounded bg-primary/20 text-primary px-2 py-0.5">RULE {index + 1}</span>
        <input
          value={rule.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 bg-transparent font-semibold outline-none"
        />
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="mt-3 space-y-2">
        <div className="mono text-[10px] text-muted-foreground tracking-widest">WHEN</div>
        {rule.conditions.map((c, i) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            {i > 0 && <span className="mono text-[10px] text-primary">AND</span>}
            <select
              value={c.field}
              onChange={(e) => onChange({ conditions: rule.conditions.map((x) => x.id === c.id ? { ...x, field: e.target.value as ConditionField } : x) })}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              {FIELDS.map((f) => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
            </select>
            <select
              value={c.op}
              onChange={(e) => onChange({ conditions: rule.conditions.map((x) => x.id === c.id ? { ...x, op: e.target.value as Operator } : x) })}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm mono"
            >
              {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input
              type="number"
              step="0.1"
              value={c.value}
              onChange={(e) => onChange({ conditions: rule.conditions.map((x) => x.id === c.id ? { ...x, value: parseFloat(e.target.value) || 0 } : x) })}
              className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm mono"
            />
            <button
              onClick={() => onChange({ conditions: rule.conditions.filter((x) => x.id !== c.id) })}
              className="text-muted-foreground hover:text-destructive"
            ><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button onClick={addCondition} className="mono text-[11px] text-primary hover:underline">+ add condition</button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="mono text-[10px] text-muted-foreground tracking-widest">THEN</div>
        <select
          value={rule.action.side}
          onChange={(e) => onChange({ action: { ...rule.action, side: e.target.value as Rule["action"]["side"] } })}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="home">BET on HOME</option>
          <option value="away">BET on AWAY</option>
          <option value="draw">BET on DRAW</option>
          <option value="skip">SKIP</option>
        </select>
        {rule.action.side !== "skip" && (
          <>
            <span className="mono text-xs text-muted-foreground">stake</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={rule.action.stakePct}
              onChange={(e) => onChange({ action: { ...rule.action, stakePct: parseFloat(e.target.value) || 0 } })}
              className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm mono"
            />
            <span className="mono text-xs text-muted-foreground">% of bankroll</span>
          </>
        )}
      </div>
    </div>
  );
}

function ImportDialog({ onClose, onImport }: { onClose: () => void; onImport: (s: Strategy) => void }) {
  const [text, setText] = useState("Bet 3% on the home team whenever their odds are 2.5 or higher and the implied probability is below 45%. If we've already used more than 30% of bankroll, skip.");
  const [busy, setBusy] = useState(false);
  const run = useServerFn(importStrategy);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setText(ev.target.result as string);
    };
    reader.readAsText(file);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const parsed = await run({ data: { text } });
      const strat: Strategy = {
        ...parsed,
        id: newId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onImport(strat);
    } catch (e: any) {
      toast.error(e?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur">
      <div className="glass w-full max-w-2xl rounded-xl p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Import strategy in plain English</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your betting logic or upload an algorithmic trading script (MQL4/MQL5). Gemini converts it into structured rules your agent can run.
        </p>
        <div className="mt-4 flex items-center">
           <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
             <FileCode2 className="h-4 w-4" /> Upload .mq4 / .mq5 file
             <input type="file" accept=".mq4,.mq5,.txt" className="hidden" onChange={handleFileUpload} />
           </label>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mt-4 w-full rounded-md border border-border bg-background/60 p-3 text-sm mono outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">Cancel</button>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-sky disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Converting…" : "Convert with Gemini"}
          </button>
        </div>
      </div>
    </div>
  );
}
