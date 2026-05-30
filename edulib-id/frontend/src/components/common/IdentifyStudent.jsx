import { useEffect, useRef, useState } from 'react';
import { ScanLine, Search, Camera, X } from 'lucide-react';
import { studentService } from '../../services/studentService.js';
import { doorService } from '../../services/doorService.js';
import { parsePayload } from '../../utils/qrUtils.js';
import { computeDescriptor, captureFrame, detectFacePresence } from '../../utils/facialUtils.js';
import { QRScanner } from '../qr/QRScanner.jsx';
import { CameraView } from '../camera/CameraView.jsx';
import { Button } from './Button.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';

const METHODS = [
  { key: 'search', label: 'Buscar', icon: Search },
  { key: 'qr', label: 'QR Code', icon: ScanLine },
  { key: 'face', label: 'Face', icon: Camera },
];

export function IdentifyStudent({ onIdentify, onClear, selected }) {
  const [method, setMethod] = useState('search');

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        {selected.photo ? (
          <img src={selected.photo} alt={selected.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            {selected.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-emerald-900">{selected.name}</p>
          <p className="text-xs text-emerald-700">
            Matricula {selected.registration} {selected.classGroup ? `- ${selected.classGroup}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
          aria-label="Trocar aluno"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              method === m.key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <m.icon className="h-4 w-4" />
            {m.label}
          </button>
        ))}
      </div>

      {method === 'search' && <SearchMode onIdentify={onIdentify} />}
      {method === 'qr' && <QrMode onIdentify={onIdentify} />}
      {method === 'face' && <FaceMode onIdentify={onIdentify} />}
    </div>
  );
}

function SearchMode({ onIdentify }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const debounced = useDebounce(query, 200);

  useEffect(() => {
    let alive = true;

    async function searchStudents() {
      if (!debounced) {
        setResults([]);
        setError(null);
        return;
      }

      const students = await studentService.list({ search: debounced });
      if (alive) {
        setResults(students.slice(0, 8));
        setError(null);
      }
    }

    searchStudents().catch((err) => {
      if (alive) {
        setResults([]);
        setError(err.message || 'Erro ao buscar alunos');
      }
    });

    return () => {
      alive = false;
    };
  }, [debounced]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nome, matricula ou turma..."
        className="input"
        autoFocus
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {debounced && (
        <ul className="mt-2 max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-slate-500">Nenhum aluno encontrado.</li>
          ) : (
            results.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onIdentify(s)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                >
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.registration} {s.classGroup ? `- ${s.classGroup}` : ''}
                    </p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function QrMode({ onIdentify }) {
  const [error, setError] = useState(null);

  const onResult = async (text) => {
    try {
      const parsed = parsePayload(text);
      if (!parsed || parsed.kind !== 'student') {
        setError('QR invalido para aluno');
        return;
      }
      const student = await studentService.findById(parsed.id);
      if (!student) {
        setError('Aluno nao encontrado');
        return;
      }
      setError(null);
      onIdentify(student);
    } catch (err) {
      setError(err.message || 'Erro ao buscar aluno');
    }
  };

  return (
    <div className="space-y-2">
      <QRScanner onResult={onResult} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">Aponte para o QR Code do aluno.</p>
    </div>
  );
}

function FaceMode({ onIdentify }) {
  const cameraRef = useRef(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);

  const tryMatch = async () => {
    const video = cameraRef.current?.getVideo();
    if (!video) return;
    setMatching(true);
    setError(null);
    try {
      const probeFrame = captureFrame(video, 480, 0.78);
      const facePresence = await detectFacePresence(probeFrame);
      if (!facePresence?.quality?.ready) {
        setError(facePresence?.quality?.message || 'Centralize o rosto antes de identificar.');
        return;
      }

      const dataUrl = captureFrame(video, 960, 0.92);
      const descriptor = await computeDescriptor(dataUrl);
      const match = await studentService.identifyByFace(descriptor);
      if (!match) {
        setError('Nenhum aluno com essa face foi encontrado.');
        return;
      }
      onIdentify(match);
      // Face validada -> dispara abertura da fechadura (fire-and-forget).
      // Erros (Arduino desconectado, backend offline) ficam apenas no console.
      doorService.open({ studentId: match.id, method: 'face' });
    } catch (err) {
      setError(err.message || 'Erro ao identificar aluno.');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="space-y-2">
      <CameraView ref={cameraRef} className="aspect-video" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Posicione o rosto e clique em Identificar.</p>
        <Button onClick={tryMatch} loading={matching} icon={Camera}>
          Identificar
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
