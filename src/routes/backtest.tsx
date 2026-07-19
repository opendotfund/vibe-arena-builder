import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Database, Loader2, ArrowRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

import { Backtester, type TradeResult } from "../lib/backtester";
import { type Strategy, loadStrategiesAsync } from "../lib/strategies";
import { streamToMotherDuck, fetchTicksFromMotherDuck } from "../lib/parquet-stream";
import { TerminalChart } from "../components/TerminalChart";

export const Route = createFileRoute("/backtest")({
  head: () => ({
    meta: [
      { title: "Backtesting Hub — AgentVS" },
      { name: "description", content: "Advanced historical trading terminal simulator." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    agent: typeof search.agent === "string" ? search.agent : undefined,
  }),
  component: BacktestHub,
});

function BacktestHub() {
  const { user } = useUser();
  const userId = user?.id;
  const search = Route.useSearch();

  const [list, setList] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [slug, setSlug] = useState("will-the-seattle-seahawks-win-super-bowl-2026");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TradeResult[]>([]);
  const [dbTable, setDbTable] = useState<string | null>(null);
  
  const uploadFn = useServerFn(streamToMotherDuck);
  const fetchTicksFn = useServerFn(fetchTicksFromMotherDuck);

  useEffect(() => {
    loadStrategiesAsync(userId).then(l => {
      setList(l);
      if (search.agent) {
        setSelectedStrategyId(search.agent);
      } else if (l.length > 0) {
        setSelectedStrategyId(l[0].id);
      }
    });
  }, [userId, search.agent]);

  const strategy = list.find(s => s.id === selectedStrategyId);

  const runBacktest = async () => {
    if (!strategy) return;
    setRunning(true);
    setResults([]);
    setDbTable(null);
    try {
      // In a real app we'd fetch this from the user's settings/env securely
      const apiKey = "vd_cJ6EjdkKC6s2ZMJ4kg8pWP8IyDsXoDoiS4wCAG0MG4fW";
      
      toast.info("Querying PredictionData via MotherDuck...");
      const ticks = await fetchTicksFn({ data: { slug, apiKey } });
      
      if (!ticks || ticks.length === 0) {
        throw new Error("No ticks returned for this market.");
      }

      const trades = Backtester.runSimulation(strategy, slug, ticks);
      setResults(trades);
      toast.success(`Simulation finished: ${trades.length} trades executed.`);
      
      const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      const updatedStrategy = {
        ...strategy,
        lastBacktest: {
          pnl: totalPnl,
          tradesCount: trades.length,
          timestamp: Date.now(),
          marketSlug: slug,
        }
      };
      
      // Save updated strategy with backtest results to the DB
      await import("../lib/strategies").then(m => m.upsertStrategyAsync(updatedStrategy, userId));
      setList(prev => prev.map(s => s.id === strategy.id ? updatedStrategy : s));
      
      // Upload Parquet to MotherDuck
      const res = await uploadFn({ data: { strategyId: strategy.id, trades } });
      if (res?.success) {
        setDbTable(res.table);
        toast.success("Streamed to MotherDuck seamlessly!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run simulation");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap shrink-0">
        <div>
          <div className="mono text-xs tracking-widest text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> TRADING TERMINAL
          </div>
          <h1 className="mt-1 text-3xl font-bold">Historical Backtesting Hub</h1>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Control Panel */}
        <div className="w-80 flex flex-col gap-6 shrink-0 overflow-y-auto pr-2">
          <div className="glass rounded-xl p-5 border border-border/50">
            <h3 className="font-semibold text-sm mb-4">Simulation Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Select Agent</label>
                <select 
                  value={selectedStrategyId}
                  onChange={e => setSelectedStrategyId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {list.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.rules.length} rules)</option>
                  ))}
                  {list.length === 0 && <option value="" disabled>No agents found</option>}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Market Slug</label>
                <div className="flex gap-2">
                  <select
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="w-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm shrink-0"
                  >
                    <option value="will-the-seattle-seahawks-win-super-bowl-2026">NFL 2026</option>
                    <option value="will-taylor-swift-endorse-kamala-harris">Taylor/Harris</option>
                    <option value="will-bitcoin-hit-100k-in-2024">BTC 100k (2024)</option>
                  </select>
                  <input 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)} 
                    placeholder="or type custom slug..." 
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mono outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={runBacktest} 
                disabled={running || !strategy || strategy.rules.length === 0}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground glow-rose disabled:opacity-50"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? "Simulating Market..." : "Run Simulation"}
              </button>
            </div>
          </div>

          {results.length > 0 && dbTable && (
            <div className="glass rounded-xl p-5 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-primary">MotherDuck Storage</div>
                  <div className="mono text-[10px] text-muted-foreground mt-0.5 break-all">{dbTable}</div>
                </div>
              </div>
              <a href="https://app.motherduck.com" target="_blank" rel="noreferrer" className="inline-flex w-full justify-center items-center gap-2 rounded-md bg-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors">
                Open in MotherDuck <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        {/* Right Terminal Area */}
        <div className="flex-1 min-w-0">
          <TerminalChart trades={results} title={`AGENT_${strategy?.id.substring(0,6) || "UNKNOWN"}`} />
        </div>
      </div>
    </main>
  );
}
