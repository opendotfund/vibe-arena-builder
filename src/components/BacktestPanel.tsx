import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Play, Database, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Backtester, type TradeResult } from "../lib/backtester";
import type { Strategy } from "../lib/strategies";
import { streamToMotherDuck } from "../server/parquet-stream";

export function BacktestPanel({ strategy }: { strategy: Strategy }) {
  const [slug, setSlug] = useState("super-bowl-champion-2026-731");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TradeResult[]>([]);
  const [dbTable, setDbTable] = useState<string | null>(null);
  
  const uploadFn = useServerFn(streamToMotherDuck);

  const runBacktest = async () => {
    setRunning(true);
    setResults([]);
    setDbTable(null);
    try {
      // In a real app we'd fetch this from the user's settings/env securely
      const apiKey = "vd_cJ6EjdkKC6s2ZMJ4kg8pWP8IyDsXoDoiS4wCAG0MG4fW";
      
      const ticks = await Backtester.fetchTicks(apiKey, slug);
      const trades = Backtester.runSimulation(strategy, slug, ticks);
      setResults(trades);
      toast.success(`Simulation finished: ${trades.length} trades executed.`);
      
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

  const totalPnL = results.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="mt-8 glass rounded-xl p-6 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" /> Backtest Strategy
          </h3>
          <p className="text-sm text-muted-foreground">Simulate against historical Polymarket data via predictiondata.dev</p>
        </div>
      </div>
      
      <div className="flex gap-3 mb-6">
        <input 
          value={slug} 
          onChange={e => setSlug(e.target.value)} 
          placeholder="Market slug (e.g., super-bowl-champion-2026-731)" 
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm mono outline-none"
        />
        <button 
          onClick={runBacktest} 
          disabled={running || strategy.rules.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground glow-rose disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-background/50 p-4 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total PnL</div>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg bg-background/50 p-4 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Win Rate</div>
              <div className="text-2xl font-bold">
                {((results.filter(t => t.result === 'win').length / results.length) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          {dbTable && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-primary">Saved to MotherDuck</div>
                  <div className="mono text-xs text-muted-foreground mt-0.5">Table: {dbTable}</div>
                </div>
              </div>
              <a href="https://app.motherduck.com" target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                Query now <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
