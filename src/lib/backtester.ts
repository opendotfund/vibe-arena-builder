import type { Strategy, Rule } from "./strategies";

export type TradeResult = {
  timestamp: number;
  market: string;
  side: string;
  odds: number;
  stakePct: number;
  pnl: number;
  result: "win" | "loss" | "pending";
};

// Mock historical market tick from predictiondata.dev format
export type MarketTick = {
  timestamp: number;
  home_odds: number;
  away_odds: number;
  implied_home_prob: number;
  market_move: number; // mock field
};

export class Backtester {
  private strategy: Strategy;
  private currentBankroll: number = 10000;
  public trades: TradeResult[] = [];

  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  // Evaluates a single tick against the rules engine
  evaluateTick(tick: MarketTick, marketId: string) {
    for (const rule of this.strategy.rules) {
      if (this.checkConditions(rule, tick)) {
        this.executeTrade(rule, tick, marketId);
        break; // First rule that matches fires
      }
    }
  }

  private checkConditions(rule: Rule, tick: MarketTick): boolean {
    if (rule.conditions.length === 0) return true;

    return rule.conditions.every((c) => {
      const fieldVal = (tick as any)[c.field] || 0;
      switch (c.op) {
        case ">": return fieldVal > c.value;
        case ">=": return fieldVal >= c.value;
        case "<": return fieldVal < c.value;
        case "<=": return fieldVal <= c.value;
        case "==": return fieldVal === c.value;
        default: return false;
      }
    });
  }

  private executeTrade(rule: Rule, tick: MarketTick, marketId: string) {
    if (rule.action.side === "skip") return;

    const stake = (this.currentBankroll * rule.action.stakePct) / 100;
    const odds = rule.action.side === "home" ? tick.home_odds : tick.away_odds;
    
    // Simulate outcome randomly for demo purposes (in reality we'd resolve at end of event)
    const won = Math.random() < (1 / odds);
    const pnl = won ? stake * (odds - 1) : -stake;
    this.currentBankroll += pnl;

    this.trades.push({
      timestamp: tick.timestamp,
      market: marketId,
      side: rule.action.side,
      odds,
      stakePct: rule.action.stakePct,
      pnl,
      result: won ? "win" : "loss",
    });
  }

  // Fetches historical data from predictiondata.dev
  static async fetchTicks(apiKey: string, marketSlug: string): Promise<MarketTick[]> {
    // Simulate fetching historical data from Polymarket via predictiondata.dev
    // In production we would use fetch() with the x-auth-token: apiKey header
    // and parse the CSV stream. We simulate 100 random ticks here.
    
    const startTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    const ticks: MarketTick[] = [];
    
    let currentHome = 1.5 + (Math.random() * 2);
    let currentAway = 1.2 + (Math.random() * 2);
    
    for (let i = 0; i < 100; i++) {
      currentHome = Math.max(1.01, currentHome + (Math.random() - 0.5) * 0.2);
      currentAway = Math.max(1.01, currentAway + (Math.random() - 0.5) * 0.2);
      
      ticks.push({
        timestamp: startTime + (i * 60 * 60 * 1000), // 1 hour intervals
        home_odds: currentHome,
        away_odds: currentAway,
        implied_home_prob: (1 / currentHome) * 100,
        market_move: (Math.random() - 0.5) * 5,
      });
    }
    return ticks;
  }

  // Evaluates a strategy against a set of ticks
  static runSimulation(strategy: Strategy, marketSlug: string, ticks: MarketTick[]): TradeResult[] {
    const tester = new Backtester(strategy);
    for (const tick of ticks) {
      tester.evaluateTick(tick, marketSlug);
    }
    return tester.trades;
  }
}
