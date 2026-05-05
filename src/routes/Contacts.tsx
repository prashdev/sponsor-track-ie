import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Plus, Pencil, Trash2, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppState } from '../hooks/useLocalStorage';
import type { Contact } from '../lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const REPLY_LABELS: Record<Contact['reply_status'], string> = {
  no_reply: 'No Reply',
  replied: 'Replied',
  call_booked: 'Call Booked',
  declined: 'Declined',
};

const REPLY_COLORS: Record<Contact['reply_status'], string> = {
  no_reply: 'bg-zinc-100 text-zinc-600',
  replied: 'bg-blue-50 text-blue-700',
  call_booked: 'bg-emerald-50 text-emerald-700',
  declined: 'bg-red-50 text-red-600',
};

const PLATFORM_ICONS: Record<Contact['platform'], string> = {
  linkedin: '🔵',
  email: '📧',
  phone: '📞',
  other: '🔗',
};

const TEMPLATES = [
  {
    label: 'AppSec / Product Security',
    text: `Hi [Name], I'm a security engineer with 3+ years in web app pentesting and API security, currently targeting Application Security roles in Ireland. I came across [Company] on the DETE Trusted Partner list — would love a quick call if you have any relevant openings. Happy to share my CV.`,
  },
  {
    label: 'Penetration Tester',
    text: `Hi [Name], I have 3+ years in penetration testing (web, API, mobile) and recently completed 15+ security assessments at Cubic Telecom in Dublin. I'm targeting pentest roles with work permit sponsorship. Is [Company] currently hiring in this space?`,
  },
  {
    label: 'SOC Analyst',
    text: `Hi [Name], I'm exploring SOC Analyst (L1/L2) opportunities in Dublin with work permit sponsorship. Background in vulnerability management, SAST/DAST, and incident response. Would [Company] be open to a brief conversation?`,
  },
  {
    label: 'AI / LLM Security',
    text: `Hi [Name], I have hands-on experience with LLM security testing (OWASP LLM Top 10, Gandalf, Garak) and I'm targeting AI security roles as the market opens up. Would love to connect if [Company] has relevant openings or is building in this space.`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOverdue(c: Contact): boolean {
  if (!c.follow_up_due) return false;
  if (c.reply_status === 'call_booked' || c.reply_status === 'declined') return false;
  const today = new Date().toISOString().slice(0, 10);
  return c.follow_up_due < today;
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

const EMPTY: Omit<Contact, 'id'> = {
  name: '',
  company: '',
  title: '',
  platform: 'linkedin',
  profile_url: '',
  messaged_on: new Date().toISOString().slice(0, 10),
  reply_status: 'no_reply',
  follow_up_due: null,
  notes: '',
};

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Contact>;
  onSave: (c: Omit<Contact, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Contact, 'id'>>({ ...EMPTY, ...initial });
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">
          {initial.id ? 'Edit Contact' : 'Add Contact'}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} />
          </div>
          <div>
            <label className="label">Their Title</label>
            <input className="input" placeholder="e.g. Tech Recruiter" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Platform</label>
            <select className="input" value={form.platform} onChange={(e) => set('platform', e.target.value as Contact['platform'])}>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Profile / Contact URL</label>
            <input className="input" type="url" value={form.profile_url} onChange={(e) => set('profile_url', e.target.value)} />
          </div>
          <div>
            <label className="label">Messaged On</label>
            <input className="input" type="date" value={form.messaged_on} onChange={(e) => set('messaged_on', e.target.value)} />
          </div>
          <div>
            <label className="label">Reply Status</label>
            <select className="input" value={form.reply_status} onChange={(e) => set('reply_status', e.target.value as Contact['reply_status'])}>
              <option value="no_reply">No Reply</option>
              <option value="replied">Replied</option>
              <option value="call_booked">Call Booked</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          <div>
            <label className="label">Follow-up Due</label>
            <input className="input" type="date" value={form.follow_up_due ?? ''}
              onChange={(e) => set('follow_up_due', e.target.value || null)} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px] resize-none" value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button
            onClick={() => { if (!form.name || !form.company) return; onSave(form); }}
            className="btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function Contacts() {
  const [state, setState] = useAppState();
  const contacts = state.contacts ?? [];
  const [filter, setFilter] = useState<'all' | 'overdue' | 'no_reply' | 'replied'>('all');
  const [editContact, setEditContact] = useState<Partial<Contact> | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = contacts.filter(isOverdue).length;

  const filtered = contacts.filter((c) => {
    if (filter === 'overdue') return isOverdue(c);
    if (filter === 'no_reply') return c.reply_status === 'no_reply';
    if (filter === 'replied') return c.reply_status === 'replied' || c.reply_status === 'call_booked';
    return true;
  });

  function saveContact(data: Omit<Contact, 'id'>) {
    setState((prev) => {
      const list = prev.contacts ?? [];
      const existing = editContact?.id ? list.find((c) => c.id === editContact.id) : null;
      return {
        ...prev,
        contacts: existing
          ? list.map((c) => (c.id === existing.id ? { ...data, id: c.id } : c))
          : [...list, { ...data, id: `ct-${Date.now()}` }],
      };
    });
    setEditContact(null);
  }

  function deleteContact(id: string) {
    if (!confirm('Delete this contact?')) return;
    setState((prev) => ({ ...prev, contacts: (prev.contacts ?? []).filter((c) => c.id !== id) }));
  }

  function copyTemplate(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Contacts</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {contacts.length} contacts —{' '}
            {overdueCount > 0
              ? <span className="font-medium text-red-600">{overdueCount} follow-up{overdueCount > 1 ? 's' : ''} overdue</span>
              : 'none overdue'}
          </p>
        </div>
        <button onClick={() => setEditContact({})} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Contact
        </button>
      </div>

      {/* Templates */}
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <button
          onClick={() => setShowTemplates((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-zinc-50"
        >
          <span className="text-sm font-medium text-zinc-700">Cold Outreach Templates</span>
          {showTemplates ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </button>
        {showTemplates && (
          <div className="border-t border-zinc-100 divide-y divide-zinc-100">
            {TEMPLATES.map((t) => (
              <div key={t.label} className="px-5 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-600">{t.label}</span>
                  <button
                    onClick={() => copyTemplate(t.text, t.label)}
                    className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400 transition-colors"
                  >
                    {copied === t.label
                      ? <><Check size={11} className="text-emerald-600" /> Copied</>
                      : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-zinc-500">{t.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['all', 'All'],
            ['overdue', overdueCount > 0 ? `Overdue (${overdueCount})` : 'Overdue'],
            ['no_reply', 'No Reply'],
            ['replied', 'Replied / Call'],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === val
                ? val === 'overdue' && overdueCount > 0 ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'
                : val === 'overdue' && overdueCount > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
            {contacts.length === 0
              ? "No contacts yet. Add recruiters and hiring managers you've messaged."
              : 'No contacts match this filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Company</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Platform</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Messaged</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Follow-up</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => {
                  const overdue = isOverdue(c);
                  const daysUntil = c.follow_up_due
                    ? differenceInDays(parseISO(c.follow_up_due), new Date())
                    : null;
                  return (
                    <tr key={c.id} className={`bg-white hover:bg-zinc-50 ${overdue ? 'border-l-2 border-l-red-400' : ''}`}>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          {c.name}
                          {c.profile_url && (
                            <a href={c.profile_url} target="_blank" rel="noreferrer">
                              <ExternalLink size={11} className="text-zinc-400 hover:text-zinc-700" />
                            </a>
                          )}
                        </div>
                        {c.title && <p className="text-xs text-zinc-400">{c.title}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{c.company}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {PLATFORM_ICONS[c.platform]}{' '}
                        {c.platform.charAt(0).toUpperCase() + c.platform.slice(1)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-500">
                        {format(parseISO(c.messaged_on), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REPLY_COLORS[c.reply_status]}`}>
                          {REPLY_LABELS[c.reply_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.follow_up_due ? (
                          <span className={
                            overdue ? 'font-medium text-red-600'
                            : daysUntil !== null && daysUntil <= 1 ? 'text-amber-600'
                            : 'text-zinc-500'
                          }>
                            {overdue
                              ? `${Math.abs(daysUntil ?? 0)}d overdue`
                              : c.follow_up_due === today
                              ? 'Today'
                              : format(parseISO(c.follow_up_due), 'dd MMM')}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditContact(c)} className="text-zinc-400 hover:text-zinc-700">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteContact(c.id)} className="text-zinc-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editContact !== null && (
        <ContactForm initial={editContact} onSave={saveContact} onCancel={() => setEditContact(null)} />
      )}
    </div>
  );
}
