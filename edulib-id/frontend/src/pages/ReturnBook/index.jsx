import { useCallback, useEffect, useState } from 'react';
import { BookCheck, BookOpen, CalendarClock, RotateCcw, Nfc, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { NfcScanner } from '../../components/nfc/NfcScanner.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { loanService } from '../../services/loanService.js';
import { studentService } from '../../services/studentService.js';
import { formatDateTime, isOverdue } from '../../utils/dateUtils.js';

export default function ReturnBookPage() {
  const toast = useToast();
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastReturn, setLastReturn] = useState(null);

  // Ao montar/desmontar a pagina garantimos que o scanner ative/pause certo.
  useEffect(() => {
    setScanning(true);
    return () => setScanning(false);
  }, []);

  const handleNfcRead = useCallback(
    async ({ tag }) => {
      if (busy) return;
      setBusy(true);
      setScanning(false); // pausa o scanner enquanto processa

      try {
        const { loan, book } = await loanService.returnByRfid(tag);
        let student = null;
        try {
          student = await studentService.findById(loan.studentId);
        } catch {
          student = null;
        }

        setLastReturn({ loan, book, student });
        toast.success(`"${book.title}" devolvido com sucesso.`);
      } catch (err) {
        if (err.code === 'BOOK_NOT_FOUND') {
          toast.error('Nenhum livro vinculado a essa etiqueta NFC.');
        } else if (err.code === 'LOAN_NOT_FOUND') {
          toast.error(err.message);
        } else {
          toast.error(err.message || 'Erro ao processar a devolucao.');
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, toast]
  );

  const scanAnother = () => {
    setLastReturn(null);
    setScanning(true);
  };

  return (
    <div>
      <PageHeader
        icon={BookCheck}
        title="Devolucao por NFC"
        subtitle="Aproxime o livro do verso do celular para registrar a devolucao automaticamente."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Leitura NFC"
            subtitle="A devolucao acontece sozinha assim que a etiqueta for detectada."
          />

          {!lastReturn && (
            <NfcScanner
              active={scanning && !busy}
              onRead={handleNfcRead}
              hint="Encoste o livro no celular para registrar a devolucao."
            />
          )}

          {lastReturn && (
            <SuccessPanel
              book={lastReturn.book}
              loan={lastReturn.loan}
              student={lastReturn.student}
              onScanAnother={scanAnother}
            />
          )}

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <p>
              A leitura NFC funciona apenas em <strong>Chrome no Android</strong> com a pagina em HTTPS.
              Para vincular uma etiqueta a um exemplar, use a tela <strong>Cadastrar livro</strong>.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Como funciona" />
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                1
              </span>
              <span>Aproxime a etiqueta NFC do livro do verso do celular.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                2
              </span>
              <span>O sistema busca o exemplar e o emprestimo ativo.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                3
              </span>
              <span>A devolucao e registrada e o livro volta a ficar disponivel.</span>
            </li>
          </ol>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <Nfc className="h-4 w-4 flex-none text-slate-400" />
            <span>Sem fila, sem login do aluno - basta encostar o livro.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SuccessPanel({ book, loan, student, onScanAnother }) {
  const overdue = loan.status === 'overdue' || isOverdue(loan.dueDate);
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <BookCheck className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-emerald-900">Devolucao registrada</p>
        <p className="text-xs text-emerald-700">{formatDateTime(loan.returnDate || new Date().toISOString())}</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          icon={BookOpen}
          label="Livro"
          value={book.title}
          subtitle={book.author}
        />
        <Field
          icon={CalendarClock}
          label="Prazo"
          value={overdue ? 'Devolvido em atraso' : 'Devolvido no prazo'}
          subtitle={loan.dueDate ? `Vencia em ${formatDateTime(loan.dueDate)}` : null}
          tone={overdue ? 'warn' : 'ok'}
        />
        {student && (
          <Field
            label="Aluno"
            value={student.name}
            subtitle={`Matricula ${student.registration}`}
            className="sm:col-span-2"
          />
        )}
      </dl>

      <div className="flex justify-end">
        <Button onClick={onScanAnother} icon={RotateCcw}>
          Devolver outro livro
        </Button>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, subtitle, tone, className = '' }) {
  const tones = {
    ok: 'border-emerald-200 bg-emerald-50',
    warn: 'border-amber-200 bg-amber-50',
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone] || 'border-slate-200 bg-white'} ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
