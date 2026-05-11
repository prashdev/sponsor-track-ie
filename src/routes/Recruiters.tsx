import { useState } from 'react';
import { Phone, Mail, ExternalLink, Copy, Check, ChevronDown, ChevronUp, PhoneCall } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecruiterContact {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  specialism: string;
}

interface Agency {
  id: string;
  agency: string;
  website: string;
  specialisms: string[];
  description: string;
  contacts: RecruiterContact[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_SPECIALISMS = [
  'All',
  'Cybersecurity',
  'IT Support',
  'GRC',
  'Sales',
  'Operations',
  'Financial Services',
  'Cloud Security',
];

const CALL_TEMPLATES = [
  {
    id: 'call-security',
    label: 'Phone — Security Role',
    type: 'call' as const,
    template: `Hi, is this [Recruiter Name]?

Hi [Name], my name is Prashik Kamble — I'm a cybersecurity engineer based in Dublin with about 3 years of experience in application security, penetration testing, and API security. I recently came across your profile / your agency and wanted to reach out directly.

I'm currently looking for a full-time role — ideally an Application Security Engineer or Penetration Tester position. I hold an MSc in Cybersecurity from the National College of Ireland, and I need a role that comes with a Critical Skills Employment Permit sponsorship.

I wanted to ask — are you currently working on any security-focused roles in Dublin or Cork, or with companies that are on the DETE Trusted Partner list?

[If yes] — Excellent. Could I send you my CV? What's the best email to reach you on?
[If no / nothing right now] — Completely understand. Would it be alright if I sent you my CV anyway so you have it on file? I'm actively looking and would appreciate being contacted if something comes up.

Thanks very much for your time.`,
  },
  {
    id: 'email-security',
    label: 'Email — Security Role',
    type: 'email' as const,
    template: `Subject: Cybersecurity Engineer — Seeking CSEP-Sponsored Role in Dublin

Hi [Name],

I'm Prashik Kamble, a cybersecurity engineer based in Dublin with ~3 years of experience across application security, penetration testing, API security, and SAST/DAST tooling. I hold an MSc in Cybersecurity from the National College of Ireland.

I'm currently seeking a full-time role as an Application Security Engineer, Penetration Tester, or similar — and I require Critical Skills Employment Permit sponsorship.

Key background:
• AppSec: OWASP Top 10, Burp Suite, SAST/DAST tooling, security code reviews
• Pentesting: web app and API, vulnerability assessments, responsible disclosure (Nokia + Government of India Hall of Fame)
• Sectors: telecom, financial services
• Additional: AI/LLM security, ISO 27001 fundamentals, DORA basics

I'd appreciate a conversation if you're currently working with companies looking for security talent, particularly those on the DETE Trusted Partner / Critical Skills sponsor list.

I've attached my CV. Happy to connect on a call at your convenience.

Best regards,
Prashik Kamble
prashikk6@gmail.com | LinkedIn: https://www.linkedin.com/in/prashik-kamble/`,
  },
  {
    id: 'call-it-support',
    label: 'Phone — IT Support / Service Desk',
    type: 'call' as const,
    template: `Hi, is this [Recruiter Name]?

Hi [Name], my name is Prashik Kamble — I'm an IT and cybersecurity professional based in Dublin. I have around 3 years of hands-on experience, currently looking for a permanent role.

I'm open to IT Support, Service Desk, or Technical Support positions — particularly at companies that can sponsor a General Employment Permit. I hold an MSc in Cybersecurity and I'm technically strong across networking basics, Windows environments, and security tooling.

Do you have anything suitable at the moment, or are you working with companies that regularly sponsor non-EEA candidates?

[If yes] — Great. I can send you my CV right away. What's the best email?
[If no] — Could I send my CV to have on file? I'm available immediately and can start quickly.

Thank you for your time.`,
  },
  {
    id: 'email-it-support',
    label: 'Email — IT Support / Service Desk',
    type: 'email' as const,
    template: `Subject: IT Support / Service Desk Professional — Available Now, Open to GEP Sponsorship

Hi [Name],

I'm Prashik Kamble, a Dublin-based IT and cybersecurity professional with ~3 years of experience. I'm currently seeking a permanent IT Support or Service Desk role with General Employment Permit sponsorship.

Background:
• IT troubleshooting, Windows/Mac environments, Active Directory basics
• Cybersecurity awareness: SIEM tools, endpoint security, incident triage
• Strong communication skills — comfortable in customer-facing tech support
• MSc Cybersecurity, National College of Ireland
• Available immediately

I'm targeting companies on the DETE employer list that sponsor GEP for IT roles. If you're placing candidates in similar positions, I'd welcome a brief call.

CV attached.

Best regards,
Prashik Kamble
prashikk6@gmail.com | LinkedIn: https://www.linkedin.com/in/prashik-kamble/`,
  },
  {
    id: 'email-sales-ops',
    label: 'Email — Sales / Operations',
    type: 'email' as const,
    template: `Subject: Sales / Operations Professional — Seeking GEP-Sponsored Role in Dublin

Hi [Name],

I'm Prashik Kamble, based in Dublin with experience in technical environments and customer-facing operations. I'm currently seeking a Sales or Operations role at a company that sponsors the General Employment Permit.

I combine strong analytical skills with solid communication and can contribute quickly in sales support, operations coordination, or customer success roles — particularly in tech, SaaS, or cybersecurity-adjacent companies where my domain knowledge is an asset.

If you're working with GEP-approved employers in Dublin, I'd appreciate a brief conversation.

CV attached. Happy to chat at your convenience.

Best regards,
Prashik Kamble
prashikk6@gmail.com | LinkedIn: https://www.linkedin.com/in/prashik-kamble/`,
  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function useCopyToClipboard(): [string | null, (text: string, id: string) => void] {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }
  return [copiedId, copy];
}

function ContactRow({ contact }: { contact: RecruiterContact }) {
  const [copiedId, copy] = useCopyToClipboard();

  return (
    <div className="flex flex-col gap-2 rounded-md border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{contact.name}</p>
          <p className="text-xs text-zinc-500">{contact.title}</p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{contact.specialism}</p>
        </div>
        {contact.linkedin && (
          <a
            href={contact.linkedin}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            LinkedIn <ExternalLink size={10} />
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`tel:${contact.phone.replace(/\s/g, '')}`}
          className="flex items-center gap-1.5 rounded bg-white border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700 hover:border-zinc-400 transition-colors"
        >
          <Phone size={11} className="text-zinc-400" />
          {contact.phone}
        </a>
        <div className="flex items-center gap-1">
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1.5 rounded bg-white border border-zinc-200 px-2.5 py-1 text-xs text-zinc-700 hover:border-zinc-400 transition-colors"
          >
            <Mail size={11} className="text-zinc-400" />
            {contact.email}
          </a>
          <button
            onClick={() => copy(contact.email, `email-${contact.name}`)}
            className="rounded border border-zinc-200 bg-white p-1 text-zinc-400 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
            title="Copy email"
          >
            {copiedId === `email-${contact.name}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgencyCard({ agency }: { agency: Agency }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 transition-colors">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-zinc-50"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">{agency.agency}</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500">
              {agency.contacts.length} contact{agency.contacts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {agency.specialisms.map((s) => (
              <span key={s} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{s}</span>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed line-clamp-2">{agency.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 mt-0.5">
          <a
            href={agency.website}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700"
          >
            Website <ExternalLink size={10} />
          </a>
          {expanded ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
        </div>
      </button>

      {/* Contacts */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Direct Contacts</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {agency.contacts.map((c) => (
              <ContactRow key={c.name} contact={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateSection() {
  const [openId, setOpenId] = useState<string | null>('call-security');
  const [copiedId, copy] = useCopyToClipboard();

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <PhoneCall size={14} className="text-zinc-500" />
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Call & Email Templates</p>
      </div>
      <p className="mb-4 text-xs text-zinc-400">
        Replace <span className="rounded bg-amber-100 px-1 text-amber-700 font-mono">[Name]</span> and <span className="rounded bg-amber-100 px-1 text-amber-700 font-mono">[Recruiter Name]</span> before using.
        CSEP target = security roles. GEP fallback = IT support, sales, ops.
      </p>
      <div className="space-y-2">
        {CALL_TEMPLATES.map((t) => (
          <div key={t.id} className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <button
              onClick={() => setOpenId(openId === t.id ? null : t.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
            >
              <div className="flex items-center gap-2">
                {t.type === 'call' ? (
                  <Phone size={13} className="text-zinc-400" />
                ) : (
                  <Mail size={13} className="text-zinc-400" />
                )}
                <span className="text-sm font-medium text-zinc-800">{t.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  t.type === 'call' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {t.type === 'call' ? 'Call script' : 'Email'}
                </span>
              </div>
              {openId === t.id ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
            </button>
            {openId === t.id && (
              <div className="border-t border-zinc-100 px-4 pb-4 pt-3">
                <pre className="whitespace-pre-wrap rounded-md bg-zinc-50 border border-zinc-100 p-4 text-xs text-zinc-700 font-sans leading-relaxed">
                  {t.template}
                </pre>
                <button
                  onClick={() => copy(t.template, t.id)}
                  className="mt-2 flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {copiedId === t.id ? (
                    <><Check size={12} className="text-emerald-500" /> Copied!</>
                  ) : (
                    <><Copy size={12} /> Copy template</>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function Recruiters() {
  const { data: agencies, loading, error } = useStaticData<Agency[]>('data/recruiters.json');
  const [specialism, setSpecialism] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'agencies' | 'templates'>('agencies');

  const filtered = (agencies ?? []).filter((a) => {
    if (specialism !== 'All' && !a.specialisms.includes(specialism)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.agency.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.contacts.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.specialism.toLowerCase().includes(q)
        )
      );
    }
    return true;
  });

  const totalContacts = filtered.reduce((sum, a) => sum + a.contacts.length, 0);

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Recruitment Agencies</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Irish agencies active in cybersecurity, IT support, sales &amp; operations — with direct recruiter contacts.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-zinc-200">
        {(['agencies', 'templates'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {tab === 'agencies' ? 'Agencies' : 'Call & Email Templates'}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && <TemplateSection />}

      {activeTab === 'agencies' && (
        <>
          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search agencies or recruiters…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-56"
            />
            <select
              value={specialism}
              onChange={(e) => setSpecialism(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {ALL_SPECIALISMS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="ml-auto text-xs text-zinc-400">
              {filtered.length} {filtered.length === 1 ? 'agency' : 'agencies'} · {totalContacts} contacts
            </span>
          </div>

          {/* Tip */}
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
            <span className="font-semibold">Tip:</span> Click an agency card to expand direct recruiter contacts.
            Use the Templates tab for ready-to-use call scripts and emails.
            Always mention <strong>CSEP sponsorship required</strong> upfront to avoid wasting both sides' time.
          </div>

          {/* List */}
          {loading && <p className="mt-6 text-sm text-zinc-400">Loading…</p>}
          {error && <p className="mt-6 text-sm text-red-500">Failed to load: {error}</p>}

          {!loading && !error && (
            <div className="mt-4 space-y-3">
              {filtered.map((a) => (
                <AgencyCard key={a.id} agency={a} />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
                  No agencies match these filters.
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-xs text-zinc-400">
            Contact details sourced from publicly available agency websites and LinkedIn profiles.
            Names and direct lines may change — verify on the agency website before calling.
            Always prioritise the CSEP route; GEP contacts are for fallback scenarios only.
          </p>
        </>
      )}
    </div>
  );
}
