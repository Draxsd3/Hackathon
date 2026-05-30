const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`[edulib-id] API rodando em http://localhost:${env.port}`);
    console.log(`[edulib-id] CORS liberado para: ${env.corsOrigin.join(', ')}`);
  });
}

module.exports = app;
