const arduino = require('../config/arduino');
const eventService = require('../services/event.service');

async function openDoor(req, res, next) {
  try {
    const result = await arduino.send('A');

    // Loga o evento de abertura para auditoria (nao trava a resposta).
    eventService
      .create({
        type: 'door.opened',
        actor: req.body?.actor || 'face-auth',
        payload: {
          studentId: req.body?.studentId || null,
          method: req.body?.method || 'face',
          ...result,
        },
      })
      .catch(() => {});

    return res.json({
      success: true,
      message: 'Comando enviado para o Arduino',
      ...result,
    });
  } catch (err) {
    if (err.status === 503) {
      return res.status(503).json({
        success: false,
        message: 'Arduino nao conectado neste servidor',
        details: err.details || arduino.getStatus(),
      });
    }
    return next(err);
  }
}

function getStatus(req, res) {
  return res.json({ success: true, ...arduino.getStatus() });
}

module.exports = { openDoor, getStatus };
