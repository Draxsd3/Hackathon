/**
 * Integracao serial com Arduino (controle da fechadura).
 *
 * Importante: o pacote `serialport` falha ao instalar/abrir em ambientes sem
 * a porta fisica (Render, containers, etc.). Por isso:
 *   - O require e protegido por try/catch
 *   - A abertura da porta nao quebra o boot do servidor
 *   - O endpoint /api/abrir-porta retorna 503 amigavel se nao houver Arduino
 *
 * Configure no .env:
 *   SERIAL_PORT=COM3     (Windows) ou /dev/ttyACM0 (Linux)
 *   SERIAL_BAUD=9600
 *   SERIAL_ENABLED=true  (defina false para desativar mesmo com porta disponivel)
 */

let SerialPort = null;
try {
  ({ SerialPort } = require('serialport'));
} catch (err) {
  console.warn('[arduino] Pacote serialport indisponivel:', err.message);
}

const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const SERIAL_BAUD = Number(process.env.SERIAL_BAUD) || 9600;
const SERIAL_ENABLED = (process.env.SERIAL_ENABLED || 'true').toLowerCase() !== 'false';

let port = null;
let portError = null;

function initialize() {
  if (!SERIAL_ENABLED) {
    portError = new Error('Serial desativado (SERIAL_ENABLED=false)');
    return;
  }
  if (!SerialPort) {
    portError = new Error('Pacote serialport nao instalado neste ambiente');
    return;
  }

  try {
    port = new SerialPort({
      path: SERIAL_PORT,
      baudRate: SERIAL_BAUD,
      autoOpen: true,
    });

    port.on('open', () => {
      console.log(`[arduino] Porta serial aberta em ${SERIAL_PORT} @ ${SERIAL_BAUD} bps`);
      portError = null;
    });

    port.on('error', (err) => {
      console.warn('[arduino] Erro na porta serial:', err.message);
      portError = err;
    });

    port.on('close', () => {
      console.warn('[arduino] Porta serial fechada');
    });
  } catch (err) {
    console.warn('[arduino] Nao foi possivel abrir a porta serial:', err.message);
    portError = err;
    port = null;
  }
}

initialize();

function isAvailable() {
  return Boolean(port && port.isOpen);
}

function getStatus() {
  return {
    enabled: SERIAL_ENABLED,
    available: isAvailable(),
    path: SERIAL_PORT,
    baudRate: SERIAL_BAUD,
    error: portError ? portError.message : null,
  };
}

/**
 * Envia um caractere/comando ao Arduino. Resolve em sucesso, rejeita em
 * caso de erro (porta indisponivel ou falha de IO).
 */
function send(command) {
  return new Promise((resolve, reject) => {
    if (!isAvailable()) {
      const err = new Error('Porta serial nao esta disponivel');
      err.status = 503;
      err.details = getStatus();
      return reject(err);
    }
    port.write(String(command), (err) => {
      if (err) {
        err.status = 502;
        return reject(err);
      }
      resolve({ sent: String(command), at: new Date().toISOString() });
    });
  });
}

module.exports = { send, isAvailable, getStatus };
