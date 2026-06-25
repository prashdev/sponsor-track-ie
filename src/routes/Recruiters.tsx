import { useState } from 'react';
import {
  Phone, Mail, ExternalLink, Copy, Check, ChevronDown, ChevronUp,
  PhoneCall, MapPin, UserSearch, FileUp, AlertCircle, Briefcase, Search,
} from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agency {
  id: string;
  agency: string;
  verified: string;
  website: string;
  main_phone: string;
  main_email: string;
  hq_address: string;
  linkedin_company: string;
  linkedin_people_search: string;
  cv_submission_url: string;
  live_jobs_url: string;
  contact_form_url: string;
  specialisms: string[];
  description: string;
  sponsor_aware: boolean;
  tier: 'tier-1' | 'tier-2' | 'tier-3';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<Agency['tier'], string> = {
  'tier-1': 'Start here (largest + most active)',
  'tier-2': 'Strong specialists',
  'tier-3': 'Supplementary / volume',
};

const TIER_STYLES: Record<Agency['tier'], string> = {
  'tier-1': 'bg-emerald-100 text-emerald-700',
  'tier-2': 'bg-blue-100 text-blue-700',
  'tier-3': 'bg-zinc-100 text-zinc-600',
};

const ALL_SPECIALISMS = [
  'All',
  'Cybersecurity',
  'IT Support',
  'GRC',
  'Sales',
  'Operations',
  'Financial Services',
  'Cloud Engineering',
  'DevSecOps',
];

const CALL_TEMPLATES = [
  {
    id: 'call-security',
    label: 'Phone — Security Role',
    type: 'call' as const,
    template: `Hi, this is Prashik Kamble — I'm a cybersecurity engineer based in Dublin with around 3 years of experience in application security, penetration testing, and API security. I recently came across your agency on LinkedIn and wanted to reach out about cybersecurity opportunities.

I'm currently looking for a full-time role — ideally an Application Security Engineer or Penetration Tester position. I hold an MSc in Cybersecurity from the National College of Ireland. I need a role that comes with a Critical Skills Employment Permit, so I'm specifically looking at companies on the DETE Trusted Partner list with salaries at or above the CSEP threshold (€40,904+).

Could you let me know who handles cybersecurity placements at the agency, and the best email or phone number to send my CV across?

Thanks very much for your time.`,
  },
  {
    id: 'email-security',
    label: 'Email — Security Role',
    type: 'email' as const,
    template: `Subject: Cybersecurity Engineer — Seeking CSEP-Sponsored Role in Dublin

Hi,

I'm Prashik Kamble, a cybersecurity engineer based in Dublin with ~3 years of experience across application security, penetration testing, API security, and SAST/DAST tooling. I hold an MSc in Cybersecurity from the National College of Ireland.

I'm currently seeking a full-time role as an Application Security Engineer, Penetration Tester, or similar — and I require Critical Skills Employment Permit sponsorship.

Key background:
• AppSec: OWASP Top 10, Burp Suite, SAST/DAST tooling, security code reviews
• Pentesting: web app and API, vulnerability assessments, responsible disclosure (Nokia + Government of India Hall of Fame)
• Sectors: telecom, financial services
• Additional: AI/LLM security, ISO 27001 fundamentals, DORA basics

Could you let me know who the right contact is for cybersecurity placements at your agency, or please forward this to that person? I've attached my CV.

Best regards,
Prashik Kamble
prashikk6@gmail.com | LinkedIn: https://www.linkedin.com/in/prashik-kamble/`,
  },
  {
    id: 'call-it-support',
    label: 'Phone — IT Support / Service Desk',
    type: 'call' as const,
    template: `Hi, this is Prashik Kamble — I'm an IT and cybersecurity professional based in Dublin with around 3 years of hands-on experience.

I'm open to IT Support, Service Desk, or Technical Support positions — particularly at companies that can sponsor a General Employment Permit. I hold an MSc in Cybersecurity and I'm technically strong across networking basics, Windows environments, and security tooling.

Could you let me know who handles IT support placements at the agency and the best email to send my CV to? I'm available immediately.

Thank you for your time.`,
  },
  {
    id: 'email-it-support',
    label: 'Email — IT Support / Service Desk',
    type: 'email' as const,
    template: `Subject: IT Support / Service Desk Professional — Open to GEP Sponsorship

Hi,

I'm Prashik Kamble, a Dublin-based IT and cybersecurity professional with ~3 years of experience. I'm currently seeking a permanent IT Support or Service Desk role with General Employment Permit sponsorship.

Background:
• IT troubleshooting, Windows/Mac environments, Active Directory basics
• Cybersecurity awareness: SIEM tools, endpoint security, incident triage
• Strong communication skills — comfortable in customer-facing tech support
• MSc Cybersecurity, National College of Ireland
• Available immediately

I'm targeting companies on the DETE employer list that sponsor GEP for IT roles. Could you let me know who handles these placements at your agency? CV attached.

Best regards,
Prashik Kamble
prashikk6@gmail.com | LinkedIn: https://www.linkedin.com/in/prashik-kamble/`,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Agency card ──────────────────────────────────────────────────────────────

function AgencyCard({ agency }: { agency: Agency }) {
  const [copiedId, copy] = useCopyToClipboard();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-zinc-900">{agency.agency}</p>
            {agency.sponsor_aware && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">sponsor-aware</span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin size={10} /> {agency.hq_address}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${TIER_STYLES[agency.tier]}`}>
          {TIER_LABELS[agency.tier]}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-zinc-700 leading-relaxed">{agency.description}</p>

      {/* Specialisms */}
      <div className="mt-2 flex flex-wrap gap-1">
        {agency.specialisms.map((s) => (
          <span key={s} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">{s}</span>
        ))}
      </div>

      {/* Verified contact methods */}
      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Verified agency contacts</p>

        {/* Phone */}
        <div className="flex items-center gap-2">
          <a
            href={`tel:${agency.main_phone.replace(/\s/g, '')}`}
            className="flex flex-1 items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:border-zinc-400 transition-colors"
          >
            <Phone size={11} className="text-zinc-400" />
            <span className="font-medium">{agency.main_phone}</span>
            <span className="text-zinc-400">· switchboard</span>
          </a>
          <button
            onClick={() => copy(agency.main_phone, `phone-${agency.id}`)}
            className="rounded border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-zinc-700 hover:border-zinc-400"
            title="Copy phone number"
          >
            {copiedId === `phone-${agency.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${agency.main_email}`}
            className="flex flex-1 items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:border-zinc-400 transition-colors"
          >
            <Mail size={11} className="text-zinc-400" />
            <span className="font-medium">{agency.main_email}</span>
            <span className="text-zinc-400">· main inbox</span>
          </a>
          <button
            onClick={() => copy(agency.main_email, `email-${agency.id}`)}
            className="rounded border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:text-zinc-700 hover:border-zinc-400"
            title="Copy email"
          >
            {copiedId === `email-${agency.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
          </button>
        </div>
      </div>

      {/* Live LinkedIn People search — replaces stale baked-in names */}
      <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-700">
          <UserSearch size={11} /> Find current cybersecurity recruiters at this agency
        </p>
        <p className="mt-1 text-xs text-blue-800 leading-relaxed">
          LinkedIn search filtered to the agency's current employees + cybersecurity keyword.
          Always live — never stale.
        </p>
        <a
          href={agency.linkedin_people_search}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Open LinkedIn People search <ExternalLink size={11} />
        </a>
      </div>

      {/* Action links */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={agency.cv_submission_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
        >
          <FileUp size={11} /> Submit CV
        </a>
        <a
          href={agency.live_jobs_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
        >
          <Briefcase size={11} /> Live jobs
        </a>
        <a
          href={agency.linkedin_company}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
        >
          LinkedIn page <ExternalLink size={11} />
        </a>
        <a
          href={agency.contact_form_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400"
        >
          Contact form <ExternalLink size={11} />
        </a>
      </div>

      {/* Verified provenance */}
      <p className="mt-3 text-[10px] italic text-zinc-400">{agency.verified}</p>
    </div>
  );
}

// ─── Templates section ────────────────────────────────────────────────────────

function TemplateSection() {
  const [openId, setOpenId] = useState<string | null>('email-security');
  const [copiedId, copy] = useCopyToClipboard();

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <PhoneCall size={14} className="text-zinc-500" />
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Outreach Templates</p>
      </div>
      <p className="mb-4 text-xs text-zinc-400">
        Use the email templates for the agency's main inbox (info@ / dublin@) — agencies route security CVs to the right consultant.
        Use the phone templates only after you have a named consultant from the LinkedIn search.
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

// ─── Main route ───────────────────────────────────────────────────────────────

export default function Recruiters() {
  const { data: agencies, loading, error } = useStaticData<Agency[]>('data/recruiters.json');
  const [specialism, setSpecialism] = useState('All');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<Agency['tier'] | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'agencies' | 'templates'>('agencies');

  const filtered = (agencies ?? []).filter((a) => {
    if (specialism !== 'All' && !a.specialisms.includes(specialism)) return false;
    if (tierFilter !== 'all' && a.tier !== tierFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.agency.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.specialisms.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group by tier for display
  const grouped: { tier: Agency['tier']; items: Agency[] }[] = (
    ['tier-1', 'tier-2', 'tier-3'] as Agency['tier'][]
  )
    .map((t) => ({ tier: t, items: filtered.filter((a) => a.tier === t) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Recruitment Agencies</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Verified public contacts for Irish recruitment agencies active in cybersecurity, IT support, sales &amp; operations.
        </p>
      </div>

      {/* HONESTY BANNER */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold">Why no personal recruiter names or direct emails are baked in.</p>
          <p className="mt-1">
            Individual recruiters change jobs constantly — names and personal emails go stale within months. Instead of shipping a list of contacts that quietly rots,
            this directory gives you <strong>verified agency-level public info</strong> (main switchboard, official email, HQ address, careers + CV portal)
            plus a <strong>live LinkedIn People search</strong> per agency filtered to current employees + cybersecurity keyword. That search always reflects who actually works there right now.
          </p>
          <p className="mt-1">
            <strong>Recommended workflow:</strong> click "Find current cybersecurity recruiters" → LinkedIn shows you live results → message 2-3 named consultants on LinkedIn directly,
            or call the main switchboard and ask for the cybersecurity desk.
          </p>
        </div>
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
            {tab === 'agencies' ? 'Agencies' : 'Outreach Templates'}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && <TemplateSection />}

      {activeTab === 'agencies' && (
        <>
          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search agency or specialism…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white pl-7 pr-3 py-1.5 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 w-52"
              />
            </div>
            <select
              value={specialism}
              onChange={(e) => setSpecialism(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {ALL_SPECIALISMS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="flex gap-1.5">
              {(['all', 'tier-1', 'tier-2', 'tier-3'] as const).map((t) => (
                <button key={t} onClick={() => setTierFilter(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    tierFilter === t ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}>
                  {t === 'all' ? 'All tiers' : t === 'tier-1' ? 'Start here' : t === 'tier-2' ? 'Specialists' : 'Supplementary'}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-zinc-400">
              {filtered.length} {filtered.length === 1 ? 'agency' : 'agencies'}
            </span>
          </div>

          {/* Loading / error */}
          {loading && <p className="mt-6 text-sm text-zinc-400">Loading…</p>}
          {error && <p className="mt-6 text-sm text-red-500">Failed to load: {error}</p>}

          {/* Grouped agency list */}
          {!loading && !error && (
            <div className="mt-5 space-y-6">
              {grouped.map(({ tier, items }) => (
                <div key={tier}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_STYLES[tier]}`}>
                      {TIER_LABELS[tier]}
                    </span>
                    <span className="text-xs text-zinc-400">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {items.map((a) => <AgencyCard key={a.id} agency={a} />)}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
                  No agencies match these filters.
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-xs text-zinc-400">
            All phone numbers, emails, and addresses are the agency's public business contacts as listed on their own websites.
            Tier-1 agencies are the largest and most active in cybersecurity placements — start there.
            Always confirm CSEP/GEP sponsorship potential during the first conversation, not after.
          </p>
        </>
      )}
    </div>
  );
}
