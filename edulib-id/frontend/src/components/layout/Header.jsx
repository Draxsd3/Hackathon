import { Link, NavLink } from 'react-router-dom';
import { Library, Menu, X } from 'lucide-react';
import { useState } from 'react';

const MOBILE_NAV = [
  { to: '/', label: 'Inicio' },
  { to: '/dashboard', label: 'Visão geral' },
  { to: '/students/register', label: 'Cadastrar aluno' },
  { to: '/entry', label: 'Entrada' },
  { to: '/exit', label: 'Saida' },
  { to: '/loan', label: 'Emprestimo' },
  { to: '/return', label: 'Devolucao' },
  { to: '/assistant', label: 'Assistente' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-slate-200 bg-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Library className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Edulib-ID</span>
        </Link>
        <button
          type="button"
          className="rounded p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-2">
          <ul className="flex flex-col gap-1">
            {MOBILE_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded px-3 py-2 text-sm ${
                      isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
