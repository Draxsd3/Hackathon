import { useState } from 'react';
import { UserPlus, Save, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Button } from '../../components/common/Button.jsx';
import { FaceCapture } from '../../components/camera/FaceCapture.jsx';
import { QRGenerator } from '../../components/qr/QRGenerator.jsx';
import { studentService } from '../../services/studentService.js';
import { eventService } from '../../services/eventService.js';
import { buildStudentPayload } from '../../utils/qrUtils.js';
import { useToast } from '../../components/common/Toast.jsx';

const EMPTY = { name: '', registration: '', classGroup: '', email: '' };

export default function StudentRegisterPage() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [capture, setCapture] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obrigatorio';
    if (!form.registration.trim()) e.registration = 'Matricula obrigatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const student = studentService.create({
        ...form,
        photo: capture?.photo || null,
        faceDescriptor: capture?.descriptor || null,
      });
      eventService.create({
        type: 'student.created',
        payload: { studentId: student.id, name: student.name },
      });
      setCreated(student);
      toast.success(`Aluno ${student.name} cadastrado.`);
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setCapture(null);
    setErrors({});
    setCreated(null);
  };

  if (created) {
    return (
      <div>
        <PageHeader
          icon={UserPlus}
          title="Aluno cadastrado!"
          subtitle="Use o QR Code abaixo para identificar o aluno na entrada e saida."
          actions={
            <Button variant="secondary" icon={RotateCcw} onClick={reset}>
              Cadastrar outro
            </Button>
          }
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Dados" />
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-slate-500">Nome</dt>
              <dd className="font-medium text-slate-900">{created.name}</dd>
              <dt className="text-slate-500">Matricula</dt>
              <dd className="font-medium text-slate-900">{created.registration}</dd>
              <dt className="text-slate-500">Turma</dt>
              <dd className="font-medium text-slate-900">{created.classGroup || '-'}</dd>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{created.email || '-'}</dd>
              <dt className="text-slate-500">Face cadastrada</dt>
              <dd className="font-medium text-slate-900">{created.faceDescriptor ? 'Sim' : 'Nao'}</dd>
            </dl>
            {created.photo && (
              <img src={created.photo} alt={created.name} className="mt-4 h-32 w-32 rounded-lg object-cover" />
            )}
          </Card>
          <Card>
            <CardHeader title="QR Code do aluno" subtitle="Cole na carteirinha ou no caderno" />
            <div className="flex justify-center">
              <QRGenerator
                value={buildStudentPayload(created.id)}
                caption={`${created.name} - ${created.registration}`}
                downloadName={`qr-${created.registration}.png`}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Cadastrar aluno"
        subtitle="Preencha os dados e capture uma foto para reconhecimento facial."
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Dados do aluno" />
          <div className="grid gap-4">
            <Input
              name="name"
              label="Nome completo"
              value={form.name}
              onChange={onChange}
              error={errors.name}
              autoFocus
            />
            <Input
              name="registration"
              label="Matricula"
              value={form.registration}
              onChange={onChange}
              error={errors.registration}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="classGroup"
                label="Turma"
                value={form.classGroup}
                onChange={onChange}
                placeholder="Ex.: 9A"
              />
              <Input
                name="email"
                label="Email (opcional)"
                type="email"
                value={form.email}
                onChange={onChange}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={reset}>
                Limpar
              </Button>
              <Button type="submit" loading={saving} icon={Save}>
                Cadastrar
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Foto e reconhecimento"
            subtitle="A foto sera usada para reconhecimento facial nas entradas."
          />
          <FaceCapture onCapture={setCapture} />
          {capture?.descriptor && (
            <p className="mt-3 text-xs text-emerald-700">
              Descritor facial gerado. O aluno podera entrar reconhecido pela camera.
            </p>
          )}
        </Card>
      </form>
    </div>
  );
}
