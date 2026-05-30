import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader2, Save, SmartphoneNfc, XCircle } from 'lucide-react';
import { useToast } from '../../components/common/Toast.jsx';
import { bookService } from '../../services/bookService.js';
import { eventService } from '../../services/eventService.js';
import { rfidService } from '../../services/rfidService.js';
import { USE_BACKEND } from '../../services/api.js';

const HOME_FEEDBACK = {
  state: 'idle',
  title: 'Leitor NFC pronto',
  message: 'Use o celular como leitor auxiliar da biblioteca.',
};

function canUseWebNfc() {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

function normalizeTagId(value) {
  let tag = String(value || '').trim();
  if (!tag) return '';

  try {
    const url = new URL(tag);
    tag = url.searchParams.get('tag')
      || url.searchParams.get('nfc')
      || url.searchParams.get('rfid')
      || url.pathname.split('/').filter(Boolean).pop()
      || tag;
  } catch {
    tag = tag.replace(/^nfc:/i, '').trim();
  }

  return tag.replace(/:/g, '').trim().toUpperCase();
}

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

function isRecent(value, minutes = 10) {
  const time = new Date(value || 0).getTime();
  return Boolean(time) && Date.now() - time <= minutes * 60000;
}

function readContextFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('source') !== 'platform') return null;
  return {
    operation: params.get('operation') || params.get('flow') || 'checkout',
    studentId: params.get('studentId') || '',
    sessionId: params.get('sessionId') || '',
    registration: params.get('registration') || '',
    studentName: params.get('name') || '',
    requestedAt: new Date().toISOString(),
  };
}

function feedbackClasses(state) {
  const styles = {
    idle: 'border-slate-200 bg-white text-slate-700',
    waiting: 'border-amber-200 bg-amber-50 text-amber-900',
    read: 'border-blue-200 bg-blue-50 text-blue-900',
    done: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    missing: 'border-red-200 bg-red-50 text-red-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  };
  return styles[state] || styles.idle;
}

function StatusIcon({ state, busy }) {
  if (busy) return <Loader2 className="h-8 w-8 animate-spin" />;
  if (state === 'done') return <CheckCircle2 className="h-8 w-8" />;
  if (['missing', 'error'].includes(state)) return <XCircle className="h-8 w-8" />;
  if (state === 'waiting') return <SmartphoneNfc className="h-8 w-8" />;
  return <SmartphoneNfc className="h-8 w-8" />;
}

function MobileButton({ children, icon: Icon, active = false, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-semibold transition disabled:pointer-events-none disabled:opacity-50 ${
        active ? 'bg-[#b70f16] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-800'
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

export default function NfcMobilePage() {
  const toast = useToast();
  const scanAbortRef = useRef(null);
  const pollBusyRef = useRef(false);
  const lastRequestIdRef = useRef(null);
  const initialContext = useMemo(() => readContextFromUrl(), []);
  const [mode, setMode] = useState(initialContext ? 'receive' : 'home');
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [manualTag, setManualTag] = useState('');
  const [lastTag, setLastTag] = useState('');
  const [lastReadDetails, setLastReadDetails] = useState(null);
  const [receiveContext, setReceiveContext] = useState(initialContext);
  const [feedback, setFeedback] = useState(HOME_FEEDBACK);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);

  const sortedBooks = useMemo(
    () => books.slice().sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))),
    [books]
  );

  async function loadBooks() {
    try {
      setBooks(await bookService.list());
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar livros');
    }
  }

  useEffect(() => {
    loadBooks();
    if (initialContext) {
      setFeedback({
        state: 'waiting',
        title: 'Aguardando leitura NFC',
        message: 'Toque em Ler NFC e aproxime a etiqueta do livro.',
      });
    }
    return () => scanAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!USE_BACKEND) return undefined;

    let cancelled = false;
    const pollRequests = async () => {
      if (pollBusyRef.current) return;
      pollBusyRef.current = true;
      try {
        const events = await eventService.list({ type: 'nfc.read.requested', limit: 8 });
        if (cancelled) return;
        const request = events.find((event) => {
          const payload = event.payload || {};
          return payload.operation && payload.studentId && isRecent(payload.requestedAt || event.timestamp);
        });
        if (!request || request.id === lastRequestIdRef.current) return;

        lastRequestIdRef.current = request.id;
        const payload = request.payload || {};
        setReceiveContext({
          operation: payload.operation,
          studentId: payload.studentId,
          sessionId: payload.sessionId || '',
          registration: payload.registration || '',
          studentName: payload.studentName || '',
          requestedAt: payload.requestedAt || request.timestamp,
        });
        setMode('receive');
        setShowManualFallback(false);
        setFeedback({
          state: 'waiting',
          title: 'Aguardando leitura NFC',
          message: 'Toque em Ler NFC e aproxime a etiqueta do livro.',
        });
      } catch (err) {
        console.warn('[nfc-mobile] Falha ao consultar solicitacoes:', err);
      } finally {
        pollBusyRef.current = false;
      }
    };

    pollRequests();
    const timer = window.setInterval(pollRequests, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function handleRegisterRead(tag, details = {}) {
    setScanning(false);
    setLastTag(tag);
    setLastReadDetails(details);
    setMode('register');
    setFeedback({
      state: 'read',
      title: 'NFID identificado',
      message: 'Selecione o livro para vincular esta tag ao exemplar.',
    });
  }

  async function handleReceiveRead(tag, details = {}) {
    if (!receiveContext) return;
    setBusy(true);
    setLastTag(tag);
    setLastReadDetails(details);
    setFeedback({ state: 'read', title: 'Tag lida', message: 'Consultando backend e enviando ao painel...' });

    try {
      const book = await rfidService.findBook(tag);
      await eventService.create({
        type: 'nfc.read.completed',
        actor: 'mobile-nfc',
        payload: {
          operation: receiveContext.operation,
          tag,
          bookId: book?.id || null,
          title: book?.title || null,
          rfid: book?.rfid || tag,
          serialNumber: details.serialNumber || '',
          ndefPayload: details.ndefPayload || '',
          studentId: receiveContext.studentId,
          sessionId: receiveContext.sessionId,
          registration: receiveContext.registration,
          timestamp: new Date().toISOString(),
        },
      });

      setFeedback({
        state: book ? 'done' : 'missing',
        title: book ? 'Leitura enviada' : 'NFID nao vinculado',
        message: book ? `${book.title} enviado para o painel.` : 'A leitura foi enviada, mas este NFID ainda nao possui livro vinculado.',
      });
      toast.success('Leitura enviada ao painel.');
      window.setTimeout(() => {
        setMode('home');
        setReceiveContext(null);
        setFeedback(HOME_FEEDBACK);
      }, 2200);
    } catch (err) {
      setFeedback({ state: 'error', title: 'Falha ao enviar leitura', message: err.message || 'Erro ao processar NFC.' });
      toast.error(err.message || 'Erro ao enviar leitura');
    } finally {
      setBusy(false);
      setScanning(false);
    }
  }

  async function startScan(targetMode) {
    if (!USE_BACKEND) {
      setFeedback({ state: 'error', title: 'Backend indisponivel', message: 'Ative o backend para usar o leitor NFC.' });
      return;
    }

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setFeedback({
        state: 'error',
        title: 'HTTPS necessario',
        message: 'A leitura NFC no navegador so funciona em HTTPS. Abra o app pelo link https da rede.',
      });
      return;
    }

    if (!canUseWebNfc()) {
      setFeedback({
        state: 'error',
        title: 'Web NFC nao disponivel',
        message: 'Este navegador nao expoe NDEFReader. Use Android com Chrome ou Edge e NFC ativado.',
      });
      return;
    }

    scanAbortRef.current?.abort();
    const controller = new AbortController();
    scanAbortRef.current = controller;
    setScanning(true);
    setShowManualFallback(false);
    setFeedback({ state: 'waiting', title: 'Aguardando leitura NFC', message: 'Aproxime a etiqueta do livro.' });

    try {
      const reader = new window.NDEFReader();
      reader.onreadingerror = () => {
        controller.abort();
        setScanning(false);
        setFeedback({ state: 'error', title: 'Falha na leitura', message: 'Aproxime a etiqueta novamente.' });
      };
      reader.onreading = (event) => {
        controller.abort();
        const ndefPayload = extractNdefPayload(event.message);
        const details = {
          serialNumber: event.serialNumber || '',
          ndefPayload,
        };
        const tag = normalizeTagId(event.serialNumber || ndefPayload);
        if (!tag) {
          setScanning(false);
          setFeedback({ state: 'error', title: 'Tag sem codigo', message: 'Nao foi possivel identificar serialNumber ou conteudo NDEF.' });
          return;
        }
        if (targetMode === 'receive') handleReceiveRead(tag, details);
        else handleRegisterRead(tag, details);
      };
      await reader.scan({ signal: controller.signal });
    } catch (err) {
      setScanning(false);
      if (err.name === 'AbortError') return;
      if (err.name === 'NotAllowedError') {
        setFeedback({ state: 'error', title: 'Permissao NFC negada', message: 'Autorize a leitura NFC no navegador para continuar.' });
        return;
      }
      if (err.name === 'SecurityError') {
        setFeedback({ state: 'error', title: 'HTTPS necessario', message: 'O navegador bloqueou o NFC porque a pagina nao esta em contexto seguro.' });
        return;
      }
      if (err.name === 'NotSupportedError') {
        setFeedback({ state: 'error', title: 'Web NFC nao suportado', message: 'O dispositivo ou navegador nao suporta NDEFReader.' });
        return;
      }
      setFeedback({ state: 'error', title: 'Falha ao iniciar NFC', message: err.message || 'O navegador bloqueou a leitura NFC.' });
    }
  }

  async function saveTagToBook() {
    if (!lastTag || !selectedBookId) return;
    setBusy(true);
    try {
      const existing = await rfidService.findBook(lastTag);
      if (existing && existing.id !== selectedBookId) throw new Error(`NFID ja vinculado ao livro ${existing.title}.`);

      const saved = await bookService.update(selectedBookId, { rfid: lastTag });
      await eventService.create({
        type: 'nfc.book.registered',
        actor: 'mobile-nfc',
        payload: {
          bookId: saved.id,
          tag: lastTag,
          serialNumber: lastReadDetails?.serialNumber || '',
          ndefPayload: lastReadDetails?.ndefPayload || '',
        },
      });
      await loadBooks();
      setFeedback({ state: 'done', title: 'NFID vinculado', message: `${saved.title} atualizado no backend.` });
      toast.success('NFID vinculado ao livro.');
      window.setTimeout(() => {
        setMode('home');
        setSelectedBookId('');
        setLastTag('');
        setLastReadDetails(null);
        setFeedback(HOME_FEEDBACK);
      }, 1800);
    } catch (err) {
      setFeedback({ state: 'error', title: 'Falha ao vincular', message: err.message || 'Erro ao salvar NFID.' });
      toast.error(err.message || 'Erro ao vincular NFID');
    } finally {
      setBusy(false);
    }
  }

  const submitManualTag = (event) => {
    event.preventDefault();
    const tag = normalizeTagId(manualTag);
    if (!tag) return;
    setManualTag('');
    if (mode === 'receive') handleReceiveRead(tag, { source: 'manual' });
    else handleRegisterRead(tag, { source: 'manual' });
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-900">
      <header className="sticky top-0 z-20 bg-[#b70f16] px-4 py-4 text-white shadow-sm">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <SmartphoneNfc className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-semibold leading-tight">EduLib NFC</p>
            <p className="text-xs text-white/75">Leitor auxiliar da biblioteca</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-4 py-4">
        {mode !== 'home' && (
          <section className={`rounded-md border p-4 shadow-sm ${feedbackClasses(feedback.state)}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/70">
                <StatusIcon state={feedback.state} busy={scanning || busy} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold">{feedback.title}</p>
                <p className="mt-1 text-sm opacity-90">{feedback.message}</p>
                {lastTag && <p className="mt-2 break-all text-xs font-semibold opacity-80">NFID: {lastTag}</p>}
              </div>
            </div>
          </section>
        )}

        {mode === 'home' && (
          <div className="space-y-3">
            <MobileButton
              icon={ClipboardList}
              active
              onClick={() => {
                window.location.href = '/audit-mobile';
              }}
            >
              Iniciar auditoria dos livros
            </MobileButton>
            <MobileButton
              icon={Save}
              onClick={() => {
                setMode('register');
                setShowManualFallback(false);
                setFeedback({ state: 'waiting', title: 'Vincular RFID/NFC', message: 'Toque em Ler NFC e aproxime o livro.' });
              }}
            >
              Vincular RFID/NFC
            </MobileButton>
          </div>
        )}

        {mode === 'receive' && (
          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-950">Aguardando leitura NFC</p>
              <p className="mt-1 text-sm text-slate-500">{receiveContext?.studentName || 'Operacao solicitada pelo painel'}</p>
            </div>
            <MobileButton icon={SmartphoneNfc} active onClick={() => startScan('receive')} disabled={scanning || busy}>
              {scanning ? 'Aproxime a etiqueta...' : 'Ler NFC'}
            </MobileButton>
          </section>
        )}

        {mode === 'register' && (
          <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            {!lastTag ? (
              <MobileButton icon={SmartphoneNfc} active onClick={() => startScan('register')} disabled={scanning || busy}>
                {scanning ? 'Aproxime a etiqueta...' : 'Ler NFC'}
              </MobileButton>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Livro</span>
                  <select
                    className="input mt-1"
                    value={selectedBookId}
                    onChange={(event) => setSelectedBookId(event.target.value)}
                  >
                    <option value="">Selecione o livro</option>
                    {sortedBooks.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} {book.rfid ? `- NFID ${book.rfid}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <MobileButton icon={Save} active disabled={!selectedBookId || busy} onClick={saveTagToBook}>
                  Vincular tag ao exemplar
                </MobileButton>
              </>
            )}
          </section>
        )}

        {mode !== 'home' && (
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            {!showManualFallback ? (
              <button
                type="button"
                className="w-full text-center text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
                onClick={() => setShowManualFallback(true)}
              >
                Digitar NFID manualmente para teste
              </button>
            ) : (
              <form className="grid gap-2" onSubmit={submitManualTag}>
                <input
                  className="input"
                  value={manualTag}
                  onChange={(event) => setManualTag(event.target.value)}
                  placeholder="NFID manual"
                  autoComplete="off"
                />
                <MobileButton disabled={!manualTag.trim() || busy} onClick={submitManualTag}>
                  Usar NFID digitado
                </MobileButton>
              </form>
            )}
          </section>
        )}

        {mode !== 'home' && (
          <MobileButton
            onClick={() => {
              scanAbortRef.current?.abort();
              setMode('home');
              setReceiveContext(null);
              setLastTag('');
              setLastReadDetails(null);
              setSelectedBookId('');
              setShowManualFallback(false);
              setFeedback(HOME_FEEDBACK);
            }}
          >
            Voltar
          </MobileButton>
        )}
      </div>
    </main>
  );
}
