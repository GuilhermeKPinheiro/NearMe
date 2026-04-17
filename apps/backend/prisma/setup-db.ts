import 'dotenv/config';
import { Client } from 'pg';

function parseDatabaseUrl(databaseUrl: string) {
  let url: URL;

  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error(
      'DATABASE_URL inválida. Se a senha tiver caracteres especiais como @, #, %, ?, + ou /, codifique a senha com encodeURIComponent antes de montar a URL.'
    );
  }

  const database = url.pathname.replace(/^\//, '');
  url.pathname = '/postgres';

  return {
    adminUrl: url.toString(),
    database,
    host: url.hostname,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const { adminUrl, database, host } = parseDatabaseUrl(databaseUrl);

  if (host.includes('supabase.co') || host.includes('pooler.supabase.com')) {
    console.log('DATABASE_URL aponta para um banco gerenciado do Supabase.');
    console.log('Nenhum CREATE DATABASE é necessário.');
    console.log('Use as migrations para criar o schema dentro do banco existente.');
    return;
  }

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
