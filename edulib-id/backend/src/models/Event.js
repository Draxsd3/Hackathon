/**
 * Log de eventos generico (auditoria/observabilidade).
 * type: 'student.created' | 'session.entry' | 'session.exit' | 'loan.created' | 'loan.returned' | etc.
 */
function buildEvent({ id, type, payload, timestamp, actor }) {
  return {
    id,
    type,
    payload: payload || {},
    actor: actor || 'system',
    timestamp: timestamp || new Date().toISOString(),
  };
}

module.exports = { buildEvent };
