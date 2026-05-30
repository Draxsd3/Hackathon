import { useMemo, useState } from 'react';
import { BookPlus, Check, BookOpen } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { IdentifyStudent } from '../../components/common/IdentifyStudent.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { bookService } from '../../services/bookService.js';
import { loanService } from '../../services/loanService.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { formatDate } from '../../utils/dateUtils.js';

const DAYS_OPTIONS = [3, 7, 14, 21];

export default function LoanPage() {
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [book, setBook] = useState(null);
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const debounced = useDebounce(query, 200);

  const results = useMemo(() => {
    if (!debounced) return [];
    return bookService.list({ search: debounced }).slice(0, 8);
  }, [debounced]);

  const submit = async () => {
    if (!student || !book) return;
    setSaving(true);
    try {
      const loan = loanService.create({ studentId: student.id, bookId: book.id, days });
      toast.success(`Emprestimo criado. Devolucao ate ${formatDate(loan.dueDate)}.`);
      setStudent(null);
      setBook(null);
      setQuery('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader icon={BookPlus} title="Emprestimo de livro" subtitle="Selecione o aluno e o livro." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-6">
          <div>
            <CardHeader title="1. Aluno" />
            <IdentifyStudent
              selected={student}
              onIdentify={setStudent}
              onClear={() => setStudent(null)}
            />
          </div>

          {student && (
            <div>
              <CardHeader title="2. Livro" />
              {book ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <BookOpen className="h-6 w-6 text-emerald-700" />
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-900">{book.title}</p>
                    <p className="text-xs text-emerald-700">
                      {book.author} - {book.available}/{book.copies} disponiveis
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBook(null)}
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="Buscar por titulo, autor ou ISBN..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {debounced && (
                    <ul className="mt-2 max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                      {results.length === 0 ? (
                        <li className="px-3 py-3 text-sm text-slate-500">Nenhum livro encontrado.</li>
                      ) : (
                        results.map((b) => (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => setBook(b)}
                              disabled={b.available <= 0}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
                            >
                              <BookOpen className="h-5 w-5 text-slate-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{b.title}</p>
                                <p className="text-xs text-slate-500">{b.author}</p>
                              </div>
                              <span
                                className={`text-xs ${
                                  b.available <= 0 ? 'text-red-600' : 'text-emerald-600'
                                }`}
                              >
                                {b.available}/{b.copies}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {student && book && (
            <div>
              <CardHeader title="3. Prazo" />
              <div className="flex flex-wrap items-center gap-2">
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      days === d
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={submit} loading={saving} icon={Check}>
                  Confirmar emprestimo
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Resumo" />
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-slate-500">Aluno</span>
              <span className="font-medium text-slate-800">{student?.name || '-'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">Livro</span>
              <span className="font-medium text-slate-800">{book?.title || '-'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">Prazo</span>
              <span className="font-medium text-slate-800">{days} dias</span>
            </li>
          </ul>
          {!student && (
            <EmptyState
              className="mt-4"
              icon={BookPlus}
              title="Comece pelo aluno"
              description="Identifique o aluno acima para liberar a selecao de livros."
            />
          )}
        </Card>
      </div>
    </div>
  );
}
