import 'dotenv/config';
import { Client } from 'pg';

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, '');
  url.pathname = '/postgres';

  return {
    adminUrl: url.toString(),
    database,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const { adminUrl, database } = parseDatabaseUrl(databaseUrl);
  const client = new Client({ connectionString: adminUrl });

  await client.connect();

  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);

  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${database}"`);
    console.log(`Database ${database} created`);
  } else {
    console.log(`Database ${database} already exists`);
  }

  await client.end();
}

void main();
