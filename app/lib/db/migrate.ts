import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Please set it in .env or your environment.');
    process.exit(1);
  }

  console.log('🔄 Running migrations from ./drizzle ...');
  const sql = neon(connectionString);
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations applied successfully!');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
