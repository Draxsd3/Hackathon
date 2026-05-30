import { api, USE_BACKEND } from './api.js';

// O endpoint /api/abrir-porta fica SEM o prefixo /v1 (compatibilidade com o
// snippet original). Aqui calculamos a URL irmã do baseURL configurado.
function buildDoorUrl(path) {
  const base = api.defaults.baseURL || '';
  const root = String(base).replace(/\/api\/v1\/?$/, '');
  return `${root}${path}`;
}

export const doorService = {
  /**
   * Dispara a abertura da fechadura via Arduino conectado ao backend.
   * Fire-and-forget: nao bloqueia o fluxo do chamador. Falhas (Arduino
   * desconectado, backend offline) sao apenas logadas.
   *
   * @param {object} meta - studentId, method, actor (opcional, vai pro evento)
   */
  async open(meta = {}) {
    if (!USE_BACKEND) return null;
    try {
      const response = await api.post(buildDoorUrl('/api/abrir-porta'), meta, { baseURL: '' });
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        console.info('[door] Arduino indisponivel no servidor (503)');
      } else {
        console.warn('[door] open failed:', err.message);
      }
      return null;
    }
  },

  async status() {
    if (!USE_BACKEND) return { available: false, reason: 'backend desabilitado' };
    try {
      const response = await api.get(buildDoorUrl('/api/door/status'), { baseURL: '' });
      return response.data;
    } catch (err) {
      return { available: false, reason: err.message };
    }
  },
};
