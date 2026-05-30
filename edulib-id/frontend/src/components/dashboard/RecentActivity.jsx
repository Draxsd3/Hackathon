import { LogIn, LogOut, BookPlus, BookCheck, UserPlus, Activity } from 'lucide-react';
import { relativeTime } from '../../utils/dateUtils.js';
import { EmptyState } from '../common/EmptyState.jsx';

const META = {
  'session.entry': { icon: LogIn, label: 'Entrada', accent: 'text-emerald-600 bg-emerald-50' },
  'session.exit': { icon: LogOut, label: 'Saida', accent: 'text-slate-600 bg-slate-100' },
  'loan.created': { icon: BookPlus, label: 'Emprestimo', accent: 'text-primary-600 bg-primary-50' },
  'loan.returned': { icon: BookCheck, label: 'Devolucao', accent: 'text-amber-600 bg-amber-50' },
  'student.created': { icon: UserPlus, label: 'Cadastro', accent: 'text-violet-600 bg-violet-50' },
};

export function RecentActivity({ events, resolveLabel }) {
  if (!events?.length) {
    return (
      <EmptyState
        icon={Activity}
        title="Sem atividade ainda"
        description="As acoes na biblioteca aparecerao aqui em tempo real."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {events.map((event) => {
        const meta = META[event.type] || { icon: Activity, label: event.type, accent: 'text-slate-600 bg-slate-100' };
        const Icon = meta.icon;
        return (
          <li key={event.id} className="flex items-center gap-3 py-3">
            <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${meta.accent}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{meta.label}</p>
              <p className="truncate text-xs text-slate-500">{resolveLabel ? resolveLabel(event) : '-'}</p>
            </div>
            <span className="text-xs text-slate-400">{relativeTime(event.timestamp)}</span>
          </li>
        );
      })}
    </ul>
  );
}
