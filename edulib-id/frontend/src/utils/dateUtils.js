const DATE_FMT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const DATETIME_FMT = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const TIME_FMT = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' });

export function formatDate(iso) {
  if (!iso) return '-';
  return DATE_FMT.format(new Date(iso));
}

export function formatDateTime(iso) {
  if (!iso) return '-';
  return DATETIME_FMT.format(new Date(iso));
}

export function formatTime(iso) {
  if (!iso) return '-';
  return TIME_FMT.format(new Date(iso));
}

export function addDays(date, days) {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isOverdue(dueIso) {
  if (!dueIso) return false;
  return new Date(dueIso).getTime() < Date.now();
}

export function daysUntil(iso) {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function relativeTime(iso) {
  if (!iso) return '-';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atras`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h atras`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d atras`;
  return formatDate(iso);
}

export function todayISO() {
  return new Date().toISOString();
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
