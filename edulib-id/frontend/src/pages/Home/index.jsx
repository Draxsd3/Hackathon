import { Link } from 'react-router-dom';
import {
  UserPlus,
  LogIn,
  LogOut,
  BookPlus,
  BookCheck,
  Bot,
  LayoutDashboard,
  Library,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';

const SHORTCUTS = [
  { to: '/students/register', icon: UserPlus, title: 'Cadastrar aluno', description: 'Registre um novo aluno com foto e gere o QR Code de identificacao.' },
  { to: '/entry', icon: LogIn, title: 'Entrada', description: 'Marque a entrada de um aluno usando face, QR ou busca.' },
  { to: '/exit', icon: LogOut, title: 'Saida', description: 'Marque a saida ao final da visita.' },
  { to: '/loan', icon: BookPlus, title: 'Emprestimo', description: 'Empreste um livro do acervo para um aluno.' },
  { to: '/return', icon: BookCheck, title: 'Devolucao', description: 'Devolva livros emprestados rapidamente.' },
  { to: '/assistant', icon: Bot, title: 'Assistente', description: 'Tire duvidas sobre regras, horarios e fluxos.' },
  { to: '/dashboard', icon: LayoutDashboard, title: 'Dashboard', description: 'Acompanhe metricas e atividade em tempo real.' },
];

export default function HomePage() {
  return (
    <div>
      <PageHeader
        icon={Library}
        title="Bem-vindo ao Edulib-ID"
        subtitle="Identifique alunos por face ou QR Code, controle entradas, saidas e emprestimos."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="card group flex h-full flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.description}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2">
              Abrir <ArrowRight className="h-4 w-4 transition" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
