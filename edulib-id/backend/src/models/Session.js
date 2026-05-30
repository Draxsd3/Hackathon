/**
 * Sessao = registro de entrada/saida na biblioteca.
 * type: 'entry' | 'exit'
 * method: 'face' | 'qr' | 'manual'
 */
function buildSession({ id, studentId, type, method, timestamp, notes }) {
  return {
    id,
    studentId,
    type,
    method: method || 'manual',
    timestamp: timestamp || new Date().toISOString(),
    notes: notes || null,
  };
}

module.exports = { buildSession };
