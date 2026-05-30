import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookMarked,
  BookOpen,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Eye,
  FileBarChart,
  Fingerprint,
  History,
  Import,
  LayoutDashboard,
  Library,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  RefreshCcw,
  RotateCw,
  Save,
  ScanFace,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  SmartphoneNfc,
  Tag,
  Upload,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { CameraView } from '../../components/camera/CameraView.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Input, Select } from '../../components/common/Input.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { bookService } from '../../services/bookService.js';
import { eventService } from '../../services/eventService.js';
import { loanService } from '../../services/loanService.js';
import { rfidService } from '../../services/rfidService.js';
import { sessionService } from '../../services/sessionService.js';
import { studentService } from '../../services/studentService.js';
import {
  FACE_DESCRIPTOR_VERSION,
  captureFrame,
  compareDescriptors,
  computeDescriptor,
  detectFacePresence,
  ensureFaceModelsLoaded,
} from '../../utils/facialUtils.js';
import { formatDate, formatDateTime, formatTime } from '../../utils/dateUtils.js';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { key: 'operations', label: 'Operacao', icon: ScanFace },
  { key: 'library', label: 'Acervo', icon: BookOpen },
  { key: 'audit', label: 'Auditoria', icon: ClipboardList },
  { key: 'students', label: 'Alunos', icon: Users },
  { key: 'reports', label: 'Relatorios', icon: FileBarChart },
  { key: 'settings', label: 'Configuracoes', icon: Settings },
];

const FLAT_NAV_ITEMS = NAV_ITEMS.flatMap((item) => item.children || [item]);

const EMPTY_STUDENT = {
  name: '',
  registration: '',
  classGroup: '',
  email: '',
  course: '',
  period: 'Matutino',
};

const BOOK_CATALOG = [];
const SAMPLE_LOANS = [];
const SECURITY_EVENTS = [];
const REPORTS = [];
const COURSE_USAGE = [];
const PERIOD_LOANS = [];
const MOVEMENT_HOURS = [];
const DISCIPLINES = [];
const SETTINGS_MODEL = [];

function nowLabel() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitialModule() {
  const hash = window.location.hash.replace('#', '');
  return FLAT_NAV_ITEMS.some((item) => item.key === hash) ? hash : 'dashboard';
}

function statusTone(status) {
  const normalized = String(status || '').toLowerCase();
  if (['ativo', 'disponivel', 'presente', 'validado', 'devolvido', 'ok', 'face pronta', 'confirmado', 'concluido'].includes(normalized)) {
    return 'emerald';
  }
  if (['atrasado', 'alta', 'inativo', 'negado', 'falha facial', 'cancelado'].includes(normalized)) return 'red';
  if (['pendente', 'reservado', 'media', 'em preparo', 'expirado', 'emprestado'].includes(normalized)) return 'amber';
  return 'slate';
}

function StatusPill({ children }) {
  const tone = statusTone(children);
  const styles = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

function Shell({ activeModule, setActiveModule, children }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const current = FLAT_NAV_ITEMS.find((item) => item.key === activeModule) || FLAT_NAV_ITEMS[0];

  const selectModule = (key) => {
    setActiveModule(key);
    window.history.replaceState(null, '', `#${key}`);
    setMobileMenu(false);
  };

  const toggleMenu = (key) => {
    setOpenMenus((value) => ({ ...value, [key]: !value[key] }));
  };

  return (
    <div className="min-h-screen bg-[#eef2f5] text-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 h-16 bg-[#b70f16] text-white shadow-sm">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenu((value) => !value)}
              className="rounded-md p-2 transition hover:bg-white/10 lg:hidden"
              aria-label="Abrir menu"
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">EduLib ID</p>
              <p className="mt-1 text-xs text-white/75">Gestao de biblioteca</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Ola, Renan!</p>
              <p className="text-xs text-white/75">Administrador institucional</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-slate-900 text-sm font-semibold">
              R
            </div>
          </div>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-16 z-30 w-72 border-r border-[#2d4a55] bg-[#365966] text-white transition-all duration-200 lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        } ${
          mobileMenu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className={`border-b border-white/10 py-5 ${sidebarCollapsed ? 'lg:px-3' : 'px-5'}`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
              <div className={sidebarCollapsed ? 'lg:hidden' : ''}>
                <p className="text-xs uppercase tracking-wide text-white/60">Navegacao</p>
                <p className="mt-1 text-sm font-semibold">Centro operacional</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="hidden rounded-md p-2 text-white/70 transition hover:bg-white/10 hover:text-white lg:inline-flex"
                aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
                title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              >
                <PanelLeftClose className={`h-5 w-5 transition ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <nav className={`flex-1 overflow-hidden py-4 ${sidebarCollapsed ? 'lg:px-2' : 'px-3'}`}>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children?.length);
                const active = hasChildren
                  ? item.children.some((child) => child.key === activeModule)
                  : activeModule === item.key;
                const open = hasChildren && openMenus[item.key];
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => (hasChildren ? (sidebarCollapsed ? selectModule(item.children[0].key) : toggleMenu(item.key)) : selectModule(item.key))}
                      title={item.label}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-medium transition ${
                        sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
                      } ${
                        active
                          ? 'bg-white text-[#365966] shadow-sm'
                          : 'text-white/88 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className={`flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                      {hasChildren ? (
                        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''} ${sidebarCollapsed ? 'lg:hidden' : ''}`} />
                      ) : (
                        active && <span className={`h-2 w-2 rounded-full bg-[#b70f16] ${sidebarCollapsed ? 'lg:hidden' : ''}`} />
                      )}
                    </button>
                    {hasChildren && open && (
                      <ul className={`mt-1 space-y-1 pl-5 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = activeModule === child.key;
                          return (
                            <li key={child.key}>
                              <button
                                type="button"
                                onClick={() => selectModule(child.key)}
                                title={child.label}
                                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                                  sidebarCollapsed ? 'lg:hidden' : ''
                                } ${
                                  childActive
                                    ? 'bg-white/95 font-semibold text-[#365966]'
                                    : 'text-white/78 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span className="flex-1">{child.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={`border-t border-white/10 py-4 ${sidebarCollapsed ? 'lg:px-3' : 'px-5'}`}>
            <div className="rounded-md bg-white/10 p-3">
              <p className={`text-xs text-white/65 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Status da plataforma</p>
              <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${sidebarCollapsed ? 'lg:mt-0 lg:justify-center' : ''}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Operacao normal</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenu && <button className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden" onClick={() => setMobileMenu(false)} />}

      <main className={`min-h-screen pt-16 transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <div className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#b70f16]">EduLib ID / {current.label}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#334d59]">{current.label}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 sm:block">
                Unidade: Fatec Registro
              </div>
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, detail, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone] || tones.blue}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="flex h-52 items-end gap-3">
      {data.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end rounded-md bg-slate-100">
            <div
              className="w-full rounded-md bg-[#b70f16]"
              style={{ height: `${Math.max((item.value / max) * 100, 8)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({ data }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">{item.value}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-[#365966]" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PieChart({ data }) {
  const colors = ['#b70f16', '#365966', '#0f766e', '#d97706', '#64748b', '#7c3aed'];
  const total = Math.max(data.reduce((sum, item) => sum + Number(item.value || 0), 0), 1);
  let cursor = 0;
  const gradient = data
    .map((item, index) => {
      const start = cursor;
      const size = (Number(item.value || 0) / total) * 360;
      cursor += size;
      return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
    })
    .join(', ');

  return (
    <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <div
        className="mx-auto h-44 w-44 rounded-full border border-slate-200 shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
        aria-label="Grafico de pizza"
      />
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-700">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-semibold text-slate-900">{Math.round((Number(item.value || 0) / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, centerValue, centerLabel }) {
  const colors = ['#b70f16', '#365966', '#0f766e', '#d97706', '#64748b'];
  const total = Math.max(data.reduce((sum, item) => sum + Number(item.value || 0), 0), 1);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="grid gap-4 sm:grid-cols-[190px_1fr] sm:items-center">
      <div className="relative mx-auto h-48 w-48">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="18" />
          {data.map((item, index) => {
            const length = (Number(item.value || 0) / total) * circumference;
            const dashOffset = offset;
            offset += length;
            return (
              <circle
                key={item.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="18"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold text-slate-950">{centerValue}</span>
          <span className="mt-1 text-xs font-semibold uppercase text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              {item.label}
            </span>
            <span className="font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ data }) {
  const size = 240;
  const center = size / 2;
  const radius = 78;
  const sides = Math.max(data.length, 3);
  const pointAt = (index, value = 1) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / sides;
    return {
      x: center + Math.cos(angle) * radius * value,
      y: center + Math.sin(angle) * radius * value,
    };
  };
  const polygon = data
    .map((item, index) => {
      const point = pointAt(index, Math.min(Number(item.value || 0), 100) / 100);
      return `${point.x},${point.y}`;
    })
    .join(' ');

  return (
    <div className="mx-auto max-w-sm">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-72 w-full">
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={data.map((_, index) => {
              const point = pointAt(index, level);
              return `${point.x},${point.y}`;
            }).join(' ')}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}
        {data.map((item, index) => {
          const end = pointAt(index, 1);
          const label = pointAt(index, 1.22);
          return (
            <g key={item.label}>
              <line x1={center} y1={center} x2={end.x} y2={end.y} stroke="#e2e8f0" />
              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-600 text-[10px] font-semibold">
                {item.label}
              </text>
            </g>
          );
        })}
        <polygon points={polygon} fill="rgba(183,15,22,0.16)" stroke="#b70f16" strokeWidth="2" />
        {data.map((item, index) => {
          const point = pointAt(index, Math.min(Number(item.value || 0), 100) / 100);
          return <circle key={item.label} cx={point.x} cy={point.y} r="4" fill="#b70f16" />;
        })}
      </svg>
      <div className="grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div key={item.label} className="rounded-md bg-slate-50 px-3 py-2">
            <p className="truncate text-xs font-semibold text-slate-600">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{Math.round(item.value)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineAreaChart({ data }) {
  const width = 520;
  const height = 220;
  const padX = 28;
  const padY = 24;
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = padX + (index / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (Number(item.value || 0) / max) * (height - padY * 2);
    return { ...item, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <defs>
        <linearGradient id="movementArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b70f16" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#b70f16" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <line
          key={level}
          x1={padX}
          y1={padY + (1 - level) * (height - padY * 2)}
          x2={width - padX}
          y2={padY + (1 - level) * (height - padY * 2)}
          stroke="#e2e8f0"
        />
      ))}
      <polygon points={area} fill="url(#movementArea)" />
      <polyline points={line} fill="none" stroke="#b70f16" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" fill="#365966" />
          <text x={point.x} y={height - 5} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function DataTable({ columns, rows, emptyText = 'Nenhum registro encontrado.' }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-3 py-3 text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchToolbar({ value, onChange, placeholder, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
        />
      </div>
      {right}
    </div>
  );
}

function buildStudentRows(students) {
  return students.map((student) => ({
    id: student.id,
    ra: student.registration,
    name: student.name,
    course: student.course || '-',
    classGroup: student.classGroup || '-',
    period: student.period || '-',
    email: student.email || '-',
    status: student.active === false ? 'Inativo' : 'Ativo',
    createdAt: student.createdAt,
    faceStatus: student.faceDescriptor?.version === FACE_DESCRIPTOR_VERSION ? 'Face pronta' : 'Pendente',
    photo: student.photo,
    raw: student,
  }));
}

function buildBookRows(books) {
  return books.map((book) => ({
    id: book.id,
    rfid: book.rfid || '',
    copyCode: book.copyCode || '',
    title: book.title,
    author: book.author,
    isbn: book.isbn || '-',
    category: book.category || 'Geral',
    course: book.course || '-',
    discipline: book.discipline || '-',
    location: book.location || '-',
    row: book.row || '',
    shelf: book.shelf || '',
    copies: Number(book.copies ?? 1),
    available: Number(book.available ?? 0),
    status: Number(book.available ?? 0) > 0 ? 'Disponivel' : 'Emprestado',
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    raw: book,
  }));
}

function createLookup(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function getActivePresence(sessions) {
  const latestByStudent = new Map();
  sessions.forEach((session) => {
    const current = latestByStudent.get(session.studentId);
    if (!current || String(session.timestamp || '').localeCompare(String(current.timestamp || '')) > 0) {
      latestByStudent.set(session.studentId, session);
    }
  });
  return [...latestByStudent.values()].filter((session) => session.type === 'entry');
}

function buildMovementRows({ sessions = [], loans = [], students = [], books = [] }) {
  const studentMap = createLookup(students);
  const bookMap = createLookup(books);
  return [
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      type: session.type === 'entry' ? 'Entrada' : 'Saida',
      detail: studentMap.get(session.studentId)?.name || session.studentId || '-',
      time: session.timestamp,
      icon: session.type === 'entry' ? LogIn : LogOut,
    })),
    ...loans.map((loan) => ({
      id: `loan-${loan.id}`,
      type: loan.status === 'returned' ? 'Devolucao' : 'Emprestimo',
      detail: `${bookMap.get(loan.bookId)?.title || loan.bookId || '-'} / ${studentMap.get(loan.studentId)?.name || loan.studentId || '-'}`,
      time: loan.returnDate || loan.loanDate,
      icon: loan.status === 'returned' ? CheckCircle2 : BookMarked,
    })),
  ]
    .filter((row) => row.time)
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
}

function getActiveLoans(loans = []) {
  return loans.filter((loan) => ['active', 'overdue', 'Ativo', 'Atrasado'].includes(loan.status));
}

function buildBookHistory(book, loans = [], events = []) {
  if (!book) return [];
  const bookId = book.id;
  const tag = String(book.rfid || '').trim();
  return [
    ...loans
      .filter((loan) => loan.bookId === bookId)
      .flatMap((loan) => [
        {
          id: `loan-out-${loan.id}`,
          type: 'Saida / Emprestimo',
          detail: loan.notes || 'Livro vinculado a aluno',
          time: loan.loanDate,
        },
        loan.returnDate
          ? {
              id: `loan-in-${loan.id}`,
              type: 'Entrada / Devolucao',
              detail: 'Livro retornou ao acervo',
              time: loan.returnDate,
            }
          : null,
      ])
      .filter(Boolean),
    ...events
      .filter((event) => {
        const payload = event.payload || {};
        return payload.bookId === bookId || (tag && [payload.tag, payload.rfid].some((value) => String(value || '').trim() === tag));
      })
      .map((event) => ({
        id: `event-${event.id}`,
        type: event.type?.includes('audit') ? 'Auditoria' : event.type?.includes('return') ? 'Devolucao' : 'Movimentacao',
        detail: event.type || 'Evento registrado',
        time: event.timestamp,
      })),
  ]
    .filter((item) => item.time)
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
}

function buildStudentHistory(student, loans = [], sessions = [], books = []) {
  if (!student) return [];
  const bookMap = createLookup(books);
  return [
    ...sessions
      .filter((session) => session.studentId === student.id)
      .map((session) => ({
        id: `session-${session.id}`,
        type: session.type === 'entry' ? 'Entrada' : 'Saida',
        detail: session.type === 'entry' ? 'Entrada registrada por FaceID' : 'Saida registrada',
        time: session.timestamp,
      })),
    ...loans
      .filter((loan) => loan.studentId === student.id)
      .flatMap((loan) => [
        {
          id: `loan-out-${loan.id}`,
          type: 'Livro retirado',
          detail: bookMap.get(loan.bookId)?.title || loan.bookId || '-',
          time: loan.loanDate,
        },
        loan.returnDate
          ? {
              id: `loan-in-${loan.id}`,
              type: 'Livro devolvido',
              detail: bookMap.get(loan.bookId)?.title || loan.bookId || '-',
              time: loan.returnDate,
            }
          : null,
      ])
      .filter(Boolean),
  ]
    .filter((item) => item.time)
    .sort((a, b) => String(b.time || '').localeCompare(String(a.time || '')));
}

function ActivityFeed({ rows, emptyText = 'Nenhuma movimentacao registrada.' }) {
  const items = rows.slice(0, 8);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#365966] shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{item.type}</p>
              <p className="truncate text-xs text-slate-500">{item.detail}</p>
            </div>
            <span className="text-xs font-medium text-slate-400">{formatDateTime(item.time)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DashboardModule({ students, books, loans, sessions }) {
  const bookRows = buildBookRows(books);
  const studentMap = createLookup(students);
  const bookMap = createLookup(bookRows);
  const activePresence = getActivePresence(sessions);
  const activeLoans = loans.filter((loan) => ['active', 'overdue'].includes(loan.status));
  const availableBooks = bookRows.filter((book) => book.status === 'Disponivel').length;
  const loanedBooks = bookRows.filter((book) => book.status === 'Emprestado').length;
  const movements = buildMovementRows({ sessions, loans, students, books });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Alunos na biblioteca" value={activePresence.length} icon={Users} tone="blue" />
        <MetricCard label="Livros disponiveis" value={availableBooks} icon={BookOpen} tone="emerald" />
        <MetricCard label="Livros emprestados" value={loanedBooks} icon={BookMarked} tone="amber" />
        <MetricCard label="Emprestimos ativos" value={activeLoans.length} icon={ClipboardList} tone="slate" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Section title="Alunos atualmente na biblioteca" subtitle="Baseado na ultima entrada/saida registrada">
          <DataTable
            emptyText="Nenhum aluno presente na biblioteca."
            columns={[
              { key: 'name', label: 'Aluno' },
              { key: 'registration', label: 'RA' },
              { key: 'entry', label: 'Entrada', render: (row) => formatDateTime(row.entry) },
            ]}
            rows={activePresence.map((session) => {
              const student = studentMap.get(session.studentId) || {};
              return {
                id: session.id,
                name: student.name || session.studentId,
                registration: student.registration || '-',
                entry: session.timestamp,
              };
            })}
          />
        </Section>

        <Section title="Ultimas movimentacoes" subtitle="Entradas, saidas, emprestimos e devolucoes">
          <ActivityFeed rows={movements} />
        </Section>
      </div>

      <Section title="Quem esta com cada livro" subtitle="Emprestimos ativos">
        <DataTable
          emptyText="Nenhum livro emprestado."
          columns={[
            { key: 'book', label: 'Livro' },
            { key: 'student', label: 'Aluno' },
            { key: 'loanDate', label: 'Retirada', render: (row) => formatDateTime(row.loanDate) },
            { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
          ]}
          rows={activeLoans.map((loan) => ({
            id: loan.id,
            book: bookMap.get(loan.bookId)?.title || loan.bookId || '-',
            student: studentMap.get(loan.studentId)?.name || loan.studentId || '-',
            loanDate: loan.loanDate,
            status: loan.status === 'overdue' ? 'Atrasado' : 'Ativo',
          }))}
        />
      </Section>
    </div>
  );
}

function OperationsModule({ students, books, loans, sessions, reload }) {
  const toast = useToast();
  const cameraRef = useRef(null);
  const rfidInputElementRef = useRef(null);
  const manualNfidInputRef = useRef(null);
  const processingRef = useRef(false);
  const exitPromptRef = useRef(null);
  const returnPromptRef = useRef(null);
  const finalizingExitRef = useRef(false);
  const detectedBooksRef = useRef([]);
  const rfidInputValueRef = useRef('');
  const mobileNfcEventIdsRef = useRef(new Set());
  const mobileNfcPollingRef = useRef(false);
  const cooldownUntilRef = useRef(0);
  const lastProcessedRef = useRef({ studentId: null, at: 0 });
  const confirmationTimerRef = useRef(null);
  const resumeCameraTimerRef = useRef(null);
  const [rfidInput, setRfidInput] = useState('');
  const [manualNfid, setManualNfid] = useState('');
  const [detectedBooks, setDetectedBooks] = useState([]);
  const [rfidLog, setRfidLog] = useState([]);
  const [exitPrompt, setExitPrompt] = useState(null);
  const [exitBookMode, setExitBookMode] = useState('question');
  const [returnPrompt, setReturnPrompt] = useState(null);
  const [returnSelectedIds, setReturnSelectedIds] = useState([]);
  const [returnNfid, setReturnNfid] = useState('');
  const [returnMobileStatus, setReturnMobileStatus] = useState('Aguardando celular');
  const [mobileBridgeStatus, setMobileBridgeStatus] = useState('Aguardando celular');
  const [lastResult, setLastResult] = useState(null);
  const [lastCapture, setLastCapture] = useState(null);
  const [frozenFrame, setFrozenFrame] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [operationStatus, setOperationStatus] = useState('Carregando FaceID');
  const [frameState, setFrameState] = useState('waiting');
  const [confirmation, setConfirmation] = useState(null);
  const movements = buildMovementRows({ sessions, loans, students, books });
  const bookMap = useMemo(() => createLookup(books), [books]);

  const FACE_SCAN_INTERVAL_MS = 1600;
  const FACE_RETRY_COOLDOWN_MS = 2600;
  const SUCCESS_COOLDOWN_MS = 14000;
  const EXIT_RFID_WINDOW_MS = 7000;
  const CONFIRMATION_VISIBLE_MS = 6500;
  const MIN_FACE_SCORE = 0.58;
  const MIN_MATCH_MARGIN = 0.04;
  const SESSION_RECOVERY_WINDOW_MS = 90000;
  const SESSION_RECOVERY_TIMEOUT_MS = 3500;

  const studentsWithFace = useMemo(
    () => students.filter((student) => student.active !== false && student.faceDescriptor?.version === FACE_DESCRIPTOR_VERSION),
    [students]
  );

  useEffect(() => {
    let alive = true;
    ensureFaceModelsLoaded()
      .then(() => alive && setModelsReady(true))
      .catch(() => alive && setModelsReady(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);

  useEffect(() => {
    exitPromptRef.current = exitPrompt;
  }, [exitPrompt]);

  useEffect(() => {
    returnPromptRef.current = returnPrompt;
  }, [returnPrompt]);

  useEffect(() => {
    detectedBooksRef.current = detectedBooks;
  }, [detectedBooks]);

  useEffect(() => () => {
    window.clearTimeout(confirmationTimerRef.current);
    window.clearTimeout(resumeCameraTimerRef.current);
  }, []);

  useEffect(() => {
    if (!exitPrompt) return undefined;
    const focusTimer = window.setTimeout(() => {
      if (exitBookMode === 'scan') rfidInputElementRef.current?.focus();
      if (exitBookMode === 'manual') manualNfidInputRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(focusTimer);
  }, [exitPrompt, exitBookMode]);

  const findBestMatch = (descriptor) => {
    return studentsWithFace.reduce(
      (best, student) => {
        const score = compareDescriptors(student.faceDescriptor, descriptor);
        if (score > best.score) {
          return { student, score, runnerUpScore: best.score };
        }
        if (score > best.runnerUpScore) {
          return { ...best, runnerUpScore: score };
        }
        return best;
      },
      { student: null, score: 0, runnerUpScore: 0 }
    );
  };

  const formatDuration = (start, end = new Date()) => {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return '-';
    const durationMs = Math.max(0, end.getTime() - startDate.getTime());
    const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes} min`;
    return `${hours}h ${String(minutes).padStart(2, '0')}min`;
  };

  const setProcessingState = (value) => {
    processingRef.current = value;
    setProcessing(value);
  };

  const freezeCameraOnFrame = (frame) => {
    if (!frame) return;
    window.clearTimeout(resumeCameraTimerRef.current);
    setFrozenFrame(frame);
  };

  const resumeCameraMonitoring = () => {
    window.clearTimeout(resumeCameraTimerRef.current);
    setFrozenFrame(null);
    cameraRef.current?.start?.();
  };

  const resumeCameraAfterDelay = (delay = 1400) => {
    window.clearTimeout(resumeCameraTimerRef.current);
    resumeCameraTimerRef.current = window.setTimeout(resumeCameraMonitoring, delay);
  };

  const resetConfirmation = () => {
    setConfirmation(null);
    setLastResult(null);
    setFrameState('waiting');
    setOperationStatus('Aguardando reconhecimento');
    resumeCameraMonitoring();
  };

  const showConfirmation = (result) => {
    window.clearTimeout(confirmationTimerRef.current);
    setFrameState('success');
    setConfirmation(result);
    setLastResult(result);
    confirmationTimerRef.current = window.setTimeout(resetConfirmation, CONFIRMATION_VISIBLE_MS);
  };

  const reloadInBackground = (context) => {
    Promise.resolve()
      .then(() => reload?.())
      .catch((err) => {
        console.warn(`[operations] Falha ao atualizar dados apos ${context}:`, err);
        toast.info('Registro concluido. Os dados serao sincronizados em instantes.', {
          title: 'Sincronizacao pendente',
          duration: 3200,
        });
      });
  };

  const isRecoverableSessionError = (err) => {
    const message = `${err?.message || ''} ${err?.code || ''}`.toLowerCase();
    return message.includes('timeout') || message.includes('network') || message.includes('econnaborted');
  };

  const findRecentSession = async (studentId, type) => {
    try {
      const latestSession = await Promise.race([
        sessionService.lastByStudent(studentId),
        new Promise((resolve) => window.setTimeout(() => resolve(null), SESSION_RECOVERY_TIMEOUT_MS)),
      ]);
      const timestamp = latestSession?.timestamp ? new Date(latestSession.timestamp).getTime() : 0;
      const recent = timestamp && Date.now() - timestamp <= SESSION_RECOVERY_WINDOW_MS;
      return latestSession?.type === type && recent ? latestSession : null;
    } catch (err) {
      console.warn('[operations] Nao foi possivel confirmar a ultima sessao:', err);
      return null;
    }
  };

  const completeEntry = (student, score, session, recovered = false) => {
    showConfirmation({ status: 'Entrada registrada com sucesso', action: 'entry', student, score, time: session.timestamp });
    toast.success(recovered ? `Entrada confirmada para ${student.name}.` : `Entrada registrada para ${student.name}.`);
    lastProcessedRef.current = { studentId: student.id, at: Date.now() };
    cooldownUntilRef.current = Date.now() + SUCCESS_COOLDOWN_MS;
    setOperationStatus('Aguardando proximo aluno');
    reloadInBackground('entrada');
    openReturnPromptForStudent(student, session);
  };

  const completeExit = ({ windowData, session, duration, booksToCheckout, createdLoans, recovered = false }) => {
    showConfirmation({
      status: 'Saida registrada com sucesso',
      action: 'exit',
      student: windowData.student,
      score: windowData.score,
      time: session.timestamp,
      duration,
      bookNotice: booksToCheckout.length
        ? `${booksToCheckout.length} livro(s) vinculado(s) ao aluno.`
        : 'Nenhum livro detectado. Saida registrada apenas com permanencia.',
      books: booksToCheckout,
      loans: createdLoans,
    });
    toast.success(
      recovered
        ? `Saida confirmada para ${windowData.student.name}.`
        : booksToCheckout.length
        ? `Saida registrada para ${windowData.student.name} com ${booksToCheckout.length} livro(s).`
        : `Saida registrada para ${windowData.student.name}. Permanencia: ${duration}.`
    );
    lastProcessedRef.current = { studentId: windowData.student.id, at: Date.now() };
    cooldownUntilRef.current = Date.now() + SUCCESS_COOLDOWN_MS;
    setOperationStatus('Aguardando proximo aluno');
    exitPromptRef.current = null;
    setExitPrompt(null);
    setExitBookMode('question');
    resetRfidReadState();
    reloadInBackground('saida');
  };

  const resetRfidReadState = () => {
    detectedBooksRef.current = [];
    rfidInputValueRef.current = '';
    mobileNfcEventIdsRef.current = new Set();
    setDetectedBooks([]);
    setRfidLog([]);
    setRfidInput('');
    setManualNfid('');
    setMobileBridgeStatus('Aguardando celular');
  };

  const buildMobileCheckoutUrl = (windowData) => {
    if (!windowData?.student || !windowData?.openSession) return `${window.location.origin}/nfc-mobile?flow=checkout`;

    const url = new URL('/nfc-mobile', window.location.origin);
    url.searchParams.set('flow', 'checkout');
    url.searchParams.set('operation', 'checkout');
    url.searchParams.set('source', 'platform');
    url.searchParams.set('studentId', windowData.student.id);
    url.searchParams.set('sessionId', windowData.openSession.id);
    url.searchParams.set('registration', windowData.student.registration || '');
    url.searchParams.set('name', windowData.student.name || '');
    return url.toString();
  };

  const publishMobileCheckoutRequest = async (windowData) => {
    if (!windowData?.student || !windowData?.openSession) return;

    const url = buildMobileCheckoutUrl(windowData);
    const payload = {
      source: 'platform',
      studentId: windowData.student.id,
      studentName: windowData.student.name,
      registration: windowData.student.registration,
      sessionId: windowData.openSession.id,
      requestedAt: new Date().toISOString(),
      url,
    };

    setMobileBridgeStatus('Aguardando leitura no celular');

    try {
      await eventService.create({ type: 'nfc.read.requested', actor: 'platform', payload: { ...payload, operation: 'checkout' } });
    } catch (err) {
      console.warn('[operations] Nao foi possivel publicar solicitacao NFC mobile:', err);
      setMobileBridgeStatus('Abra o link no celular e leia a tag');
    }
  };

  const getStudentActiveLoans = (studentId) => getActiveLoans(loans).filter((loan) => loan.studentId === studentId);

  const openReturnPromptForStudent = (student, session) => {
    const activeLoans = getStudentActiveLoans(student.id);
    if (!activeLoans.length) return;

    setReturnPrompt({ student, session, loans: activeLoans, startedAt: Date.now() });
    setReturnSelectedIds([]);
    setReturnNfid('');
    setReturnMobileStatus('Aguardando leitura NFC');
    setOperationStatus('Aluno possui livros para devolucao');
  };

  const publishMobileReturnRequest = async () => {
    if (!returnPrompt?.student) return;
    const payload = {
      operation: 'return',
      source: 'platform',
      studentId: returnPrompt.student.id,
      studentName: returnPrompt.student.name,
      registration: returnPrompt.student.registration,
      sessionId: returnPrompt.session?.id || '',
      requestedAt: new Date().toISOString(),
    };
    setReturnMobileStatus('Aguardando leitura no celular');
    try {
      await eventService.create({ type: 'nfc.read.requested', actor: 'platform', payload });
    } catch (err) {
      console.warn('[operations] Nao foi possivel publicar devolucao NFC mobile:', err);
      setReturnMobileStatus('Nao foi possivel avisar o celular. Digite o NFID.');
    }
  };

  const registerRfidCode = async (code) => {
    const normalized = String(code || '').trim();
    if (!normalized) return null;

    rfidInputValueRef.current = '';
    setRfidInput('');

    if (detectedBooksRef.current.some((book) => String(book.rfid || '').trim() === normalized)) {
      setRfidLog((items) => [
        { id: `${normalized}-${Date.now()}`, code: normalized, status: 'Ignorado', detail: 'Leitura duplicada' },
        ...items,
      ]);
      return null;
    }

    const book = await rfidService.findBook(normalized);
    if (!book) {
      setRfidLog((items) => [
        { id: `${normalized}-${Date.now()}`, code: normalized, status: 'Nao cadastrado', detail: 'RFID sem livro vinculado' },
        ...items,
      ]);
      setMobileBridgeStatus(`NFID ${normalized} nao cadastrado`);
      toast.error(`NFID ${normalized} nao encontrado no acervo.`);
      return null;
    }

    const next = [...detectedBooksRef.current, book];
    detectedBooksRef.current = next;
    setDetectedBooks(next);
    setOperationStatus('Livro detectado na saida');
    setRfidLog((items) => [
      { id: `${normalized}-${Date.now()}`, code: normalized, status: 'Detectado', detail: book.title },
      ...items,
    ]);
    setMobileBridgeStatus(`Recebido do celular/leitor: ${book.title}`);
    toast.info(`${book.title} identificado. NFID preenchido.`, { title: 'Livro detectado', duration: 2600 });
    return book;
  };

  const registerBufferedRfid = async () => {
    const buffered = rfidInputValueRef.current.trim();
    if (buffered) await registerRfidCode(buffered);
  };

  const finishExit = async (windowData) => {
    if (!windowData || finalizingExitRef.current) return;

    finalizingExitRef.current = true;
    setProcessingState(true);
    setOperationStatus('Finalizando saida');
    let booksToCheckout = [];
    let createdLoans = [];
    let duration = formatDuration(windowData.openSession.timestamp);
    let sessionCreateStarted = false;

    try {
      await registerBufferedRfid();
      booksToCheckout = detectedBooksRef.current.filter((book) => book.rfid);

      if (booksToCheckout.length) {
        createdLoans = await rfidService.checkoutBooks({
          studentId: windowData.student.id,
          rfids: booksToCheckout.map((book) => book.rfid),
        });
      }

      const finishedAt = new Date();
      duration = formatDuration(windowData.openSession.timestamp, finishedAt);
      sessionCreateStarted = true;
      const session = await sessionService.create({
        studentId: windowData.student.id,
        type: 'exit',
        method: 'face',
        notes: [
          'operacao:auto-exit',
          `score:${windowData.score.toFixed(3)}`,
          `entrada:${windowData.openSession.timestamp}`,
          `permanencia:${duration}`,
          `livros:${booksToCheckout.length}`,
        ].join(';'),
      });

      completeExit({ windowData, session, duration, booksToCheckout, createdLoans });
    } catch (err) {
      if (sessionCreateStarted && isRecoverableSessionError(err)) {
        setOperationStatus('Confirmando saida registrada');
        const confirmedSession = await findRecentSession(windowData.student.id, 'exit');
        if (confirmedSession) {
          completeExit({ windowData, session: confirmedSession, duration, booksToCheckout, createdLoans, recovered: true });
          return;
        }
      }

      setLastResult({
        status: 'Falha na saida',
        action: 'error',
        student: windowData.student,
        score: windowData.score,
        time: new Date().toISOString(),
        error: err.message,
      });
      setOperationStatus('Falha operacional');
      toast.error(err.message || 'Erro ao finalizar saida');
      cooldownUntilRef.current = Date.now() + FACE_RETRY_COOLDOWN_MS;
    } finally {
      finalizingExitRef.current = false;
      setProcessingState(false);
    }
  };

  const beginExit = (student, openSession, score) => {
    resetRfidReadState();
    window.clearTimeout(confirmationTimerRef.current);
    const startedAt = Date.now();
    const windowData = {
      student,
      openSession,
      score,
      startedAt,
      endsAt: startedAt + EXIT_RFID_WINDOW_MS,
    };
    setLastResult({
      status: 'Saida identificada',
      action: 'exit-pending',
      student,
      score,
      time: new Date(startedAt).toISOString(),
      duration: formatDuration(openSession.timestamp),
    });
    setFrameState('success');
    setOperationStatus('Aguardando confirmacao de livros');
    exitPromptRef.current = windowData;
    setExitPrompt(windowData);
    setExitBookMode('question');
  };

  const cancelExitPrompt = () => {
    exitPromptRef.current = null;
    setExitPrompt(null);
    setExitBookMode('question');
    resetRfidReadState();
    setFrameState('waiting');
    setOperationStatus('Aguardando reconhecimento');
    cooldownUntilRef.current = Date.now() + FACE_RETRY_COOLDOWN_MS;
    resumeCameraMonitoring();
  };

  const startTagRead = () => {
    setExitBookMode('scan');
    setOperationStatus('Aguardando NFID do livro');
    publishMobileCheckoutRequest(exitPromptRef.current);
    setTimeout(() => rfidInputElementRef.current?.focus(), 80);
  };

  const startManualNfid = () => {
    setExitBookMode('manual');
    setOperationStatus('Digitando NFID do livro');
    setTimeout(() => manualNfidInputRef.current?.focus(), 80);
  };

  const addManualNfid = async () => {
    const book = await registerRfidCode(manualNfid);
    if (book) setManualNfid('');
    setTimeout(() => manualNfidInputRef.current?.focus(), 80);
  };

  const finishExitFromModal = async () => {
    const currentPrompt = exitPromptRef.current;
    if (!currentPrompt) return;
    await finishExit(currentPrompt);
  };

  const registerEntry = async (student, score) => {
    setProcessingState(true);
    setOperationStatus('Registrando entrada');
    let sessionCreateStarted = false;
    try {
      sessionCreateStarted = true;
      const session = await sessionService.create({
        studentId: student.id,
        type: 'entry',
        method: 'face',
        notes: `operacao:auto-entry;score:${score.toFixed(3)}`,
      });
      completeEntry(student, score, session);
    } catch (err) {
      if (sessionCreateStarted && isRecoverableSessionError(err)) {
        setOperationStatus('Confirmando entrada registrada');
        const confirmedSession = await findRecentSession(student.id, 'entry');
        if (confirmedSession) {
          completeEntry(student, score, confirmedSession, true);
          return;
        }
      }

      setLastResult({ status: 'Falha na entrada', action: 'error', student, score, time: new Date().toISOString(), error: err.message });
      setOperationStatus('Falha operacional');
      toast.error(err.message || 'Erro ao registrar entrada');
      cooldownUntilRef.current = Date.now() + FACE_RETRY_COOLDOWN_MS;
      resumeCameraAfterDelay();
    } finally {
      setProcessingState(false);
    }
  };

  const closeReturnPrompt = () => {
    setReturnPrompt(null);
    setReturnSelectedIds([]);
    setReturnNfid('');
    setReturnMobileStatus('Aguardando celular');
    cooldownUntilRef.current = Date.now() + FACE_RETRY_COOLDOWN_MS;
    resumeCameraMonitoring();
  };

  const returnLoansForPrompt = async (loanIds) => {
    if (!returnPrompt || !loanIds.length) return;
    setReturning(true);
    try {
      for (const loanId of loanIds) {
        const allowed = returnPrompt.loans.some((loan) => loan.id === loanId);
        if (!allowed) throw new Error('Este livro nao pertence ao aluno identificado.');
        await loanService.returnLoan(loanId);
      }
      toast.success(`${loanIds.length} livro(s) devolvido(s).`);
      reloadInBackground('devolucao');
      closeReturnPrompt();
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar devolucao');
    } finally {
      setReturning(false);
    }
  };

  const returnBookForPromptByNfid = async (code) => {
    const normalized = String(code || '').trim();
    if (!normalized || !returnPrompt) return;
    setReturning(true);
    try {
      const book = await rfidService.findBook(normalized);
      if (!book) throw new Error(`NFID ${normalized} nao encontrado no acervo.`);
      const loan = returnPrompt.loans.find((item) => item.bookId === book.id);
      if (!loan) throw new Error('Este livro nao esta vinculado ao aluno identificado.');
      await returnLoansForPrompt([loan.id]);
      setReturnNfid('');
    } catch (err) {
      toast.error(err.message || 'Erro ao validar devolucao');
    } finally {
      setReturning(false);
    }
  };

  const processFaceFrame = async () => {
    if (!modelsReady) {
      setOperationStatus('Carregando FaceID');
      setFrameState('waiting');
      return;
    }
    if (!studentsWithFace.length) {
      setOperationStatus('Sem alunos com FaceID');
      setFrameState('waiting');
      return;
    }
    if (processingRef.current || exitPromptRef.current || returnPromptRef.current || Date.now() < cooldownUntilRef.current) return;

    setProcessingState(true);
    try {
      const video = cameraRef.current?.getVideo();
      const probeFrame = captureFrame(video, 360, 0.72);
      if (!probeFrame) {
        setOperationStatus('Aguardando camera');
        setFrameState('waiting');
        return;
      }
      const facePresence = await detectFacePresence(probeFrame);
      if (!facePresence) {
        setOperationStatus('Posicione o rosto dentro da area indicada');
        setFrameState('waiting');
        return;
      }
      if (!facePresence.quality?.ready) {
        setOperationStatus(facePresence.quality?.message || 'Ajuste o enquadramento do rosto');
        setFrameState('waiting');
        return;
      }

      setOperationStatus('Rosto enquadrado. Capturando imagem');
      const frame = captureFrame(video, 960, 0.92) || probeFrame;
      setFrameState('scanning');
      setLastCapture(frame);
      freezeCameraOnFrame(frame);
      setOperationStatus('Imagem capturada. Validando FaceID');
      const descriptor = await computeDescriptor(frame);
      const match = findBestMatch(descriptor);
      const ambiguousMatch = match.runnerUpScore > 0 && match.score - match.runnerUpScore < MIN_MATCH_MARGIN;

      if (!match.student || match.score < MIN_FACE_SCORE || ambiguousMatch) {
        setLastResult({
          status: ambiguousMatch ? 'Validacao inconclusiva' : 'Nao reconhecido',
          score: match.score,
          time: new Date().toISOString(),
        });
        setOperationStatus(ambiguousMatch ? 'Rosto semelhante a mais de um cadastro' : 'Aluno nao reconhecido');
        setFrameState('waiting');
        cooldownUntilRef.current = Date.now() + FACE_RETRY_COOLDOWN_MS;
        resumeCameraAfterDelay();
        return;
      }

      if (
        lastProcessedRef.current.studentId === match.student.id &&
        Date.now() - lastProcessedRef.current.at < SUCCESS_COOLDOWN_MS
      ) {
        setOperationStatus('Aguardando afastamento');
        setFrameState('success');
        resumeCameraAfterDelay(900);
        return;
      }

      setFrameState('success');
      setOperationStatus('Consultando sessao');
      const latestSession = await sessionService.lastByStudent(match.student.id);
      if (latestSession?.type === 'entry') beginExit(match.student, latestSession, match.score);
      else await registerEntry(match.student, match.score);
    } catch (err) {
      if (err.message?.includes('Nenhum rosto')) {
        setOperationStatus('Aguardando reconhecimento');
        setFrameState('waiting');
        resumeCameraAfterDelay(800);
      } else {
        setOperationStatus('Falha operacional');
        setFrameState('waiting');
        toast.error(err.message || 'Erro na operacao');
        resumeCameraAfterDelay();
      }
      cooldownUntilRef.current = Date.now() + FACE_RETRY_COOLDOWN_MS;
    } finally {
      setProcessingState(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(processFaceFrame, FACE_SCAN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [modelsReady, studentsWithFace, sessions]);

  useEffect(() => {
    if (!exitPrompt || exitBookMode !== 'scan') return undefined;

    let cancelled = false;
    const requestStartedAt = exitPrompt.startedAt || Date.now();

    const readMobileCheckoutEvents = async () => {
      if (mobileNfcPollingRef.current) return;
      mobileNfcPollingRef.current = true;

      try {
        const events = await eventService.list({ type: 'nfc.read.completed', limit: 20 });
        if (cancelled) return;

        for (const event of events.slice().reverse()) {
          if (!event?.id || mobileNfcEventIdsRef.current.has(event.id)) continue;

          const payload = event.payload || {};
          const eventTime = new Date(event.timestamp || payload.timestamp || 0).getTime();
          const sameSession = payload.sessionId && payload.sessionId === exitPrompt.openSession?.id;
          const sameStudent = payload.studentId && payload.studentId === exitPrompt.student?.id;
          const recent = eventTime >= requestStartedAt - 10000;

          if (payload.operation !== 'checkout' || !payload.tag || !recent || (!sameSession && !sameStudent)) continue;

          mobileNfcEventIdsRef.current.add(event.id);
          setMobileBridgeStatus('NFID recebido do celular');
          await registerRfidCode(payload.tag);
        }
      } catch (err) {
        console.warn('[operations] Falha ao consultar leituras NFC mobile:', err);
      } finally {
        mobileNfcPollingRef.current = false;
      }
    };

    readMobileCheckoutEvents();
    const timer = window.setInterval(readMobileCheckoutEvents, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [exitPrompt, exitBookMode]);

  useEffect(() => {
    if (!returnPrompt) return undefined;

    let cancelled = false;
    const requestStartedAt = returnPrompt.startedAt || Date.now();

    const readMobileReturnEvents = async () => {
      if (mobileNfcPollingRef.current) return;
      mobileNfcPollingRef.current = true;

      try {
        const events = await eventService.list({ type: 'nfc.read.completed', limit: 20 });
        if (cancelled) return;

        for (const event of events.slice().reverse()) {
          if (!event?.id || mobileNfcEventIdsRef.current.has(event.id)) continue;
          const payload = event.payload || {};
          const eventTime = new Date(event.timestamp || payload.timestamp || 0).getTime();
          const sameStudent = payload.studentId && payload.studentId === returnPrompt.student?.id;
          const recent = eventTime >= requestStartedAt - 10000;
          if (payload.operation !== 'return' || !payload.tag || !recent || !sameStudent) continue;

          mobileNfcEventIdsRef.current.add(event.id);
          setReturnMobileStatus('NFID recebido do celular');
          await returnBookForPromptByNfid(payload.tag);
        }
      } catch (err) {
        console.warn('[operations] Falha ao consultar devolucao NFC mobile:', err);
      } finally {
        mobileNfcPollingRef.current = false;
      }
    };

    readMobileReturnEvents();
    const timer = window.setInterval(readMobileReturnEvents, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [returnPrompt]);

  const exitPromptOpen = Boolean(exitPrompt);
  const bookFlowActive = exitPromptOpen;
  const frameConfirmed = frameState === 'success' || Boolean(confirmation) || bookFlowActive;
  const frameMessage = confirmation?.status
    || (exitPromptOpen
      ? 'Saida identificada. Conclua no modal.'
      : frameState === 'scanning'
        ? 'Imagem capturada. Validando FaceID.'
      : operationStatus && !['Aguardando reconhecimento', 'Carregando FaceID'].includes(operationStatus)
        ? operationStatus
        : 'Posicione o rosto dentro da area indicada.');
  const frameHint = confirmation
    ? 'Identificacao realizada'
    : exitPromptOpen
      ? 'Informe o livro ou registre a saida sem livro'
      : frameState === 'scanning'
        ? 'Camera pausada temporariamente para validar um unico frame'
      : 'Aproxime-se da camera e centralize o rosto';
  const visibleResult = confirmation || lastResult;

  return (
    <div className="space-y-5">
      <Section
        title="Operacao automatica"
        subtitle="Reconhecimento facial continuo com decisao automatica de entrada ou saida"
        action={
          <StatusPill>{modelsReady ? operationStatus : 'Carregando FaceID'}</StatusPill>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative min-h-[480px] overflow-hidden rounded-md bg-slate-950">
            <CameraView ref={cameraRef} className="h-full min-h-[480px] rounded-md" />
            {frozenFrame && (
              <img
                src={frozenFrame}
                alt="Frame facial capturado"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-slate-950/10">
              <div className="absolute inset-x-6 top-6 rounded-md bg-slate-950/45 px-4 py-3 text-center text-white shadow-sm">
                <p className="text-sm font-semibold">{frameMessage}</p>
                <p className="mt-1 text-xs text-white/75">{frameHint}</p>
              </div>
              <div
                className={`absolute left-1/2 top-1/2 aspect-[3/4] h-[58%] max-h-[360px] min-h-[250px] -translate-x-1/2 -translate-y-1/2 rounded-[44%] border-[6px] shadow-[0_0_0_9999px_rgba(15,23,42,0.28)] transition ${
                  frameConfirmed ? 'border-emerald-400 shadow-emerald-950/30' : 'border-amber-400 shadow-amber-950/30'
                }`}
              >
                <span className={`absolute -left-2 -top-2 h-10 w-10 rounded-tl-[28px] border-l-4 border-t-4 ${frameConfirmed ? 'border-emerald-200' : 'border-amber-200'}`} />
                <span className={`absolute -right-2 -top-2 h-10 w-10 rounded-tr-[28px] border-r-4 border-t-4 ${frameConfirmed ? 'border-emerald-200' : 'border-amber-200'}`} />
                <span className={`absolute -bottom-2 -left-2 h-10 w-10 rounded-bl-[28px] border-b-4 border-l-4 ${frameConfirmed ? 'border-emerald-200' : 'border-amber-200'}`} />
                <span className={`absolute -bottom-2 -right-2 h-10 w-10 rounded-br-[28px] border-b-4 border-r-4 ${frameConfirmed ? 'border-emerald-200' : 'border-amber-200'}`} />
              </div>
              {confirmation && (
                <div className="absolute inset-x-6 bottom-6 rounded-md border border-emerald-200 bg-emerald-50/95 p-4 text-slate-900 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-emerald-900">{confirmation.status}</p>
                      <p className="mt-1 truncate text-sm text-slate-700">{confirmation.student?.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        RA {confirmation.student?.registration || '-'}
                        {confirmation.duration ? ` / Permanencia ${confirmation.duration}` : ''}
                      </p>
                      {confirmation.bookNotice && (
                        <p className="mt-2 rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-emerald-800">
                          {confirmation.bookNotice}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Atendimento atual</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{visibleResult?.status || operationStatus}</p>
              <p className="mt-1 text-sm text-slate-500">{visibleResult?.student?.name || 'Nenhum aluno identificado'}</p>
              {visibleResult?.duration && <p className="mt-2 text-sm font-semibold text-slate-700">Permanencia: {visibleResult.duration}</p>}
              {visibleResult?.time && <p className="mt-3 text-xs text-slate-500">{formatDateTime(visibleResult.time)}</p>}
              {visibleResult?.bookNotice && (
                <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                  {visibleResult.bookNotice}
                </div>
              )}
              {visibleResult?.books?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {visibleResult.books.map((book) => (
                    <div key={book.id} className="truncate rounded bg-white px-2 py-1 text-xs text-slate-600">
                      {book.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lastCapture && <img src={lastCapture} alt="Ultima captura facial" className="aspect-video rounded-md object-cover" />}
          </div>
        </div>
      </Section>

      <Section title="Movimentacoes" subtitle="Historico operacional vindo da API">
        <ActivityFeed rows={movements} />
      </Section>

      <Modal
        open={Boolean(exitPrompt)}
        onClose={() => (processing ? null : cancelExitPrompt())}
        title="Esta com algum livro?"
        size="lg"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" onClick={cancelExitPrompt} disabled={processing}>Cancelar saida</Button>
            <div className="flex flex-wrap justify-end gap-2">
              {exitBookMode !== 'question' && (
                <Button variant="secondary" onClick={() => setExitBookMode('question')} disabled={processing}>
                  Voltar
                </Button>
              )}
              {detectedBooks.length === 0 && (
                <Button variant="secondary" icon={CheckCircle2} loading={processing} onClick={finishExitFromModal}>
                  Sair sem livro
                </Button>
              )}
              {exitBookMode === 'question' && (
                <>
                  <Button variant="secondary" icon={Save} onClick={startManualNfid} disabled={processing}>
                    Digitar NFID
                  </Button>
                  <Button icon={Tag} onClick={startTagRead} disabled={processing}>
                    Ler tag
                  </Button>
                </>
              )}
              {exitBookMode !== 'question' && detectedBooks.length > 0 && (
                <Button icon={CheckCircle2} loading={processing} onClick={finishExitFromModal}>
                  Finalizar saida
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aluno identificado</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{exitPrompt?.student?.name || '-'}</p>
            <p className="mt-1 text-sm text-slate-600">
              RA {exitPrompt?.student?.registration || '-'} / Permanencia {exitPrompt?.openSession?.timestamp ? formatDuration(exitPrompt.openSession.timestamp) : '-'}
            </p>
          </div>

          {exitBookMode === 'scan' && (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="modal-rfid-reader">
                    Ler tag do livro
                  </label>
                  <p className="mt-1 text-xs text-slate-500">{mobileBridgeStatus}</p>
                </div>
                <Tag className="h-5 w-5 text-[#365966]" />
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="modal-rfid-reader"
                  ref={rfidInputElementRef}
                  value={rfidInput}
                  disabled={processing}
                  onChange={(event) => {
                    rfidInputValueRef.current = event.target.value;
                    setRfidInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      registerRfidCode(rfidInputValueRef.current);
                    }
                  }}
                  placeholder="Aproxime a tag ou leia o NFID"
                  className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
                  autoComplete="off"
                />
                <Button variant="secondary" onClick={registerBufferedRfid} disabled={!rfidInput.trim() || processing}>
                  Adicionar leitura
                </Button>
              </div>
            </div>
          )}

          {exitBookMode === 'manual' && (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="manual-nfid">
                NFID do livro
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="manual-nfid"
                  ref={manualNfidInputRef}
                  value={manualNfid}
                  disabled={processing}
                  onChange={(event) => setManualNfid(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addManualNfid();
                    }
                  }}
                  placeholder="Digite o NFID"
                  className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
                  autoComplete="off"
                />
                <Button variant="secondary" onClick={addManualNfid} disabled={!manualNfid.trim() || processing}>
                  Adicionar NFID
                </Button>
              </div>
            </div>
          )}

          {(detectedBooks.length > 0 || rfidLog.length > 0) && (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Livros identificados</p>
                  <p className="mt-1 text-sm text-slate-600">{detectedBooks.length} livro(s) para vincular</p>
                </div>
                <StatusPill>{detectedBooks.length ? 'Detectado' : 'Pendente'}</StatusPill>
              </div>
              <div className="mt-3 space-y-2">
                {detectedBooks.map((book) => (
                  <div key={book.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">{book.title}</span>
                    <StatusPill>{book.rfid}</StatusPill>
                  </div>
                ))}
                {rfidLog.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs">
                    <span className="truncate">{item.detail}</span>
                    <StatusPill>{item.status}</StatusPill>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(returnPrompt)}
        onClose={() => (returning ? null : closeReturnPrompt())}
        title="Devolucao vinculada ao aluno"
        size="xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" onClick={closeReturnPrompt} disabled={returning}>Fechar</Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" icon={SmartphoneNfc} onClick={publishMobileReturnRequest} disabled={returning}>
                Ler NFC no celular
              </Button>
              <Button icon={RotateCw} loading={returning} disabled={returnSelectedIds.length === 0} onClick={() => returnLoansForPrompt(returnSelectedIds)}>
                Devolver selecionados
              </Button>
            </div>
          </div>
        }
      >
        {returnPrompt && (
          <div className="space-y-4">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Aluno identificado por FaceID</p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">{returnPrompt.student.name}</p>
              <p className="mt-1 text-sm text-emerald-800">RA {returnPrompt.student.registration || '-'} / {returnPrompt.loans.length} livro(s) ativo(s)</p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                label="Validar NFID/RFID do livro"
                value={returnNfid}
                onChange={(event) => setReturnNfid(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    returnBookForPromptByNfid(returnNfid);
                  }
                }}
                placeholder="Leia ou digite o NFID"
              />
              <div className="flex items-end">
                <Button variant="secondary" loading={returning} disabled={!returnNfid.trim()} onClick={() => returnBookForPromptByNfid(returnNfid)}>
                  Validar
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Celular NFC auxiliar</p>
              <p className="mt-1 text-xs">{returnMobileStatus}</p>
            </div>

            <DataTable
              emptyText="Nenhum livro ativo para devolucao."
              columns={[
                {
                  key: 'select',
                  label: '',
                  render: (row) => (
                    <input
                      type="checkbox"
                      checked={returnSelectedIds.includes(row.id)}
                      onChange={(event) => {
                        setReturnSelectedIds((current) => event.target.checked
                          ? [...current, row.id]
                          : current.filter((id) => id !== row.id));
                      }}
                    />
                  ),
                },
                { key: 'book', label: 'Livro' },
                { key: 'rfid', label: 'RFID/NFC' },
                { key: 'loanDate', label: 'Retirada', render: (row) => formatDateTime(row.loanDate) },
                { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
              ]}
              rows={returnPrompt.loans.map((loan) => {
                const book = bookMap.get(loan.bookId) || {};
                return {
                  id: loan.id,
                  book: book.title || loan.bookId || '-',
                  rfid: book.rfid || '-',
                  loanDate: loan.loanDate,
                  status: loan.status === 'overdue' ? 'Atrasado' : 'Ativo',
                };
              })}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function StudentsModule({ students, books, loans, sessions, reload }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [faceModalStudent, setFaceModalStudent] = useState(null);
  const [studentEditForm, setStudentEditForm] = useState({ registration: '', name: '', course: '' });
  const [studentForm, setStudentForm] = useState({ registration: '', name: '', course: '', photo: '', faceDescriptor: null });
  const [facePreview, setFacePreview] = useState('');
  const [capturingFace, setCapturingFace] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const faceCameraRef = useRef(null);
  const updateFaceCameraRef = useRef(null);
  const rows = buildStudentRows(students).filter((row) =>
    [row.ra, row.name, row.course, row.classGroup].join(' ').toLowerCase().includes(query.toLowerCase())
  );
  const faceOutdated = selected && selected.faceStatus !== 'Face pronta';
  const selectedHistory = selected ? buildStudentHistory(selected.raw, loans, sessions, books) : [];
  const selectedActiveLoans = selected ? getActiveLoans(loans).filter((loan) => loan.studentId === selected.id) : [];
  const bookMap = createLookup(books);
  const lastUsage = selectedHistory[0]?.time || selected?.createdAt;

  useEffect(() => {
    let alive = true;
    ensureFaceModelsLoaded()
      .then(() => alive && setModelsReady(true))
      .catch(() => alive && setModelsReady(false));
    return () => {
      alive = false;
    };
  }, []);

  const resetStudentForm = () => {
    setStudentForm({ registration: '', name: '', course: '', photo: '', faceDescriptor: null });
    setFacePreview('');
  };

  const openStudentModal = () => {
    resetStudentForm();
    setStudentModalOpen(true);
  };

  const openStudentDetails = (row) => {
    setSelected(row);
    setStudentEditForm({
      registration: row.raw.registration || '',
      name: row.raw.name || '',
      course: row.raw.course || '',
    });
  };

  const closeStudentModal = () => {
    setStudentModalOpen(false);
    resetStudentForm();
  };

  const captureFace = async (cameraRef, onCapture) => {
    if (!modelsReady) {
      toast.error('Modelo facial ainda esta carregando.');
      return;
    }
    setCapturingFace(true);
    try {
      const video = cameraRef.current?.getVideo();
      const probeFrame = captureFrame(video, 480, 0.78);
      const facePresence = await detectFacePresence(probeFrame);
      if (!facePresence?.quality?.ready) {
        throw new Error(facePresence?.quality?.message || 'Centralize o rosto antes de capturar o FaceID.');
      }

      const frame = captureFrame(video, 960, 0.92);
      if (!frame) throw new Error('Camera ainda nao esta pronta.');
      const descriptor = await computeDescriptor(frame);
      await onCapture({ frame, descriptor });
      toast.success('FaceID capturado.');
    } catch (err) {
      toast.error(err.message || 'Erro ao capturar FaceID');
    } finally {
      setCapturingFace(false);
    }
  };

  const saveStudent = async () => {
    setSavingStudent(true);
    try {
      const payload = {
        registration: studentForm.registration.trim(),
        name: studentForm.name.trim(),
        course: studentForm.course.trim(),
        photo: studentForm.photo || null,
        faceDescriptor: studentForm.faceDescriptor,
        active: true,
      };
      if (!payload.registration || !payload.name) throw new Error('Informe RA e nome do aluno.');

      await studentService.create(payload);
      await reload?.();
      toast.success('Aluno cadastrado.');
      closeStudentModal();
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar aluno');
    } finally {
      setSavingStudent(false);
    }
  };

  const updateStudentFace = async () => {
    if (!faceModalStudent?.id) return;
    await captureFace(updateFaceCameraRef, async ({ frame, descriptor }) => {
      await studentService.update(faceModalStudent.id, { photo: frame, faceDescriptor: descriptor });
      await reload?.();
      setFaceModalStudent(null);
      setSelected(null);
      toast.success('FaceID atualizado.');
    });
  };

  const saveSelectedStudent = async () => {
    if (!selected?.id) return;
    try {
      const payload = {
        registration: studentEditForm.registration.trim(),
        name: studentEditForm.name.trim(),
        course: studentEditForm.course.trim(),
      };
      if (!payload.registration || !payload.name) throw new Error('Informe RA e nome.');
      await studentService.update(selected.id, payload);
      await reload?.();
      toast.success('Aluno atualizado.');
      setSelected((value) => value ? { ...value, ...payload, ra: payload.registration, raw: { ...value.raw, ...payload } } : value);
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar aluno');
    }
  };

  return (
    <div className="space-y-5">
      <Section
        title="Alunos"
        subtitle="RA, curso e status do FaceID"
        action={<Button icon={UserCog} onClick={openStudentModal}>Novo aluno</Button>}
      >
        <SearchToolbar
          value={query}
          onChange={setQuery}
          placeholder="Pesquisar por RA, nome ou curso"
        />
        <DataTable
          emptyText="Nenhum aluno cadastrado."
          columns={[
            { key: 'ra', label: 'RA' },
            {
              key: 'name',
              label: 'Aluno',
              render: (row) => (
                <button onClick={() => openStudentDetails(row)} className="flex items-center gap-3 text-left">
                  {row.photo ? (
                    <img src={row.photo} alt={row.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600">
                      {row.name.charAt(0)}
                    </span>
                  )}
                  <span>
                    <span className="block font-semibold text-slate-900">{row.name}</span>
                    <span className="block text-xs text-slate-500">{row.ra}</span>
                  </span>
                </button>
              ),
            },
            { key: 'course', label: 'Curso' },
            { key: 'faceStatus', label: 'FaceID', render: (row) => <StatusPill>{row.faceStatus}</StatusPill> },
            {
              key: 'actions',
              label: 'Dados',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => openStudentDetails(row)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-[#b70f16]"
                  aria-label={`Visualizar ${row.name}`}
                  title="Visualizar aluno"
                >
                  <Eye className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          rows={rows}
        />
      </Section>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Dados do aluno - ${selected.name}` : 'Dados do aluno'}
        size="xl"
        footer={<Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>}
      >
        {selected && (
          <div className="space-y-4">
            {faceOutdated && (
              <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Reconhecimento facial desatualizado</p>
                  <p className="mt-1 text-sm">Atualize o FaceID deste aluno antes de usar a validacao automatica na entrada ou saida.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="rounded-md border border-slate-200 p-4 text-center">
                {selected.photo ? (
                  <img src={selected.photo} alt={selected.name} className="mx-auto h-32 w-32 rounded-full object-cover" />
                ) : (
                  <span className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-slate-200 text-4xl font-semibold text-slate-600">
                    {selected.name.charAt(0)}
                  </span>
                )}
                <p className="mt-3 text-lg font-semibold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-500">{selected.ra}</p>
                <div className="mt-3 flex justify-center gap-2">
                  <StatusPill>{selected.status}</StatusPill>
                  <StatusPill>{selected.faceStatus}</StatusPill>
                </div>
                <Button className="mt-4 w-full" variant="secondary" icon={Fingerprint} onClick={() => setFaceModalStudent(selected.raw)}>
                  Atualizar FaceID
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['RA', selected.ra],
                  ['Nome completo', selected.name],
                  ['Curso', selected.course],
                  ['Turma', selected.classGroup],
                  ['FaceID', selected.faceStatus],
                  ['Ultima utilizacao', lastUsage ? formatDateTime(lastUsage) : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{value || '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <Section title="Editar cadastro" subtitle="Dados essenciais do aluno">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="RA" value={studentEditForm.registration} onChange={(event) => setStudentEditForm((value) => ({ ...value, registration: event.target.value }))} />
                  <Input label="Nome" value={studentEditForm.name} onChange={(event) => setStudentEditForm((value) => ({ ...value, name: event.target.value }))} />
                  <Input className="md:col-span-2" label="Curso" value={studentEditForm.course} onChange={(event) => setStudentEditForm((value) => ({ ...value, course: event.target.value }))} />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button icon={Save} onClick={saveSelectedStudent}>Salvar alterações</Button>
                </div>
              </Section>

              <Section title="Empréstimos ativos" subtitle="Livros atualmente vinculados a este aluno">
                <DataTable
                  emptyText="Nenhum empréstimo ativo para este aluno."
                  columns={[
                    { key: 'book', label: 'Livro' },
                    { key: 'rfid', label: 'RFID' },
                    { key: 'loanDate', label: 'Retirada', render: (row) => formatDateTime(row.loanDate) },
                    { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
                  ]}
                  rows={selectedActiveLoans.map((loan) => {
                    const book = bookMap.get(loan.bookId) || {};
                    return {
                      id: loan.id,
                      book: book.title || loan.bookId || '-',
                      rfid: book.rfid || '-',
                      loanDate: loan.loanDate,
                      status: loan.status === 'overdue' ? 'Atrasado' : 'Ativo',
                    };
                  })}
                />
              </Section>
            </div>

            <Section title="Histórico de utilização" subtitle="Entradas, saídas, permanência e movimentação de livros">
              <DataTable
                emptyText="Nenhuma utilização registrada."
                columns={[
                  { key: 'type', label: 'Tipo' },
                  { key: 'detail', label: 'Detalhe' },
                  { key: 'time', label: 'Data/Hora', render: (row) => formatDateTime(row.time) },
                ]}
                rows={selectedHistory}
              />
            </Section>
          </div>
        )}
      </Modal>

      <Modal
        open={studentModalOpen}
        onClose={closeStudentModal}
        title="Novo aluno"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeStudentModal}>Cancelar</Button>
            <Button icon={Save} loading={savingStudent} onClick={saveStudent}>Salvar aluno</Button>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="RA" value={studentForm.registration} onChange={(event) => setStudentForm((value) => ({ ...value, registration: event.target.value }))} />
            <Input label="Nome" value={studentForm.name} onChange={(event) => setStudentForm((value) => ({ ...value, name: event.target.value }))} />
            <Input className="md:col-span-2" label="Curso" value={studentForm.course} onChange={(event) => setStudentForm((value) => ({ ...value, course: event.target.value }))} />
            <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">FaceID</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <StatusPill>{studentForm.faceDescriptor ? 'Face pronta' : 'Pendente'}</StatusPill>
                <Button
                  variant="secondary"
                  icon={Camera}
                  loading={capturingFace}
                  disabled={!modelsReady}
                  onClick={() => captureFace(faceCameraRef, ({ frame, descriptor }) => {
                    setStudentForm((value) => ({ ...value, photo: frame, faceDescriptor: descriptor }));
                    setFacePreview(frame);
                  })}
                >
                  Capturar FaceID
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <CameraView ref={faceCameraRef} className="aspect-video rounded-md" />
            {facePreview && <img src={facePreview} alt="FaceID capturado" className="aspect-video rounded-md object-cover" />}
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(faceModalStudent)}
        onClose={() => setFaceModalStudent(null)}
        title={faceModalStudent ? `Atualizar FaceID - ${faceModalStudent.name}` : 'Atualizar FaceID'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFaceModalStudent(null)}>Cancelar</Button>
            <Button icon={Fingerprint} loading={capturingFace} disabled={!modelsReady} onClick={updateStudentFace}>Capturar e salvar</Button>
          </>
        }
      >
        <CameraView ref={updateFaceCameraRef} className="aspect-video rounded-md" />
      </Modal>
    </div>
  );
}

function FaceIdModule({ students }) {
  const rows = buildStudentRows(students);
  const ready = rows.filter((row) => row.faceStatus === 'Face pronta').length;
  const pending = rows.length - ready;
  const expired = Math.max(0, Math.round(rows.length * 0.08));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="FaceID atualizado" value={ready} detail="Descritores validos" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="FaceID pendente" value={pending} detail="Alunos sem captura atual" icon={Fingerprint} tone="amber" />
        <MetricCard label="FaceID expirado" value={expired} detail="Revalidacao obrigatoria" icon={AlertTriangle} tone="red" />
      </div>

      <Section title="Gestao de FaceID" subtitle="Captura facial, qualidade biometrica e rastreabilidade">
        <DataTable
          columns={[
            { key: 'ra', label: 'RA' },
            { key: 'name', label: 'Aluno' },
            { key: 'course', label: 'Curso' },
            { key: 'faceStatus', label: 'Biometria', render: (row) => <StatusPill>{row.faceStatus}</StatusPill> },
            { key: 'createdAt', label: 'Ultima atualizacao', render: (row) => formatDate(row.raw.updatedAt || row.createdAt) },
            {
              key: 'quality',
              label: 'Qualidade',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: row.faceStatus === 'Face pronta' ? '92%' : '18%' }} />
                  </div>
                  <span className="text-xs">{row.faceStatus === 'Face pronta' ? '92%' : '18%'}</span>
                </div>
              ),
            },
            { key: 'action', label: 'Acao', render: () => <button className="text-sm font-semibold text-[#b70f16]">Atualizar FaceID</button> },
          ]}
          rows={rows}
        />
      </Section>
    </div>
  );
}

function BooksModule({ students, books, loans, events, reload }) {
  const toast = useToast();
  const [view, setView] = useState('collection');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({ title: '', author: '', category: '', rfid: '', status: 'Disponivel' });
  const bookHistory = editingBook ? buildBookHistory(editingBook, loans, events) : [];
  const lastMovement = bookHistory[0]?.time || editingBook?.updatedAt || editingBook?.createdAt;

  const allRows = buildBookRows(books);
  const rows = allRows.filter((row) => {
    const searchable = [row.title, row.author, row.rfid, row.category]
      .join(' ')
      .toLowerCase();
    const matchesSearch = searchable.includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openBookModal = (book = null) => {
    setEditingBook(book);
    setBookForm({
      title: book?.title || '',
      author: book?.author || '',
      category: book?.category || '',
      rfid: book?.rfid || '',
      status: book?.status || 'Disponivel',
    });
    setBookModalOpen(true);
  };

  const closeBookModal = () => {
    setBookModalOpen(false);
    setEditingBook(null);
    setBookForm({ title: '', author: '', category: '', rfid: '', status: 'Disponivel' });
  };

  const saveBook = async () => {
    try {
      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        category: bookForm.category.trim() || 'Geral',
        rfid: bookForm.rfid.trim() || null,
        copies: 1,
        available: bookForm.status === 'Disponivel' ? 1 : 0,
      };
      if (!payload.title || !payload.author) throw new Error('Informe titulo e autor.');

      if (editingBook?.id) await bookService.update(editingBook.id, payload);
      else await bookService.create(payload);

      await reload?.();
      toast.success('Livro salvo.');
      if (!editingBook) closeBookModal();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar livro');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'collection', label: 'Acervo' },
          { key: 'monitoring', label: 'Monitoramento' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              view === item.key
                ? 'bg-[#b70f16] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === 'monitoring' ? (
        <BookMonitoringModule students={students} books={books} loans={loans} />
      ) : (
        <>
      <Section
        title="Acervo"
        subtitle="Livros, RFID e status operacional"
        action={<Button icon={BookOpen} onClick={() => openBookModal()}>Novo livro</Button>}
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar livro, autor ou RFID"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            <option value="Disponivel">Disponiveis</option>
            <option value="Emprestado">Emprestados</option>
            <option value="Reservado">Reservados</option>
          </Select>
        </div>

        <div className="mt-4">
          <DataTable
            emptyText="Nenhum livro cadastrado."
            columns={[
              { key: 'rfid', label: 'RFID', render: (row) => row.rfid || '-' },
              { key: 'title', label: 'Titulo' },
              { key: 'author', label: 'Autor' },
              { key: 'category', label: 'Categoria' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
              {
                key: 'actions',
                label: 'Dados',
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => openBookModal(row)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-[#b70f16]"
                    aria-label={`Visualizar ${row.title}`}
                    title="Visualizar exemplar"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
            rows={rows}
          />
        </div>
      </Section>

      <Modal
        open={bookModalOpen}
        onClose={closeBookModal}
        title={editingBook ? `Detalhes do exemplar - ${editingBook.title}` : 'Novo livro'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeBookModal}>Cancelar</Button>
            <Button icon={Save} onClick={saveBook}>{editingBook ? 'Salvar alteracoes' : 'Salvar'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {editingBook && (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ['Livro', editingBook.title],
                  ['Autor', editingBook.author],
                  ['Categoria', editingBook.category],
                  ['Código RFID/NFC', editingBook.rfid || 'Pendente'],
                  ['Código do exemplar', editingBook.copyCode || '-'],
                  ['Status atual', editingBook.status],
                  ['Data de cadastro', editingBook.createdAt ? formatDateTime(editingBook.createdAt) : '-'],
                  ['Última movimentação', lastMovement ? formatDateTime(lastMovement) : '-'],
                  ['Localização', editingBook.location || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{value || '-'}</p>
                  </div>
                ))}
              </div>

              <Section title="Histórico de movimentação" subtitle="Entradas, saídas, empréstimos, devoluções e auditorias">
                <DataTable
                  emptyText="Nenhuma movimentação registrada para este exemplar."
                  columns={[
                    { key: 'type', label: 'Movimentação' },
                    { key: 'detail', label: 'Detalhe' },
                    { key: 'time', label: 'Data/Hora', render: (row) => formatDateTime(row.time) },
                  ]}
                  rows={bookHistory}
                />
              </Section>
            </>
          )}

          <Section title={editingBook ? 'Editar exemplar' : 'Dados do livro'} subtitle={editingBook ? 'Ajustes permitidos para este exemplar' : 'Cadastro essencial do acervo'}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Titulo" value={bookForm.title} onChange={(event) => setBookForm((value) => ({ ...value, title: event.target.value }))} />
              <Input label="Autor" value={bookForm.author} onChange={(event) => setBookForm((value) => ({ ...value, author: event.target.value }))} />
              <Input label="Categoria" value={bookForm.category} onChange={(event) => setBookForm((value) => ({ ...value, category: event.target.value }))} />
              <Input label="RFID/NFC" value={bookForm.rfid} onChange={(event) => setBookForm((value) => ({ ...value, rfid: event.target.value }))} />
              <Select label="Status" value={bookForm.status} onChange={(event) => setBookForm((value) => ({ ...value, status: event.target.value }))}>
                <option value="Disponivel">Disponivel</option>
                <option value="Emprestado">Emprestado</option>
              </Select>
            </div>
          </Section>
        </div>
      </Modal>
        </>
      )}
    </div>
  );
}

function BookMonitoringModule({ students, books, loans }) {
  const [bookFilter, setBookFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const studentMap = createLookup(students);
  const activeStatuses = new Set(['active', 'overdue', 'Ativo', 'Atrasado']);
  const loansByBook = loans.reduce((map, loan) => {
    if (!loan.bookId) return map;
    const current = map.get(loan.bookId) || [];
    current.push(loan);
    map.set(loan.bookId, current);
    return map;
  }, new Map());
  const courseOptions = [...new Set([
    ...students.map((student) => student.course).filter(Boolean),
    ...books.map((book) => book.course).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b));

  const rows = books
    .map((book) => {
      const bookLoans = (loansByBook.get(book.id) || [])
        .slice()
        .sort((a, b) => String(b.loanDate || '').localeCompare(String(a.loanDate || '')));
      const activeLoan = bookLoans.find((loan) => activeStatuses.has(loan.status));
      const lastLoan = activeLoan || bookLoans[0] || null;
      const student = lastLoan ? studentMap.get(lastLoan.studentId) : null;
      const isBorrowed = Boolean(activeLoan);
      const course = student?.course || book.course || '-';

      return {
        id: book.id,
        title: book.title,
        rfid: book.rfid || '-',
        studentName: isBorrowed ? student?.name || '-' : student ? `Ultimo: ${student.name}` : '-',
        studentSearchName: student?.name || '',
        registration: student?.registration || '-',
        course,
        loanDate: lastLoan?.loanDate || '',
        status: isBorrowed ? 'Emprestado' : 'Disponivel',
        isBorrowed,
      };
    })
    .sort((a, b) => {
      if (a.isBorrowed !== b.isBorrowed) return a.isBorrowed ? -1 : 1;
      return a.title.localeCompare(b.title);
    })
    .filter((row) => {
      const matchesBook = [row.title, row.rfid].join(' ').toLowerCase().includes(bookFilter.toLowerCase());
      const matchesStudent = [row.studentName, row.studentSearchName, row.registration].join(' ').toLowerCase().includes(studentFilter.toLowerCase());
      const matchesCourse = courseFilter === 'all' || row.course === courseFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesBook && matchesStudent && matchesCourse && matchesStatus;
    });

  return (
    <div className="space-y-4">
      <Section title="Monitoramento de livros" subtitle="Localizacao logica dos exemplares e responsavel atual">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={bookFilter}
              onChange={(event) => setBookFilter(event.target.value)}
              placeholder="Filtrar por livro ou RFID"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
            />
          </div>
          <input
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
            placeholder="Filtrar por aluno ou RA"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
          />
          <Select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} aria-label="Filtrar por curso">
            <option value="all">Todos os cursos</option>
            {courseOptions.map((course) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            <option value="Emprestado">Emprestados</option>
            <option value="Disponivel">Disponiveis</option>
          </Select>
        </div>

        <div className="mt-4">
          <DataTable
            emptyText="Nenhum livro encontrado no monitoramento."
            columns={[
              { key: 'title', label: 'Livro' },
              { key: 'rfid', label: 'Codigo RFID' },
              { key: 'studentName', label: 'Aluno responsavel' },
              { key: 'registration', label: 'RA' },
              { key: 'withdrawDate', label: 'Data da retirada', render: (row) => formatDate(row.loanDate) },
              { key: 'withdrawTime', label: 'Horario da retirada', render: (row) => formatTime(row.loanDate) },
              { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
            ]}
            rows={rows}
          />
        </div>
      </Section>
    </div>
  );
}

function LibrarySchedulingModule({ students }) {
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const studentOptions = buildStudentRows(students);
  const fallbackStudents = studentOptions.length
    ? studentOptions
    : [
        { id: 'mock-student-1', name: 'Renan da Silva Ramos', ra: '0001', classGroup: '9A', course: 'Informatica' },
        { id: 'mock-student-2', name: 'Mariana Costa', ra: '0002', classGroup: '2B', course: 'Ensino Medio' },
      ];
  const spaces = [
    { name: 'Sala de Estudos 01', capacity: 8, type: 'Grupo' },
    { name: 'Sala de Estudos 02', capacity: 12, type: 'Grupo' },
  ];
  const availableRoomNames = new Set(spaces.map((space) => space.name));
  const initialBookings = [
    {
      id: 'booking-1',
      student: 'Renan da Silva Ramos',
      registration: '0001',
      classGroup: '9A',
      course: 'Informatica',
      space: 'Sala de Estudos 02',
      date: today,
      start: '14:00',
      end: '16:00',
      people: 4,
      purpose: 'Estudo em grupo',
      status: 'Confirmado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'booking-2',
      student: 'Mariana Costa',
      registration: '0002',
      classGroup: '2B',
      course: 'Ensino Medio',
      space: 'Sala de Estudos 01',
      date: today,
      start: '09:00',
      end: '10:30',
      people: 3,
      purpose: 'Pesquisa em grupo',
      status: 'Pendente',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'booking-3',
      student: 'Joao Pedro Almeida',
      registration: '0003',
      classGroup: 'ADS-3',
      course: 'Informatica',
      space: 'Sala de Estudos 01',
      date: tomorrow,
      start: '19:00',
      end: '21:00',
      people: 5,
      purpose: 'Preparacao para prova',
      status: 'Confirmado',
      createdAt: new Date().toISOString(),
    },
  ];
  const [bookings, setBookings] = useState(() => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('edulib-library-bookings') || 'null');
      if (!Array.isArray(storedBookings)) return initialBookings;
      const validBookings = storedBookings.filter((booking) => availableRoomNames.has(booking.space));
      return validBookings.length ? validBookings : initialBookings;
    } catch {
      return initialBookings;
    }
  });
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(today);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [form, setForm] = useState({
    studentId: fallbackStudents[0]?.id || '',
    space: spaces[0].name,
    date: today,
    start: '14:00',
    end: '16:00',
    people: 1,
    purpose: 'Estudo',
  });

  const persistBookings = (next) => {
    setBookings(next);
    localStorage.setItem('edulib-library-bookings', JSON.stringify(next));
  };

  const updateBookingStatus = (id, status) => {
    persistBookings(bookings
      .filter((booking) => availableRoomNames.has(booking.space))
      .map((booking) => (booking.id === id ? { ...booking, status } : booking)));
    toast.success(`Agendamento ${status.toLowerCase()}.`);
  };

  const createBooking = () => {
    const selectedStudent = fallbackStudents.find((student) => student.id === form.studentId) || fallbackStudents[0];
    const selectedRoom = spaces.find((space) => space.name === form.space) || spaces[0];
    const booking = {
      id: `booking-${Date.now()}`,
      student: selectedStudent?.name || 'Aluno',
      registration: selectedStudent?.ra || selectedStudent?.registration || '-',
      classGroup: selectedStudent?.classGroup || '-',
      course: selectedStudent?.course || '-',
      space: selectedRoom.name,
      date: form.date || today,
      start: form.start,
      end: form.end,
      people: Math.min(Number(form.people) || 1, selectedRoom.capacity),
      purpose: form.purpose || 'Estudo',
      status: 'Pendente',
      createdAt: new Date().toISOString(),
    };
    persistBookings([booking, ...bookings.filter((item) => availableRoomNames.has(item.space))]);
    toast.success('Agendamento criado.');
    setBookingModalOpen(false);
  };

  const roomBookings = bookings.filter((booking) => availableRoomNames.has(booking.space));
  const filteredBookings = roomBookings
    .filter((booking) => {
      const text = [booking.student, booking.registration, booking.classGroup, booking.course, booking.space, booking.purpose].join(' ').toLowerCase();
      const matchesSearch = text.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesDate = !dateFilter || booking.date === dateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  const todayBookings = roomBookings.filter((booking) => booking.date === today && booking.status !== 'Cancelado');
  const timeSlots = ['08:00', '09:00', '10:30', '14:00', '16:00', '19:00'];

  return (
    <div className="space-y-5">
      <Section
        title="Agenda disponivel"
        subtitle="Visao principal das duas salas de estudo disponiveis"
        action={<Button icon={CalendarClock} onClick={() => setBookingModalOpen(true)}>Novo agendamento</Button>}
      >
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid min-w-[720px] grid-cols-[150px_repeat(6,minmax(90px,1fr))] bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div className="border-r border-slate-200 px-3 py-3">Sala</div>
            {timeSlots.map((slot) => (
              <div key={slot} className="border-r border-slate-200 px-3 py-3 last:border-r-0">{slot}</div>
            ))}
          </div>
          <div className="overflow-x-auto">
            {spaces.map((space) => (
              <div key={space.name} className="grid min-w-[720px] grid-cols-[150px_repeat(6,minmax(90px,1fr))] border-t border-slate-200 text-sm">
                <div className="border-r border-slate-200 bg-white px-3 py-3">
                  <p className="font-semibold text-slate-900">{space.name}</p>
                  <p className="text-xs text-slate-500">{space.capacity} lugares</p>
                </div>
                {timeSlots.map((slot) => {
                  const booking = todayBookings.find((item) => item.space === space.name && item.start <= slot && item.end > slot);
                  return (
                    <div key={`${space.name}-${slot}`} className="border-r border-slate-200 px-2 py-3 last:border-r-0">
                      {booking ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
                          <p className="truncate text-xs font-semibold text-amber-900">{booking.student}</p>
                          <p className="text-[11px] text-amber-700">{booking.start}-{booking.end}</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((value) => ({ ...value, space: space.name, date: today, start: slot }));
                            setBookingModalOpen(true);
                          }}
                          className="h-full min-h-12 w-full rounded-md border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Disponivel
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Agenda do dia" subtitle="Reservas organizadas por horario e sala">
          <div className="grid gap-3 md:grid-cols-2">
            {todayBookings.length ? todayBookings.map((booking) => (
              <article key={booking.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{booking.start} - {booking.end}</p>
                    <p className="mt-1 text-sm text-slate-600">{booking.space}</p>
                    <p className="mt-1 text-xs text-slate-500">{booking.student} / {booking.classGroup}</p>
                  </div>
                  <StatusPill>{booking.status}</StatusPill>
                </div>
              </article>
            )) : (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 md:col-span-2">
                Nenhum agendamento para hoje.
              </div>
            )}
          </div>
      </Section>

      <Section title="Agendamentos" subtitle="Solicitacoes e reservas registradas">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pesquisar aluno, turma, curso ou sala"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
              />
            </div>
            <Input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Todos</option>
              <option value="Pendente">Pendentes</option>
              <option value="Confirmado">Confirmados</option>
              <option value="Concluido">Concluidos</option>
              <option value="Cancelado">Cancelados</option>
            </Select>
          </div>

          <div className="grid gap-3">
            {filteredBookings.map((booking) => (
              <article key={booking.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{booking.student}</p>
                      <StatusPill>{booking.status}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{booking.space} - {formatDate(booking.date)} das {booking.start} as {booking.end}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateBookingStatus(booking.id, 'Confirmado')} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Confirmar</button>
                    <button type="button" onClick={() => updateBookingStatus(booking.id, 'Concluido')} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Concluir</button>
                    <button type="button" onClick={() => updateBookingStatus(booking.id, 'Cancelado')} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Cancelar</button>
                  </div>
                </div>
              </article>
            ))}
            {filteredBookings.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Nenhum agendamento encontrado.
              </div>
            )}
          </div>
        </Section>

      <Modal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Novo agendamento"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBookingModalOpen(false)}>Cancelar</Button>
            <Button icon={Save} onClick={createBooking}>Criar agendamento</Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Aluno" value={form.studentId} onChange={(event) => setForm((value) => ({ ...value, studentId: event.target.value }))}>
            {fallbackStudents.map((student) => (
              <option key={student.id} value={student.id}>{student.name} - {student.ra || student.registration}</option>
            ))}
          </Select>
          <Select label="Sala" value={form.space} onChange={(event) => setForm((value) => ({ ...value, space: event.target.value }))}>
            {spaces.map((space) => (
              <option key={space.name} value={space.name}>{space.name} / {space.capacity} lugares</option>
            ))}
          </Select>
          <Input label="Data" type="date" value={form.date} onChange={(event) => setForm((value) => ({ ...value, date: event.target.value }))} />
          <Input label="Quantidade de alunos" type="number" min="1" max={spaces.find((space) => space.name === form.space)?.capacity || 1} value={form.people} onChange={(event) => setForm((value) => ({ ...value, people: event.target.value }))} />
          <Input label="Inicio" type="time" value={form.start} onChange={(event) => setForm((value) => ({ ...value, start: event.target.value }))} />
          <Input label="Fim" type="time" value={form.end} onChange={(event) => setForm((value) => ({ ...value, end: event.target.value }))} />
          <Input className="md:col-span-2" label="Finalidade" value={form.purpose} onChange={(event) => setForm((value) => ({ ...value, purpose: event.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

function LoansModule({ loans }) {
  const rows = loans.length
    ? loans.map((loan) => ({
        id: loan.id,
        student: loan.studentId,
        course: 'Informatica',
        book: loan.bookId,
        status: loan.status === 'active' ? 'Ativo' : loan.status === 'returned' ? 'Devolvido' : 'Atrasado',
        dueDate: loan.dueDate,
        loanDate: loan.loanDate,
      }))
    : SAMPLE_LOANS;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Ativos" value={rows.filter((row) => row.status === 'Ativo').length} icon={ClipboardList} tone="blue" />
        <MetricCard label="Devolvidos" value={rows.filter((row) => row.status === 'Devolvido').length} icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Atrasados" value={rows.filter((row) => row.status === 'Atrasado').length} icon={AlertTriangle} tone="red" />
      </div>
      <Section title="Gestao de emprestimos" subtitle="Filtros por aluno, curso, livro e periodo">
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <Input placeholder="Aluno" />
          <Input placeholder="Curso" />
          <Input placeholder="Livro" />
          <Select defaultValue="periodo">
            <option value="periodo">Periodo</option>
            <option>Hoje</option>
            <option>Esta semana</option>
            <option>Este mes</option>
          </Select>
        </div>
        <DataTable
          columns={[
            { key: 'student', label: 'Aluno' },
            { key: 'course', label: 'Curso' },
            { key: 'book', label: 'Livro' },
            { key: 'loanDate', label: 'Emprestimo', render: (row) => formatDate(row.loanDate) },
            { key: 'dueDate', label: 'Prazo', render: (row) => formatDate(row.dueDate) },
            { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
            { key: 'actions', label: 'Acoes', render: () => <button className="text-sm font-semibold text-[#b70f16]">Renovar / Finalizar</button> },
          ]}
          rows={rows}
        />
      </Section>
    </div>
  );
}

function SessionsModule({ sessions, students }) {
  const studentMap = new Map(students.map((student) => [student.id, student.name]));
  const rows = sessions.length
    ? sessions.map((session, index) => ({
        id: session.id,
        student: studentMap.get(session.studentId) || session.studentId,
        entry: session.type === 'entry' ? session.timestamp : '08:10',
        exit: session.type === 'exit' ? session.timestamp : index % 2 ? '09:03' : '-',
        duration: index % 2 ? '53 min' : 'Em andamento',
        date: session.timestamp,
        status: session.type === 'entry' ? 'Presente' : 'Finalizada',
      }))
    : [
        { id: 's1', student: 'Renan da Silva Ramos', entry: '08:10', exit: '-', duration: 'Em andamento', date: new Date().toISOString(), status: 'Presente' },
        { id: 's2', student: 'Mariana Costa', entry: '09:22', exit: '10:04', duration: '42 min', date: new Date().toISOString(), status: 'Finalizada' },
      ];

  return (
    <Section title="Gestao de sessoes" subtitle="Monitoramento da utilizacao da biblioteca com filtros avancados">
      <div className="mb-4 grid gap-3 md:grid-cols-5">
        <Input placeholder="Aluno" />
        <Input placeholder="Data" />
        <Select defaultValue="status">
          <option value="status">Status</option>
          <option>Presente</option>
          <option>Finalizada</option>
        </Select>
        <Input placeholder="Curso" />
        <Button variant="secondary" icon={SlidersHorizontal}>Aplicar filtros</Button>
      </div>
      <DataTable
        columns={[
          { key: 'student', label: 'Aluno' },
          { key: 'entry', label: 'Entrada' },
          { key: 'exit', label: 'Saida' },
          { key: 'duration', label: 'Permanencia' },
          { key: 'date', label: 'Data', render: (row) => formatDate(row.date) },
          { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
        ]}
        rows={rows}
      />
    </Section>
  );
}

// eslint-disable-next-line no-unused-vars
function SecurityAuditModule() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Acessos invalidos" value="7" icon={XCircle} tone="red" />
        <MetricCard label="Divergencias RFID" value="3" icon={Tag} tone="amber" />
        <MetricCard label="Falhas FaceID" value="11" icon={ScanFace} tone="red" />
        <MetricCard label="Sessoes suspeitas" value="2" icon={LockKeyhole} tone="violet" />
      </div>
      <Section title="Auditoria e seguranca" subtitle="Rastreabilidade de eventos criticos">
        <DataTable
          columns={[
            { key: 'time', label: 'Hora' },
            { key: 'type', label: 'Evento' },
            { key: 'detail', label: 'Descricao' },
            { key: 'severity', label: 'Severidade', render: (row) => <StatusPill>{row.severity}</StatusPill> },
            { key: 'action', label: 'Acao', render: () => <button className="text-sm font-semibold text-[#b70f16]">Investigar</button> },
          ]}
          rows={SECURITY_EVENTS.map((event, index) => ({ ...event, id: `audit-${index}` }))}
        />
      </Section>
    </div>
  );
}

function LibraryAuditModule({ books }) {
  const scanInputRef = useRef(null);
  const autoScanTimerRef = useRef(null);
  const [scanValue, setScanValue] = useState('');
  const [scans, setScans] = useState([]);
  const [scanFeedback, setScanFeedback] = useState(null);
  const storedMetadata = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('edulib-book-metadata') || '{}');
    } catch {
      return {};
    }
  }, [scans.length]);
  const rows = buildBookRows(books).map((book, index) => {
    const metadata = storedMetadata[book.id] || {};
    const location = metadata.location || book.location || ['A1-03', 'B1-07', 'C2-11', 'D1-02'][index % 4];
    const [defaultRow, defaultShelf] = String(location).split('-');
    return {
      ...book,
      ...metadata,
      location,
      row: metadata.row || book.row || defaultRow || 'A1',
      shelf: metadata.shelf || book.shelf || defaultShelf || '01',
    };
  });
  const matchedIds = new Set(scans.filter((scan) => scan.bookId).map((scan) => scan.bookId));
  const expectedRows = rows.filter((book) => book.status !== 'Emprestado');
  const pendingRows = expectedRows.filter((book) => !matchedIds.has(book.id));
  const validatedRows = scans.filter((scan) => scan.bookId);
  const completion = expectedRows.length ? Math.round((validatedRows.length / expectedRows.length) * 100) : 0;

  const findBookByCode = (code, sourceRows = rows) => {
    const normalizedCode = String(code || '').trim().toLowerCase();
    return sourceRows.find((book) =>
      [book.rfid, book.copyCode]
        .filter(Boolean)
        .some((value) => String(value).trim().toLowerCase() === normalizedCode)
    );
  };

  const registerScan = (rawCode = scanValue) => {
    const code = String(rawCode || '').trim();
    if (!code) return;
    const expectedBook = findBookByCode(code, expectedRows);
    const catalogBook = expectedBook || findBookByCode(code, rows);

    if (!expectedBook) {
      setScanFeedback({
        status: catalogBook ? 'Fora previsto' : 'Nao cadastrado',
        detail: catalogBook ? `${catalogBook.title} nao era esperado nesta auditoria.` : `RFID ${code} nao encontrado no acervo.`,
      });
      setScanValue('');
      setTimeout(() => scanInputRef.current?.focus(), 50);
      return;
    }

    setScans((current) => {
      if (current.some((scan) => scan.bookId === expectedBook.id)) {
        setScanFeedback({ status: 'Ja validado', detail: expectedBook.title });
        return current;
      }

      setScanFeedback({ status: 'Validado', detail: expectedBook.title });
      return [
        {
          id: `${expectedBook.id}-${Date.now()}`,
          code,
          bookId: expectedBook.id,
          title: expectedBook.title,
          copyCode: expectedBook.copyCode || '-',
          rfid: expectedBook.rfid || '-',
          location: expectedBook.location || '-',
          status: 'Validado',
          time: new Date().toISOString(),
        },
        ...current,
      ];
    });
    setScanValue('');
    setTimeout(() => scanInputRef.current?.focus(), 50);
  };

  const handleScanChange = (event) => {
    const value = event.target.value;
    setScanValue(value);
    window.clearTimeout(autoScanTimerRef.current);

    const code = value.trim();
    if (!code) return;

    autoScanTimerRef.current = window.setTimeout(() => {
      if (findBookByCode(code)) registerScan(code);
    }, 420);
  };

  useEffect(() => {
    scanInputRef.current?.focus();
    return () => window.clearTimeout(autoScanTimerRef.current);
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Livros esperados" value={expectedRows.length} detail="Previstos no acervo fisico" icon={Database} tone="blue" />
        <MetricCard label="Validados" value={validatedRows.length} detail="Identificados pelo RFID" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="Pendentes" value={pendingRows.length} detail="Ainda nao lidos" icon={AlertTriangle} tone="amber" />
        <MetricCard label="Concluido" value={`${completion}%`} detail="Progresso da auditoria" icon={Activity} tone="slate" />
      </div>

      <Section title="Auditoria RFID do acervo" subtitle="Passe o leitor pelos livros para validar automaticamente os exemplares">
        <div className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="audit-rfid-reader">
              Leitor RFID ativo
            </label>
            <input
              id="audit-rfid-reader"
              ref={scanInputRef}
              value={scanValue}
              onBlur={() => setTimeout(() => scanInputRef.current?.focus(), 100)}
              onChange={handleScanChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  registerScan(event.currentTarget.value);
                }
              }}
              placeholder="Aproxime o livro do leitor"
              autoComplete="off"
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-[#b70f16] focus:ring-2 focus:ring-red-100"
            />
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#b70f16] transition-all" style={{ width: `${completion}%` }} />
            </div>
            {scanFeedback && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                <span className="truncate text-slate-700">{scanFeedback.detail}</span>
                <StatusPill>{scanFeedback.status}</StatusPill>
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Pendentes</h3>
                  <p className="mt-1 text-xs text-slate-500">Livros esperados para esta auditoria</p>
                </div>
                <StatusPill>{pendingRows.length}</StatusPill>
              </div>
              <div className="max-h-[560px] space-y-2 overflow-auto p-3">
                {pendingRows.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Todos os livros esperados foram validados.
                  </div>
                ) : pendingRows.map((book) => (
                  <article key={book.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{book.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Exemplar: {book.copyCode || '-'}</p>
                        <p className="mt-1 text-xs text-slate-500">RFID: {book.rfid || 'Pendente'}</p>
                      </div>
                      <StatusPill>Pendente</StatusPill>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Validados</h3>
                  <p className="mt-1 text-xs text-slate-500">Exemplares identificados pelo leitor RFID</p>
                </div>
                <StatusPill>{validatedRows.length}</StatusPill>
              </div>
              <div className="max-h-[560px] space-y-2 overflow-auto p-3">
                {validatedRows.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Nenhum livro validado ainda.
                  </div>
                ) : validatedRows.map((scan) => (
                  <article key={scan.id} className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{scan.title}</p>
                        <p className="mt-1 text-xs text-emerald-800">Exemplar: {scan.copyCode}</p>
                        <p className="mt-1 text-xs text-emerald-800">RFID: {scan.rfid}</p>
                      </div>
                      <StatusPill>Validado</StatusPill>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function ReportsModule({ students, books, loans, sessions, events }) {
  {
    const bookRowsFromApi = buildBookRows(books);
    const studentMap = createLookup(students);
    const bookMap = createLookup(bookRowsFromApi);
    const movementRows = buildMovementRows({ sessions, loans, students, books: bookRowsFromApi });
    const loanRowsFromApi = loans.map((loan) => ({
      id: loan.id,
      student: studentMap.get(loan.studentId)?.name || loan.studentId || '-',
      book: bookMap.get(loan.bookId)?.title || loan.bookId || '-',
      status: loan.status === 'active' ? 'Ativo' : loan.status === 'returned' ? 'Devolvido' : 'Atrasado',
      loanDate: loan.loanDate,
      returnDate: loan.returnDate,
    }));

    return (
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-2">
          <Section title="Livros emprestados" subtitle="Emprestimos ativos e em atraso">
            <DataTable
              emptyText="Nenhum emprestimo encontrado."
              columns={[
                { key: 'book', label: 'Livro' },
                { key: 'student', label: 'Aluno' },
                { key: 'loanDate', label: 'Retirada', render: (row) => formatDateTime(row.loanDate) },
                { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
              ]}
              rows={loanRowsFromApi.filter((row) => row.status !== 'Devolvido')}
            />
          </Section>

          <Section title="Livros disponiveis" subtitle="Itens com disponibilidade no acervo">
            <DataTable
              emptyText="Nenhum livro disponivel."
              columns={[
                { key: 'rfid', label: 'RFID', render: (row) => row.rfid || '-' },
                { key: 'title', label: 'Titulo' },
                { key: 'author', label: 'Autor' },
                { key: 'category', label: 'Categoria' },
              ]}
              rows={bookRowsFromApi.filter((book) => book.status === 'Disponivel')}
            />
          </Section>
        </div>

        <Section title="Historico de movimentacoes" subtitle="Entradas, saidas, emprestimos e devolucoes">
          <DataTable
            emptyText="Nenhuma movimentacao registrada."
            columns={[
              { key: 'type', label: 'Tipo' },
              { key: 'detail', label: 'Registro' },
              { key: 'time', label: 'Horario', render: (row) => formatDateTime(row.time) },
            ]}
            rows={movementRows.map((row) => ({ ...row, icon: undefined }))}
          />
        </Section>

        <Section title="Historico de emprestimos" subtitle="Todos os emprestimos retornados pela API">
          <DataTable
            emptyText="Nenhum historico de emprestimo encontrado."
            columns={[
              { key: 'book', label: 'Livro' },
              { key: 'student', label: 'Aluno' },
              { key: 'loanDate', label: 'Retirada', render: (row) => formatDateTime(row.loanDate) },
              { key: 'returnDate', label: 'Devolucao', render: (row) => (row.returnDate ? formatDateTime(row.returnDate) : '-') },
              { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
            ]}
            rows={loanRowsFromApi}
          />
        </Section>
      </div>
    );
  }

  const bookRows = buildBookRows(books);
  const loanRows = loans.length
    ? loans.map((loan) => ({
        id: loan.id,
        book: loan.bookId,
        status: loan.status === 'active' ? 'Ativo' : loan.status === 'returned' ? 'Devolvido' : 'Atrasado',
        date: loan.loanDate,
      }))
    : SAMPLE_LOANS;
  const activeLoans = loanRows.filter((loan) => loan.status === 'Ativo').length;
  const returnedLoans = loanRows.filter((loan) => loan.status === 'Devolvido').length;
  const overdueLoans = loanRows.filter((loan) => loan.status === 'Atrasado').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayMovements = [
    ...sessions.filter((session) => String(session.timestamp || '').slice(0, 10) === today),
    ...events.filter((event) => String(event.timestamp || '').slice(0, 10) === today),
  ].length;
  const reportRows = [
    { id: 'r1', title: 'Frequencia de utilizacao', period: 'Diario / mensal', source: 'Entradas e saidas', status: 'Disponivel' },
    { id: 'r2', title: 'Livros mais emprestados', period: 'Semanal / mensal', source: 'Emprestimos', status: 'Disponivel' },
    { id: 'r3', title: 'Tempo medio de permanencia', period: 'Por periodo', source: 'Sessoes', status: 'Disponivel' },
    { id: 'r4', title: 'Movimentacao por periodo', period: 'Personalizado', source: 'Operacao', status: 'Em preparo' },
    { id: 'r5', title: 'Integridade do acervo', period: 'Por auditoria', source: 'RFID', status: 'Disponivel' },
    { id: 'r6', title: 'Alunos com FaceID pendente', period: 'Atual', source: 'Alunos', status: 'Disponivel' },
  ];
  const topBookRows = bookRows.slice(0, 6).map((book) => ({
    id: book.id,
    title: book.title,
    category: book.category,
    moves: book.moves,
    status: book.status,
  }));
  const presenceRows = COURSE_USAGE.map((course, index) => ({
    id: `presence-${course.label}`,
    course: course.label,
    students: Math.max(12, Math.round((students.length || 120) * (course.value / 100) * 0.22)),
    stay: `${32 + index * 4} min`,
    movement: `${course.value}%`,
  }));
  const totalStudents = students.length || 1264;
  const studentRows = buildStudentRows(students);
  const facePending = studentRows.filter((row) => row.faceStatus !== 'Face pronta').length;
  const faceCoverage = studentRows.length
    ? Math.round(((studentRows.length - facePending) / studentRows.length) * 100)
    : 92;
  const availableBooks = bookRows.filter((book) => book.status === 'Disponivel').length;
  const totalBooks = Math.max(bookRows.length, 1);
  const rfidCoverage = Math.round((bookRows.filter((book) => Boolean(book.rfid)).length / totalBooks) * 100);
  const collectionAvailability = Math.round((availableBooks / totalBooks) * 100);
  const loansOpen = activeLoans + overdueLoans;
  const loanCompliance = loansOpen ? Math.round(((loansOpen - overdueLoans) / loansOpen) * 100) : 88;
  const frequencyTarget = Math.min(100, Math.round(((todayMovements || 94) / 120) * 100));
  const collectionTurnover = Math.min(100, Math.round((((activeLoans + returnedLoans) || 18) / totalBooks) * 18));
  const inventoryIntegrity = Math.max(0, Math.round((rfidCoverage + collectionAvailability + loanCompliance) / 3));
  const collectionData = [
    { label: 'Disponiveis', value: availableBooks || 64 },
    { label: 'Emprestados', value: activeLoans || 22 },
    { label: 'Atrasados', value: overdueLoans || 4 },
    { label: 'Reservados', value: bookRows.filter((book) => book.status === 'Reservado').length || 6 },
  ];
  const reportRadar = [
    { label: 'Meta de frequencia', value: frequencyTarget },
    { label: 'Giro do acervo', value: collectionTurnover || 72 },
    { label: 'Emprestimos no prazo', value: loanCompliance },
    { label: 'Cobertura RFID', value: rfidCoverage || 84 },
    { label: 'FaceID atualizado', value: faceCoverage },
    { label: 'Integridade acervo', value: inventoryIntegrity || 82 },
  ];
  const categoryData = Object.values(
    bookRows.reduce((acc, book) => {
      const key = book.category || 'Geral';
      acc[key] = acc[key] || { label: key, value: 0 };
      acc[key].value += Number(book.moves || 1);
      return acc;
    }, {})
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-5 p-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b70f16]">Central de relatorios</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#334d59]">Analise institucional da biblioteca</h2>
            <p className="mt-2 text-sm text-slate-500">
              Indicadores para acompanhar frequencia, acervo, permanencia, emprestimos e pendencias operacionais.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                <Download className="h-4 w-4" />
                Exportar
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#b70f16] px-3 text-sm font-semibold text-white">
                <FileBarChart className="h-4 w-4" />
                Gerar relatorio
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Select label="Periodo" defaultValue="mes">
              <option value="hoje">Hoje</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="personalizado">Personalizado</option>
            </Select>
            <Input label="Data inicial" type="date" />
            <Input label="Data final" type="date" />
            <Select label="Curso" defaultValue="todos">
              <option value="todos">Todos os cursos</option>
              <option>Informatica</option>
              <option>Ensino Medio</option>
              <option>Administracao</option>
            </Select>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Alunos" value={totalStudents} detail="Cadastrados" icon={Users} tone="blue" />
        <MetricCard label="Frequencia" value={todayMovements || 94} detail="No periodo" icon={UserCheck} tone="emerald" />
        <MetricCard label="Emprestimos" value={activeLoans} detail={`${returnedLoans} devolvidos`} icon={ClipboardList} tone="amber" />
        <MetricCard label="Acervo" value={bookRows.length} detail="Livros cadastrados" icon={BookOpen} tone="slate" />
        <MetricCard label="Permanencia" value="38 min" detail="Media geral" icon={Clock3} tone="blue" />
        <MetricCard label="Pendencias" value={facePending + overdueLoans} detail="FaceID e atrasos" icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Section title="Evolucao de movimentacao" subtitle="Leitura temporal do periodo filtrado">
          <LineAreaChart data={PERIOD_LOANS} />
        </Section>
        <Section title="Indicadores consolidados" subtitle="Frequencia, giro do acervo, prazos, RFID, FaceID e integridade">
          <RadarChart data={reportRadar} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="Acervo por situacao" subtitle="Pizza de disponibilidade, emprestimos e atrasos">
          <PieChart data={collectionData} />
        </Section>
        <Section title="Utilizacao por curso" subtitle="Distribuicao de frequencia academica">
          <DonutChart data={COURSE_USAGE.slice(0, 5)} centerValue={`${todayMovements || 94}`} centerLabel="movimentos" />
        </Section>
        <Section title="Categorias mais usadas" subtitle="Giro do acervo por categoria">
          <HorizontalBars data={categoryData.length ? categoryData : DISCIPLINES} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Section title="Relatorios disponiveis" subtitle="Modelos prontos para consulta e exportacao">
          <DataTable
            columns={[
              { key: 'title', label: 'Relatorio', render: (row) => <span className="font-semibold text-slate-900">{row.title}</span> },
              { key: 'period', label: 'Periodo' },
              { key: 'source', label: 'Base' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
            ]}
            rows={reportRows}
          />
        </Section>

        <Section title="Livros mais emprestados" subtitle="Ranking de utilizacao do acervo">
          <DataTable
            columns={[
              { key: 'title', label: 'Livro' },
              { key: 'category', label: 'Categoria' },
              { key: 'moves', label: 'Mov.' },
              { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
            ]}
            rows={topBookRows}
          />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Section title="Permanencia por curso" subtitle="Tempo medio e volume de alunos">
          <DataTable
            columns={[
              { key: 'course', label: 'Curso' },
              { key: 'students', label: 'Alunos' },
              { key: 'stay', label: 'Permanencia' },
              { key: 'movement', label: 'Utilizacao' },
            ]}
            rows={presenceRows}
          />
        </Section>

        <Section title="Alertas do periodo" subtitle="Pontos que merecem acompanhamento">
          <div className="space-y-3">
            {[
              { id: 'a1', title: 'Livros atrasados', value: overdueLoans, detail: 'Emprestimos fora do prazo', status: overdueLoans ? 'Atenção' : 'OK' },
              { id: 'a2', title: 'FaceID pendente', value: facePending, detail: 'Alunos precisam atualizar biometria', status: facePending ? 'Pendente' : 'OK' },
              { id: 'a3', title: 'Ocorrencias RFID', value: SECURITY_EVENTS.filter((event) => event.type.includes('RFID')).length, detail: 'Divergencias registradas', status: 'Monitorar' },
            ].map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                  <p className="text-xs text-slate-500">{alert.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-slate-950">{alert.value}</p>
                  <StatusPill>{alert.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function SettingsModule() {
  return (
    <div className="space-y-5">
      <Section title="Configuracoes" subtitle="Parametros reais serao carregados pela API">
        <DataTable
          emptyText="Nenhuma configuracao cadastrada."
          columns={[
            { key: 'name', label: 'Configuracao' },
            { key: 'value', label: 'Valor' },
            { key: 'status', label: 'Status' },
          ]}
          rows={[]}
        />
      </Section>
    </div>
  );
}

function PresenceModule({ variant, sessions, students }) {
  const studentMap = new Map(students.map((student) => [student.id, student.name]));
  const activeRows = sessions
    .filter((session) => session.type === 'entry')
    .slice(0, 12)
    .map((session, index) => ({
      id: session.id,
      student: studentMap.get(session.studentId) || session.studentId,
      entry: session.timestamp,
      duration: index % 2 ? '42 min' : 'Em andamento',
      location: ['Sala silenciosa', 'Acervo tecnico', 'Area de estudo'][index % 3],
      status: index % 2 ? 'Presente' : 'Em andamento',
    }));
  const fallback = [
    { id: 'p1', student: 'Renan da Silva Ramos', entry: new Date().toISOString(), duration: 'Em andamento', location: 'Acervo tecnico', status: 'Presente' },
    { id: 'p2', student: 'Mariana Costa', entry: new Date().toISOString(), duration: '36 min', location: 'Sala silenciosa', status: 'Presente' },
    { id: 'p3', student: 'Joao Pedro Almeida', entry: new Date().toISOString(), duration: 'Finalizada', location: 'Area de estudo', status: 'Finalizada' },
  ];
  const rows = activeRows.length ? activeRows : fallback;
  const isHistory = variant === 'history';

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Sessoes ativas" value={rows.filter((row) => row.status !== 'Finalizada').length} icon={UserCheck} tone="emerald" />
        <MetricCard label="Permanencia media" value="38 min" icon={Clock3} tone="slate" />
        <MetricCard label="Picos do dia" value="14h - 16h" icon={BarChart3} tone="blue" />
      </div>
      <Section
        title={isHistory ? 'Historico de presenca' : 'Sessoes ativas'}
        subtitle={isHistory ? 'Linha do tempo de entradas, saidas e permanencia' : 'Alunos presentes e sessoes em andamento'}
      >
        <DataTable
          columns={[
            { key: 'student', label: 'Aluno' },
            { key: 'entry', label: 'Entrada', render: (row) => formatDateTime(row.entry) },
            { key: 'duration', label: 'Permanencia' },
            { key: 'location', label: 'Area' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
          ]}
          rows={rows}
        />
      </Section>
    </div>
  );
}

function CollectionSegmentModule({ variant, books }) {
  const bookRows = buildBookRows(books);
  const data = {
    copies: {
      title: 'Exemplares',
      subtitle: 'Controle individual por codigo, RFID, status e localizacao',
      rows: bookRows.map((book) => ({
        id: book.id,
        copyCode: book.copyCode,
        rfid: book.rfid,
        title: book.title,
        location: book.location,
        status: book.status,
      })),
      columns: [
        { key: 'copyCode', label: 'Exemplar' },
        { key: 'rfid', label: 'RFID' },
        { key: 'title', label: 'Livro' },
        { key: 'location', label: 'Localizacao' },
        { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
      ],
    },
    categories: {
      title: 'Categorias',
      subtitle: 'Organizacao do acervo por areas de conhecimento',
      rows: ['Ciencias', 'Exatas', 'Literatura', 'Tecnologia', 'Gestao'].map((category, index) => ({
        id: `cat-${category}`,
        category,
        titles: 42 - index * 5,
        copies: 118 - index * 9,
        movement: `${78 - index * 8}%`,
        status: index === 4 ? 'Pendente' : 'Ativo',
      })),
      columns: [
        { key: 'category', label: 'Categoria' },
        { key: 'titles', label: 'Titulos' },
        { key: 'copies', label: 'Exemplares' },
        { key: 'movement', label: 'Movimentacao' },
        { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
      ],
    },
    locations: {
      title: 'Localizacoes',
      subtitle: 'Mapa fisico de prateleiras, salas e areas de guarda',
      rows: ['A1', 'B1', 'C2', 'D1', 'Reserva tecnica'].map((location, index) => ({
        id: `loc-${location}`,
        location,
        area: ['Literatura', 'Ciencias', 'Exatas', 'Tecnologia', 'Administrativo'][index],
        capacity: `${70 + index * 12}%`,
        alerts: index === 4 ? 2 : index,
        status: index === 4 ? 'Reservado' : 'Ativo',
      })),
      columns: [
        { key: 'location', label: 'Localizacao' },
        { key: 'area', label: 'Area' },
        { key: 'capacity', label: 'Ocupacao' },
        { key: 'alerts', label: 'Alertas' },
        { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
      ],
    },
  }[variant];

  return (
    <Section title={data.title} subtitle={data.subtitle}>
      <DataTable columns={data.columns} rows={data.rows} />
    </Section>
  );
}

function CirculationSegmentModule({ variant }) {
  const config = {
    returns: {
      title: 'Devolucoes',
      subtitle: 'Conferencia de retorno, RFID e baixa automatica',
      status: 'Devolvido',
      action: 'Conferir',
    },
    reservations: {
      title: 'Reservas',
      subtitle: 'Fila de espera e disponibilidade futura',
      status: 'Reservado',
      action: 'Priorizar',
    },
    renewals: {
      title: 'Renovacoes',
      subtitle: 'Solicitacoes, politica de prazo e aprovacao',
      status: 'Pendente',
      action: 'Renovar',
    },
  }[variant];
  const rows = SAMPLE_LOANS.map((loan, index) => ({
    ...loan,
    id: `${variant}-${loan.id}`,
    status: index === 0 ? config.status : loan.status,
    requestDate: new Date().toISOString(),
  }));

  return (
    <Section title={config.title} subtitle={config.subtitle}>
      <DataTable
        columns={[
          { key: 'student', label: 'Aluno' },
          { key: 'book', label: 'Livro' },
          { key: 'course', label: 'Curso' },
          { key: 'requestDate', label: 'Solicitacao', render: (row) => formatDate(row.requestDate) },
          { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
          { key: 'action', label: 'Acao', render: () => <button className="text-sm font-semibold text-[#b70f16]">{config.action}</button> },
        ]}
        rows={rows}
      />
    </Section>
  );
}

function AuditSegmentModule({ variant }) {
  const config = {
    inventory: {
      title: 'Inventario',
      subtitle: 'Conferencia fisica do acervo e divergencias por setor',
      rows: BOOK_CATALOG.map((book) => ({ id: `inv-${book.id}`, item: book.copyCode, detail: book.title, area: book.location, status: book.status })),
    },
    'rfid-audit': {
      title: 'Auditoria RFID',
      subtitle: 'Leituras, divergencias e livros detectados sem emprestimo',
      rows: SECURITY_EVENTS.filter((event) => event.type.includes('RFID')).map((event, index) => ({ id: `rfid-${index}`, item: event.type, detail: event.detail, area: 'Portico 01', status: event.severity })),
    },
    occurrences: {
      title: 'Ocorrencias',
      subtitle: 'Tratativa operacional e seguranca institucional',
      rows: SECURITY_EVENTS.map((event, index) => ({ id: `occ-${index}`, item: event.type, detail: event.detail, area: event.time, status: event.severity })),
    },
    logs: {
      title: 'Logs',
      subtitle: 'Eventos tecnicos, integracoes e rastreabilidade',
      rows: ['Auth OK', 'Camera inicializada', 'RFID conectado', 'FaceID atualizado'].map((detail, index) => ({ id: `log-${index}`, item: `LOG-${index + 1}`, detail, area: nowLabel(), status: 'OK' })),
    },
  }[variant];

  return (
    <Section title={config.title} subtitle={config.subtitle}>
      <DataTable
        columns={[
          { key: 'item', label: 'Registro' },
          { key: 'detail', label: 'Detalhe' },
          { key: 'area', label: 'Origem' },
          { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
        ]}
        rows={config.rows}
      />
    </Section>
  );
}

function IntelligenceModule({ variant, books }) {
  const bookRows = buildBookRows(books);
  const configs = {
    'library-usage': { title: 'Utilizacao da Biblioteca', subtitle: 'Tendencias de uso por periodo', data: MOVEMENT_HOURS },
    'course-frequency': { title: 'Frequencia por Curso', subtitle: 'Participacao dos cursos na biblioteca', data: COURSE_USAGE },
    'class-frequency': {
      title: 'Frequencia por Turma',
      subtitle: 'Ranking de turmas mais ativas',
      data: [
        { label: '9A', value: 83 },
        { label: '2B', value: 71 },
        { label: 'ADS-3', value: 66 },
        { label: 'ADM-1', value: 54 },
      ],
    },
    'top-books': { title: 'Livros Mais Utilizados', subtitle: 'Acervo com maior giro', data: bookRows.slice(0, 5).map((book) => ({ label: book.title, value: book.moves })) },
    'idle-books': {
      title: 'Livros Sem Movimentacao',
      subtitle: 'Itens para curadoria e reposicionamento',
      data: bookRows.slice(-4).map((book, index) => ({ label: book.title, value: 18 - index * 3 })),
    },
    indicators: { title: 'Indicadores', subtitle: 'KPIs executivos da operacao', data: DISCIPLINES },
  };
  const config = configs[variant];

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Section title={config.title} subtitle={config.subtitle}>
        <HorizontalBars data={config.data} />
      </Section>
      <Section title="Evolucao comparativa" subtitle="Leitura gerencial para tomada de decisao">
        <BarChart data={PERIOD_LOANS} />
      </Section>
    </div>
  );
}

function ReportSegmentModule({ variant }) {
  const names = {
    'report-loans': 'Relatorio de Emprestimos',
    'report-frequency': 'Relatorio de Frequencia',
    'report-collection': 'Relatorio de Acervo',
    'report-stay': 'Relatorio de Permanencia',
  };
  const rows = REPORTS.map((report, index) => ({
    id: `${variant}-${index}`,
    title: index === 0 ? names[variant] : report.title,
    owner: report.owner,
    period: report.period,
    status: report.status,
  }));

  return (
    <Section title={names[variant]} subtitle="Central de consulta e exportacao futura">
      <DataTable
        columns={[
          { key: 'title', label: 'Relatorio' },
          { key: 'owner', label: 'Responsavel' },
          { key: 'period', label: 'Periodo' },
          { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
          { key: 'action', label: 'Acao', render: () => <button className="text-sm font-semibold text-[#b70f16]">Visualizar</button> },
        ]}
        rows={rows}
      />
    </Section>
  );
}

function AdminSegmentModule({ variant }) {
  if (variant === 'permissions') {
    const rows = ['Administrador', 'Bibliotecario', 'Coordenacao', 'Auditoria'].map((role, index) => ({
      id: `role-${role}`,
      role,
      users: 2 + index,
      scope: ['Total', 'Operacional', 'Relatorios', 'Somente leitura'][index],
      status: 'Ativo',
    }));

    return (
      <Section title="Permissoes" subtitle="Perfis de acesso e escopos de operacao">
        <DataTable
          columns={[
            { key: 'role', label: 'Perfil' },
            { key: 'users', label: 'Usuarios' },
            { key: 'scope', label: 'Escopo' },
            { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
          ]}
          rows={rows}
        />
      </Section>
    );
  }

  const rows = [
    { id: 'u1', name: 'Renan Ramos', email: 'renan@fatec.edu.br', role: 'Administrador', status: 'Ativo' },
    { id: 'u2', name: 'Biblioteca Central', email: 'biblioteca@fatec.edu.br', role: 'Bibliotecario', status: 'Ativo' },
    { id: 'u3', name: 'Auditoria Interna', email: 'auditoria@fatec.edu.br', role: 'Auditoria', status: 'Pendente' },
  ];

  return (
    <Section title="Usuarios" subtitle="Contas administrativas e acesso institucional">
      <DataTable
        columns={[
          { key: 'name', label: 'Usuario' },
          { key: 'email', label: 'E-mail' },
          { key: 'role', label: 'Perfil' },
          { key: 'status', label: 'Status', render: (row) => <StatusPill>{row.status}</StatusPill> },
        ]}
        rows={rows}
      />
    </Section>
  );
}

function AuditModule({ books }) {
  const toast = useToast();
  const [status, setStatus] = useState('idle'); // idle | running | paused | finished
  const [validatedMap, setValidatedMap] = useState({}); // { [bookId]: ISOtimestamp }
  const [unknownTags, setUnknownTags] = useState([]); // [{ tag, at }]
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'duplicate'|'unknown'|'error', message }
  const [readerStatus, setReaderStatus] = useState('idle'); // idle | waiting | error | unavailable
  const [readerError, setReaderError] = useState('');
  // IDs de eventos audit.* ja aplicados ao estado local (evita dupla aplicacao
  // quando o polling traz de volta um evento que nos mesmos criamos).
  const appliedEventIdsRef = useRef(new Set());

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

  const normalizeTag = (raw) =>
    String(raw || '').replace(/^nfc:/i, '').replace(/[:\s]/g, '').trim().toUpperCase();

  // Cria um evento e ja registra o ID como aplicado localmente, para que o
  // polling subsequente nao tente reaplicar e gerar feedback duplicado.
  const createAuditEvent = (data) =>
    eventService
      .create(data)
      .then((event) => {
        if (event?.id) appliedEventIdsRef.current.add(event.id);
        return event;
      })
      .catch((err) => {
        console.warn('[audit] event create failed:', err?.message || err);
        return null;
      });

  const handleTag = useCallback(
    (rawTag) => {
      const tag = normalizeTag(rawTag);
      if (!tag) return;

      const at = new Date().toISOString();
      const book = books.find((b) => normalizeTag(b.rfid) === tag);

      if (!book) {
        setUnknownTags((prev) => [{ tag, at }, ...prev].slice(0, 20));
        setFeedback({ type: 'unknown', message: `Tag desconhecida: ${tag}` });
        createAuditEvent({ type: 'audit.tag.unknown', payload: { tag, at, source: 'platform' } });
        return;
      }

      if (book.id in validatedMap) {
        setFeedback({ type: 'duplicate', message: `"${book.title}" ja foi validado.` });
        createAuditEvent({
          type: 'audit.tag.duplicate',
          payload: { bookId: book.id, tag, at, source: 'platform' },
        });
        return;
      }

      setValidatedMap((prev) => ({ ...prev, [book.id]: at }));
      setFeedback({ type: 'success', message: `"${book.title}" validado.` });
      createAuditEvent({
        type: 'audit.book.validated',
        payload: { bookId: book.id, title: book.title, rfid: tag, at, source: 'platform' },
      });
    },
    [books, validatedMap]
  );

  // Mantemos handleTag via ref para nao reiniciar o leitor a cada validacao.
  const handleTagRef = useRef(handleTag);
  useEffect(() => {
    handleTagRef.current = handleTag;
  }, [handleTag]);

  // Aplica um evento audit.* vindo do polling no estado local.
  // Eventos criados aqui mesmo ja entram no appliedEventIdsRef e nao chegam aqui.
  const applyAuditEvent = useCallback(
    (event) => {
      const { type, payload = {}, timestamp } = event;
      switch (type) {
        case 'audit.started': {
          // Apenas auto-inicia se o evento for recente (< 90s) - evita
          // ressuscitar uma sessao antiga ao abrir a tela.
          const ageMs = Date.now() - new Date(timestamp).getTime();
          if (Number.isFinite(ageMs) && ageMs < 90000) {
            setValidatedMap({});
            setUnknownTags([]);
            setFeedback({ type: 'success', message: 'Auditoria iniciada no celular.' });
            setStatus('running');
          }
          break;
        }
        case 'audit.book.validated': {
          if (!payload.bookId) return;
          const at = payload.at || timestamp;
          setValidatedMap((prev) =>
            prev[payload.bookId] ? prev : { ...prev, [payload.bookId]: at }
          );
          const book = books.find((b) => b.id === payload.bookId);
          setFeedback({
            type: 'success',
            message: book ? `"${book.title}" validado.` : `Livro validado (id ${payload.bookId}).`,
          });
          break;
        }
        case 'audit.tag.unknown': {
          if (!payload.tag) return;
          const at = payload.at || timestamp;
          setUnknownTags((prev) => {
            if (prev.some((t) => t.tag === payload.tag && t.at === at)) return prev;
            return [{ tag: payload.tag, at }, ...prev].slice(0, 20);
          });
          setFeedback({ type: 'unknown', message: `Tag desconhecida: ${payload.tag}` });
          break;
        }
        case 'audit.tag.duplicate': {
          if (!payload.bookId) return;
          const book = books.find((b) => b.id === payload.bookId);
          if (book) {
            setFeedback({ type: 'duplicate', message: `"${book.title}" ja foi validado.` });
          }
          break;
        }
        case 'audit.paused':
          setStatus('paused');
          break;
        case 'audit.resumed':
          setStatus('running');
          break;
        case 'audit.finished':
          setStatus('finished');
          break;
        default:
          break;
      }
    },
    [books]
  );

  // Polling de eventos: a cada 3s busca eventos audit.* novos e aplica.
  // Mantem o desktop em sincronia com a auditoria em andamento no /audit-mobile.
  useEffect(() => {
    let cancelled = false;
    let busy = false;

    const poll = async () => {
      if (busy || cancelled) return;
      busy = true;
      try {
        const events = await eventService.list({ limit: 100 });
        if (cancelled || !Array.isArray(events)) return;

        const newAuditEvents = events
          .filter(
            (e) => e?.type?.startsWith?.('audit.') && e.id && !appliedEventIdsRef.current.has(e.id)
          )
          .sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

        for (const event of newAuditEvents) {
          appliedEventIdsRef.current.add(event.id);
          applyAuditEvent(event);
        }
      } catch (err) {
        console.warn('[audit] poll failed:', err?.message || err);
      } finally {
        busy = false;
      }
    };

    poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [applyAuditEvent]);

  // Leitor NFC continuo: inicia quando a auditoria entra em 'running' e
  // para em qualquer outro estado.
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
        setReaderError(err.message || 'Nao foi possivel iniciar a leitura NFC.');
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
    createAuditEvent({ type: 'audit.started', payload: { total, source: 'platform' } });
    toast.success('Auditoria iniciada.');
  };

  const pause = () => {
    setStatus('paused');
    createAuditEvent({
      type: 'audit.paused',
      payload: { validatedCount, pendingCount, source: 'platform' },
    });
    toast.info('Auditoria pausada.');
  };

  const resume = () => {
    setStatus('running');
    createAuditEvent({
      type: 'audit.resumed',
      payload: { validatedCount, pendingCount, source: 'platform' },
    });
  };

  const generateReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
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
    a.download = `auditoria-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const finish = () => {
    setStatus('finished');
    createAuditEvent({
      type: 'audit.finished',
      payload: {
        total,
        validatedCount,
        pendingCount,
        percent,
        unknownCount: unknownTags.length,
        source: 'platform',
      },
    });
    generateReport();
    toast.success('Auditoria finalizada. Relatorio baixado.');
  };

  const reset = () => {
    setStatus('idle');
    setValidatedMap({});
    setUnknownTags([]);
    setFeedback(null);
    setReaderStatus('idle');
    setReaderError('');
  };

  const statusBadge = {
    idle: { label: 'Aguardando inicio', tone: 'slate' },
    running: { label: 'Em andamento', tone: 'emerald' },
    paused: { label: 'Pausada', tone: 'amber' },
    finished: { label: 'Finalizada', tone: 'slate' },
  }[status];

  const readerBadge =
    status === 'running'
      ? readerStatus === 'waiting'
        ? { label: 'Aguardando leitura...', tone: 'emerald' }
        : readerStatus === 'error'
        ? { label: 'Erro no leitor', tone: 'red' }
        : readerStatus === 'unavailable'
        ? { label: 'Leitor indisponivel', tone: 'red' }
        : { label: 'Inicializando...', tone: 'amber' }
      : status === 'paused'
      ? { label: 'Pausado', tone: 'amber' }
      : status === 'finished'
      ? { label: 'Finalizado', tone: 'slate' }
      : { label: 'Inativo', tone: 'slate' };

  const toneClasses = (tone) =>
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-700'
      : tone === 'red'
      ? 'bg-red-50 text-red-700'
      : 'bg-slate-100 text-slate-600';

  const pillClasses = (tone) =>
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Auditoria dos livros</h3>
          <p className="mt-1 text-xs text-slate-500">Conferência física do acervo da biblioteca</p>
        </div>
        <a
          href="/audit-mobile"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <SmartphoneNfc className="h-4 w-4" />
          Abrir no celular
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Total de livros" value={total} icon={BookOpen} tone="blue" />
        <MetricCard
          label="Validados"
          value={validatedCount}
          icon={CheckCircle2}
          tone="emerald"
          detail={status === 'running' || status === 'paused' ? 'em andamento' : null}
        />
        <MetricCard label="Pendentes" value={pendingCount} icon={ClipboardList} tone="amber" />
        <MetricCard
          label="Conclusao"
          value={`${percent}%`}
          icon={Activity}
          tone="violet"
          detail={total > 0 ? `${validatedCount} de ${total}` : 'sem itens'}
        />
        <MetricCard
          label="Status"
          value={statusBadge.label}
          icon={Tag}
          tone={statusBadge.tone === 'emerald' ? 'emerald' : statusBadge.tone === 'amber' ? 'amber' : 'slate'}
        />
      </div>

      {total === 0 && (
        <div className="rounded-md border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <Library className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Nenhum livro encontrado para auditoria.</p>
          <p className="mt-1 text-xs text-slate-500">Cadastre livros no Acervo antes de iniciar uma auditoria.</p>
        </div>
      )}

      {status === 'idle' && total > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
          <SmartphoneNfc className="mx-auto h-10 w-10 text-[#b70f16]" />
          <h3 className="mt-3 text-base font-semibold text-slate-950">Pronto para iniciar a auditoria</h3>
          <p className="mt-1 text-xs text-slate-500">
            {total} {total === 1 ? 'livro sera conferido' : 'livros serao conferidos'}. Voce pode pausar ou finalizar a qualquer momento.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-[#b70f16] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9d0d13]"
          >
            <ClipboardList className="h-4 w-4" />
            Iniciar auditoria
          </button>
        </div>
      )}

      {feedback && status !== 'idle' && (
        <div
          className={`flex items-center gap-3 rounded-md border px-3 py-2 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : feedback.type === 'duplicate'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded p-1 hover:bg-black/10"
            aria-label="Fechar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {total > 0 && status !== 'idle' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title={`Livros pendentes (${pendingCount})`} subtitle="Aguardando leitura RFID">
            <DataTable
              emptyText={
                validatedCount > 0
                  ? 'Todos os livros foram validados.'
                  : 'Nenhum livro pendente.'
              }
              columns={[
                { key: 'title', label: 'Livro' },
                { key: 'copyCode', label: 'Exemplar', render: (row) => row.copyCode || '-' },
                {
                  key: 'rfid',
                  label: 'RFID',
                  render: (row) => (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                      {row.rfid || '-'}
                    </code>
                  ),
                },
                { key: 'status', label: 'Status', render: () => <StatusPill>Pendente</StatusPill> },
              ]}
              rows={pendingBooks}
            />
          </Section>

          <Section title={`Livros validados (${validatedCount})`} subtitle="Confirmados via leitura RFID">
            <DataTable
              emptyText="Aproxime o celular do primeiro livro para iniciar."
              columns={[
                { key: 'title', label: 'Livro' },
                { key: 'copyCode', label: 'Exemplar', render: (row) => row.copyCode || '-' },
                {
                  key: 'rfid',
                  label: 'RFID',
                  render: (row) => (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                      {row.rfid || '-'}
                    </code>
                  ),
                },
                {
                  key: 'scannedAt',
                  label: 'Escaneado em',
                  render: (row) => <span className="text-slate-600">{formatTime(row.scannedAt)}</span>,
                },
              ]}
              rows={validatedBooks}
            />
          </Section>
        </div>
      )}

      {unknownTags.length > 0 && status !== 'idle' && (
        <Section
          title={`Tags desconhecidas (${unknownTags.length})`}
          subtitle="Etiquetas lidas que nao correspondem a nenhum exemplar"
        >
          <ul className="divide-y divide-slate-100 text-sm">
            {unknownTags.slice(0, 10).map((entry, i) => (
              <li key={`${entry.tag}-${i}`} className="flex items-center justify-between gap-3 py-2">
                <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                  {entry.tag}
                </code>
                <span className="text-xs text-slate-500">{formatTime(entry.at)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {status !== 'idle' && (
        <div className="sticky bottom-0 left-0 right-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-1 min-w-0 items-center gap-3">
                <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-md ${toneClasses(readerBadge.tone)}`}>
                  <SmartphoneNfc className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {status === 'running'
                      ? 'Aproxime o celular de um livro para escanear a tag RFID'
                      : status === 'paused'
                      ? 'Auditoria pausada - retome para continuar lendo'
                      : 'Auditoria finalizada - baixe o relatorio ou inicie outra'}
                  </p>
                  {readerError && status === 'running' && (
                    <p className="truncate text-xs text-red-600">{readerError}</p>
                  )}
                </div>
                <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${pillClasses(readerBadge.tone)}`}>
                  {readerBadge.label}
                </span>
              </div>

              <div className="flex flex-none items-center gap-2">
                {status === 'running' && (
                  <button
                    type="button"
                    onClick={pause}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Clock3 className="h-4 w-4" />
                    Pausar auditoria
                  </button>
                )}
                {status === 'paused' && (
                  <button
                    type="button"
                    onClick={resume}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <RotateCw className="h-4 w-4" />
                    Retomar
                  </button>
                )}
                {status === 'finished' ? (
                  <>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <RotateCw className="h-4 w-4" />
                      Nova auditoria
                    </button>
                    <button
                      type="button"
                      onClick={generateReport}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-[#b70f16] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9d0d13]"
                    >
                      <Download className="h-4 w-4" />
                      Baixar relatorio
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={finish}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-[#b70f16] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9d0d13]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finalizar e gerar relatorio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformPage() {
  const toast = useToast();
  const [activeModule, setActiveModule] = useState(getInitialModule);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);

  async function reload() {
    const [studentData, bookData, loanData, sessionData] = await Promise.all([
      studentService.list(),
      bookService.list(),
      loanService.list(),
      sessionService.list(),
    ]);
    setStudents(studentData);
    setBooks(bookData);
    setLoans(loanData);
    setSessions(sessionData);
    eventService.list({ limit: 200 }).then(setEvents).catch((err) => {
      console.warn('[platform] Nao foi possivel carregar eventos:', err);
    });
  }

  useEffect(() => {
    reload().catch((err) => toast.error(err.message || 'Erro ao carregar dados da plataforma'));
  }, []);

  const modules = {
    dashboard: <DashboardModule students={students} books={books} loans={loans} sessions={sessions} />,
    operations: <OperationsModule students={students} books={books} loans={loans} sessions={sessions} reload={reload} />,
    library: <BooksModule students={students} books={books} loans={loans} events={events} reload={reload} />,
    audit: <AuditModule books={books} reload={reload} />,
    students: <StudentsModule students={students} books={books} loans={loans} sessions={sessions} reload={reload} />,
    reports: <ReportsModule students={students} books={books} loans={loans} sessions={sessions} />,
    settings: <SettingsModule />,
  };

  return (
    <Shell activeModule={activeModule} setActiveModule={setActiveModule}>
      {modules[activeModule] || modules.dashboard}
    </Shell>
  );
}
