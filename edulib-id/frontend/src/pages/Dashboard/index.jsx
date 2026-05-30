import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BookPlus,
  AlertTriangle,
  LogIn,
  LogOut,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader.jsx';
import { StatCard } from '../../components/dashboard/StatCard.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { RecentActivity } from '../../components/dashboard/RecentActivity.jsx';
import { studentService } from '../../services/studentService.js';
import { bookService } from '../../services/bookService.js';
import { loanService } from '../../services/loanService.js';
import { sessionService } from '../../services/sessionService.js';
import { eventService } from '../../services/eventService.js';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    booksTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    activeLoans: 0,
    overdueLoans: 0,
    todayEntries: 0,
    todayExits: 0,
  });
  const [events, setEvents] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [studentLabels, setStudentLabels] = useState({});

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      await loanService.refreshOverdueStatus();

      const [students, books, activeLoans, overdueLoans, todayEntries, todayExits, recentEvents] =
        await Promise.all([
          studentService.list(),
          bookService.list(),
          loanService.list({ status: 'active' }),
          loanService.list({ status: 'overdue' }),
          sessionService.countToday('entry'),
          sessionService.countToday('exit'),
          eventService.list({ limit: 20 }),
        ]);

      const totalCopies = books.reduce((acc, b) => acc + (b.copies || 0), 0);
      const availableCopies = books.reduce((acc, b) => acc + (b.available || 0), 0);
      const labels = Object.fromEntries(students.map((s) => [s.id, `${s.name} - ${s.registration}`]));

      if (!alive) return;

      setStats({
        students: students.length,
        booksTitles: books.length,
        totalCopies,
        availableCopies,
        activeLoans: activeLoans.length,
        overdueLoans: overdueLoans.length,
        todayEntries,
        todayExits,
      });
      setEvents(recentEvents);
      setStudentLabels(labels);
      setAvailableBooks(
        [...books]
          .sort((a, b) => b.available - a.available)
          .slice(0, 8)
      );
    }

    const run = () => {
      loadDashboard().catch((err) => {
        console.error('[dashboard]', err);
      });
    };

    run();
    const interval = setInterval(run, 5000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const labelForEvent = (event) => {
    const { payload } = event;
    if (payload?.studentId) {
      return studentLabels[payload.studentId] || payload.studentId;
    }
    return JSON.stringify(payload);
  };

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="Visão geral"
        subtitle="Indicadores e ultimos eventos da biblioteca."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alunos" value={stats.students} icon={Users} accent="primary" />
        <StatCard
          label="Acervo"
          value={stats.availableCopies}
          hint={`${stats.booksTitles} titulos / ${stats.totalCopies} copias`}
          icon={BookOpen}
          accent="emerald"
        />
        <StatCard label="Emprestimos ativos" value={stats.activeLoans} icon={BookPlus} accent="amber" />
        <StatCard label="Em atraso" value={stats.overdueLoans} icon={AlertTriangle} accent="rose" />
        <StatCard label="Entradas hoje" value={stats.todayEntries} icon={LogIn} accent="primary" />
        <StatCard label="Saidas hoje" value={stats.todayExits} icon={LogOut} accent="slate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Atividade recente" subtitle="Ultimos 20 eventos registrados" />
          <RecentActivity events={events} resolveLabel={labelForEvent} />
        </Card>

        <Card>
          <CardHeader title="Livros disponiveis" subtitle="Mais copias disponiveis" />
          <ul className="divide-y divide-slate-100">
            {availableBooks
              .map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{b.title}</p>
                    <p className="text-xs text-slate-500">{b.author}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {b.available}/{b.copies}
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
