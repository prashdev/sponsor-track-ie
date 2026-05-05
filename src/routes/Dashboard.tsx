import { differenceInDays, format, parseISO, startOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, Building2, BookOpen, Plus, ExternalLink } from 'lucide-react';
import { useAppState } from '../hooks/useLocalStorage';
import { VISA_EXPIRY } from '../lib/constants';
import type { Job } from '../lib/types';

const VISA_EXPIRY_DATE = parseISO(VISA_EXPIRY);

function VisaCountdown() {
  const now = new Date();
  const days = differenceInDays(VISA_EXPIRY_DATE, now);
  const urgency = days < 90 ? 'red' : days < 180 ? 'amber' : 'green';

  const colorMap = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-emerald-600',
  };
  const bgMap = {
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-emerald-50 border-emerald-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${bgMap[urgency]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Visa Expiry</p>
      <p className={`mt-1 text-5xl font-bold tabular-nums ${colorMap[urgency]}`}>{days}</p>
      <p className="mt-1 text-sm font-medium text-zinc-600">
        days remaining &mdash; expires {format(VISA_EXPIRY_DATE, 'dd MMM yyyy')}
      </p>
    </div>
  );
}

function WeeklyChecklist() {
  const [state, setState] = useAppState();
  const { weeklyChecklist } = state;

  const weekLabel = format(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
    'dd MMM yyyy',
  );
  const done = weeklyChecklist.items.filter((i) => i.checked).length;
  const total = weeklyChecklist.items.length;

  function toggle(id: string) {
    setState((prev) => ({
      ...prev,
      weeklyChecklist: {
        ...prev.weeklyChecklist,
        items: prev.weeklyChecklist.items.map((i) =>
          i.id === id ? { ...i, checked: !i.checked } : i,
        ),
      },
    }));
  }

  function addCustomItem(label: string) {
    const id = `custom-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      weeklyChecklist: {
        ...prev.weeklyChecklist,
        items: [...prev.weeklyChecklist.items, { id, label, checked: false }],
      },
    }));
  }

  function handleAddKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val) {
        addCustomItem(val);
        e.currentTarget.value = '';
      }
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Week of {weekLabel}
        </p>
        <span className="text-xs font-medium text-zinc-500">
          {done}/{total} done
        </span>
      </div>

      <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full bg-zinc-800 transition-all"
          style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {weeklyChecklist.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={item.id}
              checked={item.checked}
              onChange={() => toggle(item.id)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
            />
            <label
              htmlFor={item.id}
              className={`text-sm ${item.checked ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}
            >
              {item.label}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <Plus size={14} className="text-zinc-400 shrink-0" />
        <input
          type="text"
          placeholder="Add item (press Enter)"
          onKeyDown={handleAddKey}
          className="w-full rounded border-0 bg-zinc-50 px-2 py-1 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
        />
      </div>
    </div>
  );
}

function NextActionTimeline() {
  const [state] = useAppState();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const withDue = state.jobs
    .filter((j) => j.next_action_due && j.next_action)
    .sort((a, b) => (a.next_action_due ?? '').localeCompare(b.next_action_due ?? ''));

  if (withDue.length === 0) return null;

  const overdue = withDue.filter((j) => j.next_action_due! < today);
  const dueToday = withDue.filter((j) => j.next_action_due === today);
  const upcoming = withDue.filter((j) => j.next_action_due! > today && j.next_action_due! <= in7Days);

  function ActionItem({ job }: { job: Job }) {
    const due = job.next_action_due!;
    const isOv = due < today;
    const isTod = due === today;
    const daysLabel = isOv
      ? `${differenceInDays(now, parseISO(due))}d overdue`
      : isTod
      ? 'Today'
      : `in ${differenceInDays(parseISO(due), now)}d`;

    return (
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${
        isOv ? 'border-red-200 bg-red-50' : isTod ? 'border-amber-200 bg-amber-50' : 'border-zinc-200 bg-white'
      }`}>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
          isOv ? 'bg-red-100 text-red-700' : isTod ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'
        }`}>
          {daysLabel}
        </span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900">{job.company} — {job.role}</p>
          <p className="truncate text-xs text-zinc-500">{job.next_action}</p>
        </div>
        <Link to="/jobs" className="shrink-0 text-zinc-400 hover:text-zinc-700">
          <ExternalLink size={13} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Upcoming Actions</p>
      <div className="mt-3 space-y-2">
        {overdue.map((j) => <ActionItem key={j.id} job={j} />)}
        {dueToday.map((j) => <ActionItem key={j.id} job={j} />)}
        {upcoming.map((j) => <ActionItem key={j.id} job={j} />)}
        {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 && (
          <p className="text-sm text-zinc-400">Nothing due in the next 7 days.</p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );

  return href ? <Link to={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const [state] = useAppState();
  const { jobs, studyLog } = state;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const thisWeekApplied = jobs.filter(
    (j) => j.applied_on && parseISO(j.applied_on) >= weekStart && j.status !== 'saved',
  ).length;

  const thisMonthApplied = jobs.filter((j) => {
    if (!j.applied_on || j.status === 'saved') return false;
    const d = parseISO(j.applied_on);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const studyMinutesThisWeek = studyLog
    .filter((e) => parseISO(e.date) >= weekStart)
    .reduce((sum, e) => sum + e.minutes, 0);

  const totalSponsors = jobs.filter((j) => j.sponsor_confirmed).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {format(now, 'EEEE, dd MMM yyyy')} &mdash; keep moving.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VisaCountdown />
        <WeeklyChecklist />
      </div>

      <div className="mt-4">
        <NextActionTimeline />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          icon={Briefcase}
          label="Applied this week"
          value={thisWeekApplied}
          href="/jobs"
        />
        <MetricCard
          icon={Briefcase}
          label="Applied this month"
          value={thisMonthApplied}
          sub={format(now, 'MMMM yyyy')}
          href="/jobs"
        />
        <MetricCard
          icon={Building2}
          label="Tracked sponsors"
          value={totalSponsors}
          href="/sponsors"
        />
        <MetricCard
          icon={BookOpen}
          label="Study this week"
          value={`${Math.floor(studyMinutesThisWeek / 60)}h ${studyMinutesThisWeek % 60}m`}
          href="/study"
        />
      </div>

      {jobs.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-zinc-700">No jobs tracked yet.</p>
          <p className="mt-1 text-sm text-zinc-500">
            Start by browsing the{' '}
            <Link to="/sponsors" className="font-medium text-zinc-800 underline">
              Sponsors list
            </Link>{' '}
            or{' '}
            <Link to="/jobs" className="font-medium text-zinc-800 underline">
              adding a job manually
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Permit Quick Reference
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-zinc-900">Critical Skills (CSEP)</p>
            <p className="text-zinc-500">€40,904+ &mdash; 21 months to Stamp 4</p>
            <p className="mt-1 text-xs text-zinc-400">Target: AppSec / AI Security roles</p>
          </div>
          <div>
            <p className="font-medium text-zinc-900">General Employment (GEP)</p>
            <p className="text-zinc-500">€36,605+ &mdash; 57 months to Stamp 4</p>
            <p className="mt-1 text-xs text-zinc-400">Fallback for non-CSEP roles</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
        <Clock size={12} />
        <span>Weekly checklist resets every Monday at 00:00 local time.</span>
      </div>
    </div>
  );
}
