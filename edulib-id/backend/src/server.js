const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const doorRoutes = require('./routes/door.routes');
const doorController = require('./controllers/door.controller');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

function stripTrailingSlash(value) {
  return (value || '').replace(/\/+$/, '');
}

// Lista de origens permitidas, normalizada (sem barra no final).
const allowedOrigins = env.corsOrigin.map(stripTrailingSlash).filter(Boolean);

// Padroes Vercel: previews/branches reusam o dominio base (hackathon-*.vercel.app).
// Quando uma origem permitida termina em ".vercel.app", aceitamos o mesmo projeto
// em qualquer subdominio gerado pela Vercel (preview, branch, deployment hash).
const vercelProjectPatterns = allowedOrigins
  .map((origin) => {
    try {
      const { hostname } = new URL(origin);
      if (!hostname.endsWith('.vercel.app')) return null;
      // Extrai o slug do projeto (parte antes do primeiro hifen na primeira label).
      const projectSlug = hostname.split('.')[0].split('-')[0];
      if (!projectSlug) return null;
      return new RegExp(`^https?://${projectSlug}(-[a-z0-9]+)*\\.vercel\\.app$`, 'i');
    } catch {
      return null;
    }
  })
  .filter(Boolean);

function isAllowedDevOrigin(origin) {
  if (env.isProduction || !origin) return false;
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(url.hostname)
      || /^10\./.test(url.hostname)
      || /^192\.168\./.test(url.hostname)
      || /^172\.(1[6-9]|2\d|3[0-1])\./.test(url.hostname);
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // requisicoes sem origem (curl, app nativo) passam
  const normalized = stripTrailingSlash(origin);
  if (allowedOrigins.includes(normalized)) return true;
  if (vercelProjectPatterns.some((pattern) => pattern.test(normalized))) return true;
  if (isAllowedDevOrigin(origin)) return true;
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    console.warn(`[cors] origem rejeitada: ${origin}`);
    callback(new Error(`Origem CORS nao permitida: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use('/api/v1', routes);

// Controle da fechadura via Arduino (porta serial USB).
// /api/door/open   - POST envia 'A' ao Arduino (path canonico)
// /api/door/status - GET diagnostico da porta serial
// /api/abrir-porta - POST alias por compatibilidade
app.use('/api/door', doorRoutes);
app.post('/api/abrir-porta', doorController.openDoor);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`[edulib-id] API rodando em http://localhost:${env.port}`);
    console.log(`[edulib-id] CORS liberado para: ${env.corsOrigin.join(', ')}`);
  });
}

module.exports = app;
