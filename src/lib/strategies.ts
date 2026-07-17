// Shared strategy types and localStorage helpers. Client-safe.

export type ConditionField =
  | "home_odds"
  | "away_odds"
  | "draw_odds"
  | "implied_home_prob"
  | "implied_away_prob"
  | "market_move"
  | "minutes_to_kickoff"
  | "bankroll_pct";

export type Operator = ">" | ">=" | "<" | "<=" | "==";

export type Condition = {
  id: string;
  field: ConditionField;
  op: Operator;
  value: number;
};

export type ActionSide = "home" | "away" | "draw" | "skip";

export type Rule = {
  id: string;
  name: string;
  conditions: Condition[];
  action: {
    side: ActionSide;
    stakePct: number; // 0..100
  };
};

export type Strategy = {
  id: string;
  name: string;
  description: string;
  rules: Rule[];
  createdAt: number;
  updatedAt: number;
};

export const FIELD_LABELS: Record<ConditionField, string> = {
  home_odds: "Home odds",
  away_odds: "Away odds",
  draw_odds: "Draw odds",
  implied_home_prob: "Implied home %",
  implied_away_prob: "Implied away %",
  market_move: "Market move % (last 5m)",
  minutes_to_kickoff: "Mins to kickoff",
  bankroll_pct: "Bankroll used %",
};

const KEY = "agentvs.strategies.v1";

export function loadStrategies(): Strategy[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Strategy[];
  } catch {
    return [];
  }
}

export function saveStrategies(list: Strategy[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsertStrategy(s: Strategy) {
  const list = loadStrategies();
  const idx = list.findIndex((x) => x.id === s.id);
  if (idx >= 0) list[idx] = s;
  else list.unshift(s);
  saveStrategies(list);
}

export function deleteStrategy(id: string) {
  saveStrategies(loadStrategies().filter((s) => s.id !== id));
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyStrategy(): Strategy {
  const now = Date.now();
  return {
    id: newId(),
    name: "Untitled strategy",
    description: "",
    rules: [
      {
        id: newId(),
        name: "Value bet on home underdog",
        conditions: [
          { id: newId(), field: "home_odds", op: ">=", value: 2.5 },
          { id: newId(), field: "implied_home_prob", op: "<", value: 45 },
        ],
        action: { side: "home", stakePct: 5 },
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Human-readable pseudo-code for a strategy. Used both for display and as the
 * canonical export format when importing/exporting.
 */
export function strategyToPseudocode(s: Strategy): string {
  const lines: string[] = [];
  lines.push(`STRATEGY "${s.name}"`);
  if (s.description) lines.push(`# ${s.description}`);
  s.rules.forEach((r, i) => {
    lines.push("");
    lines.push(`RULE ${i + 1}: ${r.name}`);
    lines.push("  WHEN");
    r.conditions.forEach((c, j) => {
      const prefix = j === 0 ? "   " : "   AND";
      lines.push(`${prefix} ${FIELD_LABELS[c.field]} ${c.op} ${c.value}`);
    });
    if (r.action.side === "skip") {
      lines.push(`  THEN SKIP`);
    } else {
      lines.push(`  THEN BET ${r.action.stakePct}% of bankroll on ${r.action.side.toUpperCase()}`);
    }
  });
  return lines.join("\n");
}
