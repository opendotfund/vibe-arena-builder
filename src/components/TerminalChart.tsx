import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TradeResult } from "../lib/backtester";
import type { Strategy } from "../lib/strategies";
import { useMemo } from "react";

export function TerminalChart({ 
  trades, 
  title, 
  pnlOnly = false 
}: { 
  trades: TradeResult[], 
  title?: string,
  pnlOnly?: boolean 
}) {
  const chartData = useMemo(() => {
    let cumulativePnl = 0;
    return trades.map(t => {
      cumulativePnl += t.pnl;
      return {
        timestamp: new Date(t.timestamp).toLocaleString(),
        pnl: cumulativePnl,
        odds: t.odds
      };
    });
  }, [trades]);

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);

  if (trades.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground border border-border/50 bg-background/50 rounded-xl">
        <div className="text-center font-mono text-sm tracking-widest">
          AWAITING SIMULATION DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col glass rounded-xl border border-border/50 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-2">
        <div className="font-mono text-xs tracking-widest text-primary flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {title || "TERMINAL_FEED_ACTIVE"}
        </div>
        <div className={`font-mono text-sm font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          PNL: {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
        </div>
      </div>
      
      {/* Main Chart Area */}
      <div className="flex-1 p-4 bg-[#0a0a0a]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#666" fontSize={10} tickFormatter={(val) => val.split(',')[0]} />
            <YAxis yAxisId="left" stroke="#666" fontSize={10} orientation="left" tickFormatter={(val) => `$${val}`} />
            {!pnlOnly && <YAxis yAxisId="right" stroke="#666" fontSize={10} orientation="right" />}
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
              labelStyle={{ color: '#888', fontSize: '10px', marginBottom: '4px' }}
            />
            
            <Line 
              yAxisId="left"
              type="stepAfter" 
              dataKey="pnl" 
              name="Cumulative PnL"
              stroke="#0ea5e9" 
              strokeWidth={2}
              dot={false}
              animationDuration={1500}
            />
            {!pnlOnly && (
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="odds" 
                name="Implied Odds"
                stroke="#444" 
                strokeWidth={1}
                dot={false}
                animationDuration={1500}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Terminal Footer / Ledger */}
      <div className="h-32 border-t border-border/50 bg-background/90 p-2 overflow-y-auto font-mono text-[10px]">
        {trades.slice().reverse().map((t, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-border/30 last:border-0 hover:bg-white/5 px-2">
            <span className="text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</span>
            <span>{t.market}</span>
            <span className={t.side === 'home' ? 'text-blue-400' : t.side === 'away' ? 'text-red-400' : 'text-gray-400'}>{t.side.toUpperCase()}</span>
            <span className="text-muted-foreground">{t.odds.toFixed(2)}x</span>
            <span className={t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
              {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
