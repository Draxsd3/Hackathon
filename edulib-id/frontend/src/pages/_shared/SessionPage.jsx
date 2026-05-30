import { useState } from 'react';
import { Check } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { IdentifyStudent } from '../../components/common/IdentifyStudent.jsx';
import { Button } from '../../components/common/Button.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { sessionService } from '../../services/sessionService.js';
import { formatDateTime } from '../../utils/dateUtils.js';

const METHOD_LABEL = { face: 'Reconhecimento facial', qr: 'QR Code', manual: 'Busca manual', search: 'Busca manual' };

export function SessionPage({ type, title, subtitle, icon, ctaLabel, successLabel }) {
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [method, setMethod] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [lastSession, setLastSession] = useState(null);

  const identify = (s) => {
    setStudent(s);
  };

  const register = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const session = await sessionService.create({ studentId: student.id, type, method });
      setLastSession({ session, student });
      toast.success(`${successLabel}: ${student.name}`);
      setStudent(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader icon={icon} title={title} subtitle={subtitle} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="1. Identifique o aluno" />
          <IdentifyStudent
            selected={student}
            onIdentify={identify}
            onClear={() => setStudent(null)}
          />

          {student && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">2. Metodo</h3>
              <div className="flex flex-wrap gap-2">
                {['manual', 'qr', 'face'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      method === m
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {METHOD_LABEL[m]}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={register} loading={saving} icon={Check}>
                  {ctaLabel}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Ultima acao" />
          {lastSession ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-slate-800">{lastSession.student.name}</p>
              <p className="text-slate-500">
                {METHOD_LABEL[lastSession.session.method] || lastSession.session.method}
              </p>
              <p className="text-xs text-slate-400">{formatDateTime(lastSession.session.timestamp)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma acao registrada nesta sessao.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
