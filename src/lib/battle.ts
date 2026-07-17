import type { Condition, Rule, Strategy } from "./strategies";

// Deterministic pseudo-random so battles are reproducible per seed.
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type MarketTick = {
  minute: number;
  home_odds: number;
  away_odds: number;
  draw_odds: number;
  implied_home_prob: number;
  implied_away_prob: number;
  market_move: number;
  minutes_to_kickoff: number;
  bankroll_pct: number;
};

export type BattleStep = {
  tick: MarketTick;
  a: { bankroll: number; note: string };
  b: { bankroll: number; note: string };
};

export function generateMarket(seed = 42, ticks = 20): MarketTick[] {
  const rand = mulberry32(seed);
  let home = 2.0 + rand() * 1.5;
  let away = 2.0 + rand() * 1.5;
  let draw = 3.0 + rand() * 0.8;
  const out: MarketTick[] = [];
  for (let i = 0; i < ticks; i++) {
    const move = (rand() - 0.5) * 0.4;
    home = Math.max(1.2, home + move);
    away = Math.max(1.2, away - move * 0.7);
    draw = Math.max(2.4, draw + (rand() - 0.5) * 0.15);
    const ih = (1 / home) * 100;
    const ia = (1 / away) * 100;
    out.push({
      minute: i,
      home_odds: +home.toFixed(2),
      away_odds: +away.toFixed(2),
      draw_odds: +draw.toFixed(2),
      implied_home_prob: +ih.toFixed(1),
      implied_away_prob: +ia.toFixed(1),
      market_move: +(move * 100).toFixed(1),
      minutes_to_kickoff: Math.max(0, 30 - i),
      bankroll_pct: 0,
    });
  }
  return out;
}

function condMatches(c: Condition, tick: MarketTick, bankrollPctUsed: number): boolean {
  const val = c.field === "bankroll_pct" ? bankrollPctUsed : (tick as any)[c.field];
  switch (c.op) {
    case ">": return val > c.value;
    case ">=": return val >= c.value;
    case "<": return val < c.value;
    case "<=": return val <= c.value;
    case "==": return val === c.value;
  }
}

function firstMatchingRule(strategy: Strategy, tick: MarketTick, bankrollPctUsed: number): Rule | null {
  for (const r of strategy.rules) {
    if (r.conditions.length === 0) continue;
    if (r.conditions.every((c) => condMatches(c, tick, bankrollPctUsed))) return r;
  }
  return null;
}

/**
 * Toy simulator: each rule that fires places a bet. Outcome is random but
 * weighted by the market's implied probability at that tick.
 */
export function simulate(a: Strategy, b: Strategy, seed = 7): BattleStep[] {
  const market = generateMarket(seed);
  const rand = mulberry32(seed + 1);

  const state = {
    a: { bankroll: 1000, staked: 0 },
    b: { bankroll: 1000, staked: 0 },
  };

  const steps: BattleStep[] = [];

  for (const tick of market) {
    const step: BattleStep = {
      tick,
      a: { bankroll: state.a.bankroll, note: "hold" },
      b: { bankroll: state.b.bankroll, note: "hold" },
    };

    for (const key of ["a", "b"] as const) {
      const strat = key === "a" ? a : b;
      const s = state[key];
      const usedPct = (s.staked / 1000) * 100;
      const rule = firstMatchingRule(strat, tick, usedPct);
      if (!rule || rule.action.side === "skip") continue;
      const stake = (s.bankroll * rule.action.stakePct) / 100;
      if (stake < 1) continue;
      const oddsMap: Record<string, number> = {
        home: tick.home_odds,
        away: tick.away_odds,
        draw: tick.draw_odds,
      };
      const odds = oddsMap[rule.action.side];
      const trueProb = 1 / odds;
      const win = rand() < trueProb;
      const pnl = win ? stake * (odds - 1) : -stake;
      s.bankroll = +(s.bankroll + pnl).toFixed(2);
      s.staked += stake;
      step[key] = {
        bankroll: s.bankroll,
        note: `${win ? "WIN" : "LOSS"} ${rule.action.side.toUpperCase()} @ ${odds} (${rule.name})`,
      };
    }
    steps.push(step);
  }
  return steps;
}
