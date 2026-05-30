import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock3, ScanFace, UserPlus, Users, XCircle } from 'lucide-react';
import { CameraView } from '../../components/camera/CameraView.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input } from '../../components/common/Input.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { studentService } from '../../services/studentService.js';
import { sessionService } from '../../services/sessionService.js';
import {
  FACE_DESCRIPTOR_VERSION,
  captureFrame,
  compareDescriptors,
  computeDescriptor,
  ensureFaceModelsLoaded,
} from '../../utils/facialUtils.js';
import { formatDateTime } from '../../utils/dateUtils.js';

const EMPTY_FORM = { name: '', registration: '', classGroup: '' };
const MIN_SCORE = 0.65;

export default function TimeClockPage() {
  const toast = useToast();
  const cameraRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [savingStudent, setSavingStudent] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastCapture, setLastCapture] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  const studentsWithFace = useMemo(
    () =>
      students.filter(
        (student) =>
          student.active !== false && student.faceDescriptor?.version === FACE_DESCRIPTOR_VERSION
      ),
    [students]
  );

  async function loadStudents() {
    setStudents(await studentService.list());
  }

  useEffect(() => {
    loadStudents().catch((err) => toast.error(err.message || 'Erro ao carregar alunos'));
  }, []);

  useEffect(() => {
    let alive = true;

    ensureFaceModelsLoaded()
      .then(() => {
        if (alive) {
          setModelsReady(true);
          setModelsError(null);
        }
      })
      .catch((err) => {
        if (alive) {
          setModelsReady(false);
          setModelsError(err);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Informe o nome';
    if (!form.registration.trim()) nextErrors.registration = 'Informe a matricula';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const captureCurrentFrame = () => {
    const video = cameraRef.current?.getVideo();
    const frame = captureFrame(video);
    if (!frame) throw new Error('Camera ainda nao esta pronta');
    setLastCapture(frame);
    return frame;
  };

  const registerStudent = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSavingStudent(true);
    try {
      const photo = captureCurrentFrame();
      const faceDescriptor = await computeDescriptor(photo);
      const registration = form.registration.trim();
      const existing = students.find((student) => student.registration === registration);
      const payload = {
        name: form.name.trim(),
        registration,
        classGroup: form.classGroup.trim() || null,
        photo,
        faceDescriptor,
      };
      const student = existing
        ? await studentService.update(existing.id, payload)
        : await studentService.create(payload);

      setForm(EMPTY_FORM);
      await loadStudents();
      setLastResult({ type: 'registered', student, timestamp: new Date().toISOString(), score: 1 });
      toast.success(existing ? `Foto de ${student.name} atualizada.` : `${student.name} cadastrado com foto.`);
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar aluno');
    } finally {
      setSavingStudent(false);
    }
  };

  const findBestMatch = (descriptor) => {
    return studentsWithFace.reduce(
      (best, student) => {
        const score = compareDescriptors(student.faceDescriptor, descriptor);
        return score > best.score ? { student, score } : best;
      },
      { student: null, score: 0 }
    );
  };

  const validateEntry = async () => {
    if (!modelsReady) {
      toast.error('Modelos faciais ainda estao carregando.');
      return;
    }

    if (studentsWithFace.length === 0) {
      toast.error('Cadastre ou atualize um aluno com foto antes de validar entrada.');
      return;
    }

    setValidating(true);
    try {
      const photo = captureCurrentFrame();
      const descriptor = await computeDescriptor(photo);
      const match = findBestMatch(descriptor);

      if (!match.student || match.score < MIN_SCORE) {
        setLastResult({
          type: 'denied',
          timestamp: new Date().toISOString(),
          score: match.score,
        });
        toast.error('Aluno nao reconhecido.');
        return;
      }

      const session = await sessionService.create({
        studentId: match.student.id,
        type: 'entry',
        method: 'face',
        notes: `score:${match.score.toFixed(3)}`,
      });

      setLastResult({
        type: 'approved',
        student: match.student,
        session,
        timestamp: session.timestamp,
        score: match.score,
      });
      toast.success(`Entrada registrada: ${match.student.name}`);
    } catch (err) {
      toast.error(err.message || 'Erro ao validar entrada');
    } finally {
      setValidating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">EduLib ID</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">Controle de entrada</h1>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-primary-600" />
            <span>{studentsWithFace.length} aluno(s) com foto</span>
          </div>
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
          <section className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <ScanFace className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Camera de validacao</h2>
                  <p className="text-xs text-slate-500">
                    {modelsReady ? 'Posicione o rosto no centro e registre a entrada.' : 'Carregando modelo facial...'}
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
                <Clock3 className="h-4 w-4" />
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="grid flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-h-[420px]">
                <CameraView ref={cameraRef} className="h-full min-h-[420px] rounded-lg" />
              </div>

              <aside className="flex flex-col gap-3">
                <div
                  className={`rounded-lg border p-4 ${
                    lastResult?.type === 'approved'
                      ? 'border-emerald-200 bg-emerald-50'
                      : lastResult?.type === 'denied'
                        ? 'border-red-200 bg-red-50'
                        : lastResult?.type === 'registered'
                          ? 'border-primary-200 bg-primary-50'
                          : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {lastResult?.type === 'approved' || lastResult?.type === 'registered' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    ) : lastResult?.type === 'denied' ? (
                      <XCircle className="h-5 w-5 text-red-700" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-500" />
                    )}
                    <h3 className="text-sm font-semibold text-slate-900">Ultima leitura</h3>
                  </div>

                  {lastResult ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <p className="font-semibold text-slate-900">
                        {lastResult.type === 'denied' ? 'Nao reconhecido' : lastResult.student?.name}
                      </p>
                      <p className="text-slate-600">
                        {lastResult.student?.registration || 'Aproxime o rosto e tente novamente'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDateTime(lastResult.timestamp)}</p>
                      <p className="text-xs text-slate-500">Confianca: {Math.round((lastResult.score || 0) * 100)}%</p>
                      {lastResult.type === 'denied' && (
                        <p className="text-xs text-red-700">
                          Se o aluno foi cadastrado antes desta versao, cadastre novamente usando a mesma matricula para
                          atualizar a foto facial.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">Nenhuma leitura registrada nesta sessao.</p>
                  )}
                </div>

                {lastCapture && (
                  <img
                    src={lastCapture}
                    alt="Ultima captura"
                    className="aspect-video w-full rounded-lg border border-slate-200 object-cover"
                  />
                )}

                {modelsError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Nao foi possivel carregar o modelo facial.
                  </p>
                )}

                <Button
                  onClick={validateEntry}
                  loading={validating}
                  disabled={!modelsReady}
                  icon={ScanFace}
                  className="h-12 w-full"
                >
                  Validar entrada
                </Button>
              </aside>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Cadastro rapido</h2>
                <p className="text-xs text-slate-500">A foto sera capturada pela camera atual.</p>
              </div>
            </div>

            <form onSubmit={registerStudent} className="mt-5 grid gap-4">
              <Input
                name="name"
                label="Nome do aluno"
                value={form.name}
                onChange={onChange}
                error={errors.name}
                autoComplete="off"
              />
              <Input
                name="registration"
                label="Matricula"
                value={form.registration}
                onChange={onChange}
                error={errors.registration}
                autoComplete="off"
              />
              <Input
                name="classGroup"
                label="Turma"
                value={form.classGroup}
                onChange={onChange}
                placeholder="Opcional"
                autoComplete="off"
              />

              <Button
                type="submit"
                loading={savingStudent}
                disabled={!modelsReady}
                icon={UserPlus}
                className="h-11"
              >
                Cadastrar com foto
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Alunos cadastrados</h3>
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                {students.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-500">Nenhum aluno cadastrado ainda.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <li key={student.id} className="flex items-center gap-3 px-3 py-2">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                            {student.name?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{student.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {student.registration}
                            {student.classGroup ? ` - ${student.classGroup}` : ''}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              student.faceDescriptor?.version === FACE_DESCRIPTOR_VERSION
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {student.faceDescriptor?.version === FACE_DESCRIPTOR_VERSION
                              ? 'Face pronta'
                              : 'Atualizar foto facial'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
