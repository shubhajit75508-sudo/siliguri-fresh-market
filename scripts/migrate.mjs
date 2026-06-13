import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

const sql = readFileSync('supabase/migration.sql', 'utf8');

const client = new Client({
  connectionString: 'postgresql://postgres:FLEmhNnJjkq3ipRJ@db.nkjqbgguuujlxebkjgfo.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connected. Running migration...');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      await client.query(stmt + ';');
      success++;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate key') || msg.includes('already')) {
        success++;
        continue;
      }
      console.error(`FAILED: ${stmt.slice(0, 80)}...`);
      console.error(`  ${msg.slice(0, 200)}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} statements OK, ${failed} failed.`);
  await client.end();
}

main().catch((err) => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
