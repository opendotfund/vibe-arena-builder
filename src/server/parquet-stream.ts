import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import duckdb from "duckdb";

const getDb = () => {
  const token = process.env.MOTHERDUCK_TOKEN;
  if (!token) throw new Error("MOTHERDUCK_TOKEN is missing");
  // md: prefix connects to MotherDuck cloud
  return new duckdb.Database(`md:?motherduck_token=${token}`);
};

export const streamToMotherDuck = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        strategyId: z.string(),
        trades: z.array(
          z.object({
            timestamp: z.number(),
            market: z.string(),
            side: z.string(),
            odds: z.number(),
            stakePct: z.number(),
            pnl: z.number(),
            result: z.enum(["win", "loss", "pending"]),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    return new Promise((resolve, reject) => {
      try {
        const db = getDb();
        const con = db.connect();

        // Create a unique table name for this backtest run
        const tableName = `backtest_${data.strategyId.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

        // Create table in MotherDuck
        con.run(
          `CREATE TABLE ${tableName} (timestamp UBIGINT, market VARCHAR, side VARCHAR, odds DOUBLE, stakePct DOUBLE, pnl DOUBLE, result VARCHAR)`,
          (err) => {
            if (err) return reject(err);

            // Use DuckDB Appender to stream rows directly into MotherDuck
            const appender = con.appender(tableName);
            for (const t of data.trades) {
              appender.appendRow([t.timestamp, t.market, t.side, t.odds, t.stakePct, t.pnl, t.result]);
            }
            
            appender.close((closeErr) => {
              if (closeErr) return reject(closeErr);
              resolve({ success: true, table: tableName });
            });
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  });
