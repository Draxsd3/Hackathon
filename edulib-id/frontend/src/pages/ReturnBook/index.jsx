import { useEffect, useState } from 'react';
import { BookCheck, RotateCcw, CalendarClock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { IdentifyStudent } from '../../components/common/IdentifyStudent.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { loanService } from '../../services/loanService.js';
import { bookService } from '../../services/bookService.js';
import { formatDate, isOverdue } from '../../utils/dateUtils.js';

export default function ReturnBookPage() {
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [tick, setTick] = useState(0);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadLoans() {
      if (!student) {
        setLoans([]);
        return;
      }

      const activeLoans = await loanService.activeByStudent(student.id);
      const withBooks = await Promise.all(
        activeLoans.map(async (loan) => {
          try {
            return { ...loan, book: await bookService.findById(loan.bookId) };
          } catch {
            return { ...loan, book: null };
          }
        })
      );

      if (alive) setLoans(withBooks);
    }

    loadLoans().catch((err) => {
      if (alive) {
        setLoans([]);
        toast.error(err.message || 'Erro ao carregar emprestimos');
      }
    });

    return () => {
      alive = false;
    };
  }, [student, tick, toast]);

  const returnLoan = async (loanId) => {
    try {
      await loanService.returnLoan(loanId);
      toast.success('Livro devolvido.');
      setTick((t) => t + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        icon={BookCheck}
        title="Devolucao de livro"
        subtitle="Identifique o aluno e marque os livros como devolvidos."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Aluno" />
          <IdentifyStudent
            selected={student}
            onIdentify={setStudent}
            onClear={() => setStudent(null)}
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Emprestimos em aberto"
            subtitle={student ? `${loans.length} item(ns)` : 'Selecione um aluno para listar'}
          />
          {!student && (
            <EmptyState icon={BookCheck} title="Selecione um aluno" description="Use a busca, QR Code ou face." />
          )}
          {student && loans.length === 0 && (
            <EmptyState icon={BookCheck} title="Sem emprestimos ativos" description="Este aluno nao possui livros em aberto." />
          )}
          {loans.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {loans.map((loan) => {
                const overdue = isOverdue(loan.dueDate);
                return (
                  <li key={loan.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {loan.book?.title || 'Livro removido'}
                      </p>
                      <p className="text-xs text-slate-500">{loan.book?.author}</p>
                      <p
                        className={`mt-1 inline-flex items-center gap-1 text-xs ${
                          overdue ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        <CalendarClock className="h-3 w-3" />
                        Devolver ate {formatDate(loan.dueDate)} {overdue ? '(em atraso)' : ''}
                      </p>
                    </div>
                    <Button variant="secondary" icon={RotateCcw} onClick={() => returnLoan(loan.id)}>
                      Devolver
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
