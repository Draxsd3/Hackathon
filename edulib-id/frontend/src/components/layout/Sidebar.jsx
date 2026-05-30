import { NavLink } from 'react-router-dom';
import {
  Home,
  UserPlus,
  LogIn,
  LogOut,
  BookPlus,
  BookCheck,
  Bot,
  LayoutDashboard,
  Library,
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Inicio', icon: Home, exact: true },
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/students/register', label: 'Cadastrar aluno', icon: UserPlus },
  { to: '/entry', label: 'Entrada', icon: LogIn },
  { to: '/exit', label: 'Saida', icon: LogOut },
  { to: '/loan', label: 'Emprestimo', icon: BookPlus },
  { to: '/return', label: 'Devolucao', icon: BookCheck },
  { to: '/assistant', label: 'Assistente', icon: Bot },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-none border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Library className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold leading-none text-slate-900">Edulib-ID</p>
          <p className="mt-1 text-xs text-slate-500">Biblioteca escolar</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-400">
        MVP em localStorage
      </div>
    </aside>
  );
}
