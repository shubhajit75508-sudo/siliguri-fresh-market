import pkg from 'pg';
const { Client } = pkg;

async function test() {
  const configs = [
    // Pooler with project ref in username (transaction mode)
    {
      connectionString: 'postgresql://postgres.nkjqbgguuujlxebkjgfo:FLEmhNnJjkq3ipRJ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false },
    },
    // Pooler (session mode)
    {
      connectionString: 'postgresql://postgres.nkjqbgguuujlxebkjgfo:FLEmhNnJjkq3ipRJ@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
      ssl: { rejectUnauthorized: false },
    },
    // Direct with project ref in username
    {
      host: 'db.nkjqbgguuujlxebkjgfo.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres.nkjqbgguuujlxebkjgfo',
      password: 'FLEmhNnJjkq3ipRJ',
      ssl: { rejectUnauthorized: false },
    },
  ];

  for (const cfg of configs) {
    try {
      const c = new Client(cfg);
      await c.connect();
      const res = await c.query('SELECT current_user, version()');
      console.log(`Connected as ${res.rows[0].current_user}`);
      await c.end();
      return cfg;
    } catch (err) {
      const label = cfg.connectionString ? cfg.connectionString.slice(0, 70) : `${cfg.user}@${cfg.host}`;
      console.log(`Tried ${label}... FAILED: ${err.message.slice(0, 120)}`);
    }
  }
  console.log('All failed.');
}

test().catch(console.error);
