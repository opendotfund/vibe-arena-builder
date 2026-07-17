import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:tSRLUO1tSHEeQUMt@db.pmnttfsqzcjxssqoskuo.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      strategy_json TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  
  await client.query(`
    ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
    
    DO $$ BEGIN
      CREATE POLICY select_own_strategies ON strategies FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    
    DO $$ BEGIN
      CREATE POLICY insert_own_strategies ON strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE POLICY update_own_strategies ON strategies FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE POLICY delete_own_strategies ON strategies FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  console.log("Table strategies created and RLS configured!");
  await client.end();
}

run().catch(console.error);
