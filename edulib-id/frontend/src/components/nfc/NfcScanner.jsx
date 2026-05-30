import { useEffect, useRef, useState } from 'react';
import { Nfc, CircleOff, Loader2, CheckCircle2 } from 'lucide-react';
import { formatTag, normalizeTag } from '../../utils/nfcUtils.js';

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
 * Componente de leitura NFC com feedback visual.
 * A leitura so inicia pelo botao "Ler NFC", preservando a exigencia de gesto do usuario da Web NFC.
 */
export function NfcScanner({ active = true, onRead, hint }) {
  const abortRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [lastTag, setLastTag] = useState(null);

  useEffect(() => {
    if (active) return undefined;
    abortRef.current?.abort();
    setStatus('idle');
    setError('');
    setLastTag(null);
    return undefined;
  }, [active]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const startScan = async () => {
    setLastTag(null);
    setError('');

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setStatus('error');
      setError('A leitura NFC no navegador exige HTTPS.');
      return;
    }

    if (!('NDEFReader' in window)) {
      setStatus('unsupported');
      setError('Este navegador nao expoe NDEFReader. Use Android com Chrome ou Edge.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('starting');

    try {
      const reader = new window.NDEFReader();
      reader.onreadingerror = () => {
        controller.abort();
        setStatus('error');
        setError('Falha na leitura. Aproxime a etiqueta novamente.');
      };
      reader.onreading = (event) => {
        controller.abort();
        const ndefPayload = extractNdefPayload(event.message);
        const tag = normalizeTag(event.serialNumber || ndefPayload);
        if (!tag) {
          setStatus('error');
          setError('Nao foi possivel identificar serialNumber ou conteudo NDEF.');
          return;
        }

        const payload = {
          tag,
          serialNumber: event.serialNumber || '',
          ndefPayload,
          records: Array.from(event.message?.records || []).map((record) => ({
            recordType: record.recordType,
            mediaType: record.mediaType,
            id: record.id,
          })),
        };
        setLastTag(payload);
        setStatus('done');
        onRead?.(payload);
      };

      await reader.scan({ signal: controller.signal });
      setStatus('ready');
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.name === 'NotAllowedError') {
        setStatus('denied');
        setError('Permissao de NFC negada no navegador.');
        return;
      }
      if (err.name === 'SecurityError') {
        setStatus('error');
        setError('A pagina precisa estar em HTTPS para usar Web NFC.');
        return;
      }
      setStatus('error');
      setError(err.message || 'Nao foi possivel iniciar o NFC.');
    }
  };

  const isWaiting = status === 'starting' || status === 'ready';
  const hasTag = !!lastTag;
  const isError = ['error', 'denied', 'unsupported'].includes(status);

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition ${
        hasTag
          ? 'border-emerald-200 bg-emerald-50'
          : isError
          ? 'border-red-200 bg-red-50'
          : isWaiting
          ? 'border-primary-200 bg-primary-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      {hasTag ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-900">Etiqueta detectada</p>
          <code className="rounded bg-white px-2 py-1 font-mono text-xs text-emerald-800">
            {formatTag(lastTag.tag)}
          </code>
        </>
      ) : isError ? (
        <>
          <CircleOff className="h-10 w-10 text-red-600" />
          <p className="text-sm font-semibold text-red-900">
            {status === 'denied' ? 'Permissao NFC negada' : status === 'unsupported' ? 'Web NFC indisponivel' : 'Erro ao ler NFC'}
          </p>
          {error && <p className="text-xs text-red-700">{error}</p>}
        </>
      ) : isWaiting ? (
        <>
          <div className="relative">
            <Nfc className="h-10 w-10 text-primary-600" />
            <Loader2 className="absolute inset-0 h-10 w-10 animate-spin text-primary-600/40" />
          </div>
          <p className="text-sm font-semibold text-primary-900">Aguardando aproximacao...</p>
          <p className="text-xs text-primary-700">
            {hint || 'Aproxime a etiqueta NFC do verso do celular.'}
          </p>
        </>
      ) : (
        <>
          <Nfc className="h-10 w-10 text-slate-400" />
          <p className="text-sm text-slate-500">NFC pronto para leitura</p>
        </>
      )}

      {!isWaiting && (
        <button
          type="button"
          onClick={startScan}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#b70f16] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9f0d13]"
        >
          <Nfc className="h-4 w-4" />
          Ler NFC
        </button>
      )}
    </div>
  );
}
