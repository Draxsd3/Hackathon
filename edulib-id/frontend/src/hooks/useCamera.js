import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_CONSTRAINTS = {
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
};

const BASIC_CONSTRAINTS = { video: true, audio: false };

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeCameraError(err) {
  const originalMessage = err?.message || 'Erro desconhecido ao acessar a camera.';
  const name = err?.name || 'CameraError';
  let message = originalMessage;

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    message = 'Permissao da camera bloqueada. Libere o acesso no navegador e tente novamente.';
  } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    message = 'Nenhuma camera foi encontrada neste dispositivo.';
  } else if (name === 'NotReadableError' || originalMessage.toLowerCase().includes('could not start video source')) {
    message = 'A camera esta em uso ou ficou presa. Feche outros apps com camera aberta e tente novamente.';
  } else if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    message = 'A camera nao aceitou a configuracao solicitada. Tentando uma configuracao mais simples.';
  } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    message = 'A camera so funciona em HTTPS ou localhost.';
  }

  return { name, message, technicalMessage: originalMessage };
}

async function requestCamera(constraints) {
  const attempts = [constraints, BASIC_CONSTRAINTS];
  let lastError = null;

  for (const attempt of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(attempt);
    } catch (err) {
      lastError = err;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') break;
      await wait(250);
    }
  }

  throw normalizeCameraError(lastError);
}

export function useCamera({ autoStart = true, constraints = DEFAULT_CONSTRAINTS } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);
  const desiredRunningRef = useRef(false);
  const requestIdRef = useRef(0);
  const [status, setStatus] = useState('idle'); // idle | starting | ready | error
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    desiredRunningRef.current = false;
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (!startingRef.current) setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    desiredRunningRef.current = true;
    if (streamRef.current) {
      setStatus('ready');
      return;
    }
    if (startingRef.current) {
      setStatus('starting');
      return;
    }

    const requestId = ++requestIdRef.current;
    startingRef.current = true;
    setStatus('starting');
    setError(null);
    try {
      const stream = await requestCamera(constraints);
      if (!desiredRunningRef.current || requestId !== requestIdRef.current) {
        stopStream(stream);
        setStatus('idle');
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('ready');
    } catch (err) {
      if (!desiredRunningRef.current || requestId !== requestIdRef.current) return;
      console.error('[useCamera] erro ao iniciar camera', err);
      setError(err?.message ? err : normalizeCameraError(err));
      setStatus('error');
    } finally {
      if (requestId === requestIdRef.current) startingRef.current = false;
    }
  }, [constraints]);

  useEffect(() => {
    if (autoStart) start();
    return () => stop();
  }, [autoStart, start, stop]);

  return { videoRef, status, error, start, stop };
}
