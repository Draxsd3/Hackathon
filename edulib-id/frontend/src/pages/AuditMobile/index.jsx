import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Download,
  Loader2,
  SmartphoneNfc,
  XCircle,
} from 'lucide-react';
import { bookService } from '../../services/bookService.js';
import { eventService } from '../../services/eventService.js';
import { useToast } from '../../components/common/Toast.jsx';
import { formatTime } from '../../utils/dateUtils.js';

function normalizeTag(raw) {
  return String(raw || '').replace(/^nfc:/i, '').replace(/[:\s]/g, '').trim().toUpperCase();
}

export default function AuditMobilePage() {
  const toast = useToast();
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | running | finished
  const [validatedMap, setValidatedMap] = useState({});
  const [unknownTags, setUnknownTags] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [readerStatus, setReaderStatus] = useState('idle');
  const [readerError, setReaderError] = useState('');

  useEffect(() => {
    let alive = true;
    bookService
      .list()
      .then((rows) => {
        if (alive) {
          setBooks(Array.isArray(rows) ? rows : []);
          setLoadingBooks(false);
        }
      })
      .catch((err) => {
        if (alive) {
          toast.error(err.message || 'Erro ao carregar acervo');
          setLoadingBooks(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [toast]);

  const total = books.length;
  const validatedCount = Object.keys(validatedMap).length;
  const pendingCount = Math.max(0, total - validatedCount);
  const percent = total > 0 ? Math.round((validatedCount / total) * 100) : 0;

  const pendingBooks = useMemo(
    () => books.filter((b) => !(b.id in validatedMap)),
    [books, validatedMap]
  );
  const validatedBooks = useMemo(
    () =>
      books
        .filter((b) => b.id in validatedMap)
        .map((b) => ({ ...b, scannedAt: validatedMap[b.id] }))
        .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt)),
    [books, validatedMap]
  );

  const handleTag = useCallback(
    (rawTag) => {
      const tag = normalizeTag(rawTag);
      if (!tag) return;

      const at = new Date().toISOString();
      const book = books.find((b) => normalizeTag(b.rfid) === tag);

      if (!book) {
        setUnknownTags((prev) => [{ tag, at }, ...prev].slice(0, 20));
        setFeedback({ type: 'unknown', message: `Tag desconhecida: ${tag}` });
        eventService
          .create({ type: 'audit.tag.unknown', payload: { tag, at, source: 'mobile' } })
          .catch(() => {});
        if ('vibrate' in navigator) navigator.vibrate([200, 50, 200]);
        return;
      }

      if (book.id in validatedMap) {
        setFeedback({ type: 'duplicate', message: `"${book.title}" ja foi validado.` });
        eventService
          .create({ type: 'audit.tag.duplicate', payload: { bookId: book.id, tag, at, source: 'mobile' } })
          .catch(() => {});
        if ('vibrate' in navigator) navigator.vibrate(100);
        return;
      }

      setValidatedMap((prev) => ({ ...prev, [book.id]: at }));
      setFeedback({ type: 'success', message: `"${book.title}" validado!` });
      eventService
        .create({
          type: 'audit.book.validated',
          payload: { bookId: book.id, title: book.title, rfid: tag, at, source: 'mobile' },
        })
        .catch(() => {});
      if ('vibrate' in navigator) navigator.vibrate(50);
    },
    [books, validatedMap]
  );

  // Ref para manter o handler atual sem reiniciar o leitor a cada leitura.
  const handleTagRef = useRef(handleTag);
  useEffect(() => {
    handleTagRef.current = handleTag;
  }, [handleTag]);

  // Leitor NFC continuo enquanto status === 'running'.
  useEffect(() => {
    if (status !== 'running') {
      setReaderStatus((prev) => (prev === 'waiting' ? 'idle' : prev));
      return undefined;
    }

    if (typeof window === 'undefined' || !window.isSecureContext) {
      setReaderStatus('error');
      setReaderError('A leitura NFC exige HTTPS.');
      return undefined;
    }
    if (!('NDEFReader' in window)) {
      setReaderStatus('unavailable');
      setReaderError('Use Chrome no Android para ler tags NFC.');
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const reader = new window.NDEFReader();
        reader.onreading = (event) => handleTagRef.current(event.serialNumber || '');
        reader.onreadingerror = () => {
          if (!cancelled) setFeedback({ type: 'error', message: 'Falha de leitura, tente de novo.' });
        };
        setReaderStatus('waiting');
        setReaderError('');
        await reader.scan({ signal: controller.signal });
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        setReaderStatus('error');
        setReaderError(err.message || 'Nao foi possivel iniciar o NFC.');
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status]);

  const start = () => {
    setValidatedMap({});
    setUnknownTags([]);
    setFeedback(null);
    setStatus('running');
    eventService.create({ type: 'audit.started', payload: { total, source: 'mobile' } }).catch(() => {});
  };

  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      source: 'mobile',
      summary: { total, validatedCount, pendingCount, percent, unknownCount: unknownTags.length },
      validated: validatedBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        copyCode: b.copyCode,
        rfid: b.rfid,
        scannedAt: b.scannedAt,
      })),
      pending: pendingBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        copyCode: b.copyCode,
        rfid: b.rfid,
      })),
      unknown: unknownTags,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-mobile-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const finish = () => {
    setStatus('finished');
    eventService
      .create({
        type: 'audit.finished',
        payload: {
          total,
          validatedCount,
          pendingCount,
          percent,
          unknownCount: unknownTags.length,
          source: 'mobile',
        },
      })
      .catch(() => {});
    generateReport();
  };

  const resetAudit = () => {
    setStatus('idle');
    setValidatedMap({});
    setUnknownTags([]);
    setFeedback(null);
    setReaderStatus('idle');
    setReaderError('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#eef2f5]">
      <header className="sticky top-0 z-30 bg-[#b70f16] text-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <a
            href="/"
            className="-ml-2 rounded-md p-2 transition hover:bg-white/10"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </a>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-white/75">Modo mobile</p>
            <h1 className="truncate text-base font-semibold leading-tight">Auditoria dos livros</h1>
          </div>
          <SmartphoneNfc className="h-6 w-6 flex-none" />
        </div>
        {status !== 'idle' && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs">
              <span>
                {validatedCount} de {total}
              </span>
              <span className="font-semibold">{percent}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 space-y-4 px-4 py-4 pb-36">
        {loadingBooks && (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
            <p className="mt-2 text-sm text-slate-500">Carregando acervo...</p>
          </div>
        )}

        {!loadingBooks && total === 0 && (
          <div className="rounded-md border-2 border-dashed border-slate-300 bg-white p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Nenhum livro encontrado para auditoria.
            </p>
            <p className="mt-1 text-xs text-slate-500">Cadastre livros no Acervo primeiro.</p>
          </div>
        )}

        {!loadingBooks && status === 'idle' && total > 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
            <SmartphoneNfc className="mx-auto h-10 w-10 text-[#b70f16]" />
            <h2 className="mt-3 text-base font-semibold text-slate-950">
              {total} {total === 1 ? 'livro' : 'livros'} para conferir
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Encoste o celular nas etiquetas RFID. A validacao acontece automaticamente.
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#b70f16] px-5 text-base font-semibold text-white shadow-sm transition active:scale-[0.99]"
            >
              <ClipboardList className="h-5 w-5" />
              Iniciar auditoria
            </button>
          </div>
        )}

        {feedback && status !== 'idle' && (
          <div
            className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : feedback.type === 'duplicate'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            )}
            <span className="flex-1">{feedback.message}</span>
          </div>
        )}

        {status !== 'idle' && validatedBooks.length > 0 && (
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-2.5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Validados ({validatedCount})
              </h3>
            </header>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {validatedBooks.map((book) => (
                <li key={book.id} className="px-4 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">{book.title}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">{book.author}</p>
                    <span className="flex-none text-xs font-medium text-emerald-600">
                      {formatTime(book.scannedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {status !== 'idle' && pendingBooks.length > 0 && (
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-2.5">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <ClipboardList className="h-4 w-4 text-amber-600" />
                Pendentes ({pendingCount})
              </h3>
            </header>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {pendingBooks.slice(0, 50).map((book) => (
                <li key={book.id} className="px-4 py-2.5">
                  <p className="truncate text-sm font-medium text-slate-800">{book.title}</p>
                  <p className="truncate text-xs text-slate-500">{book.author}</p>
                </li>
              ))}
              {pendingBooks.length > 50 && (
                <li className="px-4 py-2 text-center text-xs text-slate-500">
                  +{pendingBooks.length - 50} restantes
                </li>
              )}
            </ul>
          </section>
        )}

        {unknownTags.length > 0 && status !== 'idle' && (
          <section className="rounded-md border border-red-200 bg-red-50 p-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-red-900">
              <XCircle className="h-4 w-4" />
              {unknownTags.length} tag(s) desconhecida(s)
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-red-700">
              {unknownTags.slice(0, 5).map((entry, i) => (
                <li key={`${entry.tag}-${i}`}>
                  <code className="font-mono">{entry.tag}</code>
                  {' as '}
                  {formatTime(entry.at)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {status !== 'idle' && (
        <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-md ${
                  status === 'running' && readerStatus === 'waiting'
                    ? 'bg-emerald-50 text-emerald-700'
                    : readerStatus === 'error' || readerStatus === 'unavailable'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {status === 'running' && readerStatus === 'waiting' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SmartphoneNfc className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {status === 'finished'
                    ? 'Auditoria finalizada'
                    : readerStatus === 'waiting'
                    ? 'Aguardando leitura...'
                    : readerError || 'Aproxime de um livro'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {status === 'finished'
                    ? 'Baixe o relatorio ou comece outra.'
                    : 'Encoste o verso do celular na etiqueta RFID.'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {status === 'finished' ? (
                <>
                  <button
                    type="button"
                    onClick={resetAudit}
                    className="h-11 flex-1 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition active:scale-[0.99]"
                  >
                    Nova auditoria
                  </button>
                  <button
                    type="button"
                    onClick={generateReport}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#b70f16] text-sm font-semibold text-white transition active:scale-[0.99]"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={finish}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#b70f16] text-sm font-semibold text-white transition active:scale-[0.99]"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Finalizar e gerar relatorio
                </button>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
