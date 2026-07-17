import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () => {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS completely
  );
};

export const getStrategiesDb = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { data: strategies, error } = await supabase
      .from("strategies")
      .select("*")
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return strategies.map(d => JSON.parse(d.strategy_json));
  });

export const upsertStrategyDb = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), strategyId: z.string(), strategyJson: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("strategies").upsert({
      id: data.strategyId,
      user_id: data.userId, // Requires user_id to be TEXT now
      strategy_json: data.strategyJson,
      updated_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteStrategyDb = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string(), strategyId: z.string() }))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("strategies").delete().eq("id", data.strategyId).eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });
