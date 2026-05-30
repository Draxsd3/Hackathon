const { Pool } = require('pg');
const env = require('./env');
const supabaseRest = require('./supabaseRest');

let pool;

function getPool() {
  if (!env.databaseUrl) {
    const err = new Error('DATABASE_URL nao configurada para conexao com Supabase/Postgres');
    err.status = 503;
    throw err;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

function query(text, params) {
  return getPool().query(text, params);
}

async function transaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function healthcheck() {
  if (supabaseRest.isEnabled()) {
    return supabaseRest.healthcheck();
  }

  const result = await query('select now() as server_time');
  return result.rows[0];
}

module.exports = { getPool, query, transaction, healthcheck };
