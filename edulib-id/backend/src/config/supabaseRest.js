const dns = require('dns');
const https = require('https');
const env = require('./env');

const resolver = new dns.Resolver();
if (env.supabaseDnsServers.length > 0) {
  resolver.setServers(env.supabaseDnsServers);
}

function isEnabled() {
  return env.dataProvider === 'supabase-rest';
}

function ensureConfig() {
  if (!env.supabaseUrl || !env.supabaseKey) {
    const err = new Error('SUPABASE_URL/SUPABASE_KEY nao configurados');
    err.status = 503;
    throw err;
  }
}

function lookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  if (env.supabaseDnsServers.length === 0) {
    dns.lookup(hostname, options, callback);
    return;
  }

  resolver.resolve4(hostname, (err, addresses) => {
    if (err) {
      callback(err);
      return;
    }

    if (options.all) {
      callback(null, addresses.map((address) => ({ address, family: 4 })));
      return;
    }

    callback(null, addresses[0], 4);
  });
}

const agent = new https.Agent({ lookup });

function makeError(status, body) {
  const message = body?.message || body?.error_description || body?.error || 'Erro na API do Supabase';
  const err = new Error(message);
  err.status = status;
  err.code = body?.code;
  err.details = body?.details;
  err.hint = body?.hint;
  return err;
}

function appendParams(url, params = {}) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, value);
    }
  }
}

function request(path, { method = 'GET', params, body, prefer, headers = {} } = {}) {
  ensureConfig();

  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const baseUrl = env.supabaseUrl.replace(/\/+$/, '');
  const url = new URL(`${baseUrl}/rest/v1/${normalizedPath}`);
  appendParams(url, params);

  const payload = body === undefined ? null : JSON.stringify(body);
  const requestHeaders = {
    apikey: env.supabaseKey,
    Authorization: `Bearer ${env.supabaseKey}`,
    Accept: 'application/json',
    ...headers,
  };

  if (payload) requestHeaders['Content-Type'] = 'application/json';
  if (prefer) requestHeaders.Prefer = prefer;

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method,
        headers: requestHeaders,
        agent,
        timeout: 15000,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (err) {
              parsed = { message: raw };
            }
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
            return;
          }

          reject(makeError(res.statusCode, parsed));
        });
      }
    );

    req.on('timeout', () => req.destroy(new Error('Timeout ao conectar na API do Supabase')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function select(table, { select: columns = '*', filters = {}, or, order, limit } = {}) {
  const params = { select: columns };

  for (const [column, filter] of Object.entries(filters)) {
    if (filter !== undefined && filter !== null && filter !== '') params[column] = filter;
  }

  if (or && or.length) params.or = `(${or.join(',')})`;
  if (order) params.order = Array.isArray(order) ? order.join(',') : order;
  if (limit) params.limit = String(limit);

  return request(table, { params });
}

function insert(table, row) {
  return request(table, {
    method: 'POST',
    body: row,
    prefer: 'return=representation',
  });
}

function update(table, filters, patch) {
  return request(table, {
    method: 'PATCH',
    params: filters,
    body: patch,
    prefer: 'return=representation',
  });
}

function remove(table, filters) {
  return request(table, {
    method: 'DELETE',
    params: filters,
    prefer: 'return=representation',
  });
}

async function healthcheck() {
  await select('students', { select: 'id', limit: 1 });
  return { server_time: new Date().toISOString() };
}

module.exports = { isEnabled, select, insert, update, remove, request, healthcheck };
