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
      let fieldVal = (tick as any)[c.field] || 0;
      if (c.field === "bankroll_pct") {
        // Mocking 'bankroll used %' as a function of current bankroll vs starting 10000
        fieldVal = Math.max(0, 100 - ((this.currentBankroll / 10000) * 100));
      }
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

  // Evaluates a strategy against a set of ticks
  static runSimulation(strategy: Strategy, marketSlug: string, ticks: MarketTick[]): TradeResult[] {
    const tester = new Backtester(strategy);
    for (const tick of ticks) {
      tester.evaluateTick(tick, marketSlug);
    }
    return tester.trades;
  }
}
