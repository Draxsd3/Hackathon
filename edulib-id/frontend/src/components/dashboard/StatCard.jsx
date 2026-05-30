export function StatCard({ label, value, icon: Icon, accent = 'primary', hint }) {
  const accents = {
    primary: 'bg-primary-50 text-primary-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {Icon && (
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${accents[accent] || accents.primary}`}>
          <Icon className="h-6 w-6" />
        </span>
      )}
    </div>
  );
}
