import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Uses the user-supplied Gemini API key (stored as GEMINI_API_KEY) to convert
// free-form strategy text into our Strategy JSON shape.

const ConditionSchema = z.object({
  id: z.string(),
  field: z.enum([
    "home_odds",
    "away_odds",
    "draw_odds",
    "implied_home_prob",
    "implied_away_prob",
    "market_move",
    "minutes_to_kickoff",
    "bankroll_pct",
  ]),
  op: z.enum([">", ">=", "<", "<=", "=="]),
  value: z.number(),
});

const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  conditions: z.array(ConditionSchema),
  action: z.object({
    side: z.enum(["home", "away", "draw", "skip"]),
    stakePct: z.number().min(0).max(100),
  }),
});

const StrategySchema = z.object({
  name: z.string(),
  description: z.string().default(""),
  rules: z.array(RuleSchema),
});

const SYSTEM_PROMPT = `You convert a user's free-form sports-betting strategy into strict JSON.

Return ONLY JSON matching this TypeScript type:

{
  "name": string,
  "description": string,
  "rules": Array<{
    "id": string,
    "name": string,
    "conditions": Array<{
      "id": string,
      "field": "home_odds" | "away_odds" | "draw_odds" | "implied_home_prob" | "implied_away_prob" | "market_move" | "minutes_to_kickoff" | "bankroll_pct",
      "op": ">" | ">=" | "<" | "<=" | "==",
      "value": number
    }>,
    "action": {
      "side": "home" | "away" | "draw" | "skip",
      "stakePct": number
    }
  }>
}

Use short lowercase IDs like "r1", "c1". Prefer 1-4 rules and 1-3 conditions per rule. Stake percentages should be modest (0.5–10). Do not invent fields or operators outside the enums.`;

export const importStrategy = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ text: z.string().min(3) }).parse(data))
  .handler(async ({ data }) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: data.text }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 400)}`);
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Model did not return valid JSON");
    }
    const strategy = StrategySchema.parse(parsed);
    return strategy;
  });
