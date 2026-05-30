import { useCallback, useEffect, useRef, useState } from 'react';
import { isNfcSupported, normalizeTag } from '../utils/nfcUtils.js';

function extractNdefPayload(message) {
  if (!message?.records?.length) return '';

  for (const record of message.records) {
    try {
      if (record.recordType === 'text' || record.recordType === 'url') {
        return new TextDecoder(record.encoding || 'utf-8').decode(record.data);
      }
    } catch {
      return '';
    }
  }

  return '';
}

/**
 * Hook de Web NFC iniciado por gesto do usuario.
 *
 * Chame `start()` dentro de um onClick/onTouch. O hook nao inicia scan automaticamente.
 */
export function useNfcReader({ onRead } = {}) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [lastTag, setLastTag] = useState(null);
  const onReadRef = useRef(onRead);
  const abortRef = useRef(null);

  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setLastTag(null);

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setStatus('error');
      setError('A leitura NFC no navegador exige HTTPS.');
      return;
    }

    if (!isNfcSupported()) {
      setStatus('unsupported');
      setError('Este navegador nao expoe NDEFReader.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setStatus('starting');
      const ndef = new window.NDEFReader();

      ndef.onreadingerror = () => {
        controller.abort();
        setStatus('error');
        setError('Falha de leitura NFC.');
      };

      ndef.onreading = (event) => {
        controller.abort();
        const tag = normalizeTag(event.serialNumber || extractNdefPayload(event.message));
        const payload = {
          tag,
          serialNumber: event.serialNumber || '',
          ndefPayload: extractNdefPayload(event.message),
          records: Array.from(event.message?.records || []).map((record) => ({
            recordType: record.recordType,
            mediaType: record.mediaType,
            id: record.id,
          })),
        };
        setLastTag(payload);
        setStatus('done');
        onReadRef.current?.(payload);
      };

      await ndef.scan({ signal: controller.signal });
      setStatus('ready');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (err?.name === 'NotAllowedError') {
        setStatus('denied');
        setError('Permissao de NFC negada.');
        return;
      }
      if (err?.name === 'SecurityError') {
        setStatus('error');
        setError('A pagina precisa estar em HTTPS para usar Web NFC.');
        return;
      }
      setStatus('error');
      setError(err?.message || 'Nao foi possivel iniciar o NFC.');
    }
  }, []);

  return { status, error, lastTag, start, stop };
}
