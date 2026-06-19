import { useState } from 'react';
import { ExternalLink, MapPin, Users, Rocket, Building, Search } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | 'early-stage'
  | 'early-scale-up'
  | 'scale-up'
  | 'mid-sized'
  | 'boutique-consulting'
  | 'multinational-irish-hub';

interface CyberCompany {
  id: string;
  name: string;
  stage: Stage;
  founded: number;
  hq: string;
  offices: string[];
  what_they_do: string;
  focus_areas: string[];
  team_size: string;
  funding_stage: string;
  sponsor_friendly: boolean;
  english_workplace: boolean;
  careers_url: string;
  company_url: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<Stage, string> = {
  'early-stage': 'Early Stage',
  'early-scale-up': 'Early Scale-up',
  'scale-up': 'Scale-up',
  'mid-sized': 'Mid-sized',
  'boutique-consulting': 'Boutique Consulting',
  'multinational-irish-hub': 'Multinational (Irish Hub)',
};

const STAGE_STYLES: Record<Stage, string> = {
  'early-stage': 'bg-rose-100 text-rose-700',
  'early-scale-up': 'bg-orange-100 text-orange-700',
  'scale-up': 'bg-amber-100 text-amber-700',
  'mid-sized': 'bg-blue-100 text-blue-700',
  'boutique-consulting': 'bg-purple-100 text-purple-700',
  'multinational-irish-hub': 'bg-zinc-200 text-zinc-700',
};

const ALL_FOCUS_AREAS = [
  'All focus areas',
  'SOC',
  'Pentesting',
  'Red Team',
  'AppSec',
  'GRC',
  'Cloud Security',
  'Identity',
  'Threat Intelligence',
  'Incident Response',
  'Email Security',
  'Vulnerability Management',
  'Cryptography',
  'Telecom Security',
];

// ─── Main route ───────────────────────────────────────────────────────────────

export default function IrishCyberStartups() {
  const { data: companies, loading, error } = useStaticData<CyberCompany[]>('data/irish-cyber-startups.json');

  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all');
  const [focusFilter, setFocusFilter] = useState<string>('All focus areas');
  const [sponsorOnly, setSponsorOnly] = useState(false);
  const [hideMultinational, setHideMultinational] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = (companies ?? []).filter((c) => {
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (focusFilter !== 'All focus areas' && !c.focus_areas.some((f) => f.toLowerCase().includes(focusFilter.toLowerCase()))) return false;
    if (sponsorOnly && !c.sponsor_friendly) return false;
    if (hideMultinational && c.stage === 'multinational-irish-hub') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = `${c.name} ${c.hq} ${c.what_they_do} ${c.focus_areas.join(' ')} ${c.notes}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalSponsor = (companies ?? []).filter((c) => c.sponsor_friendly).length;
  const totalStartups = (companies ?? []).filter((c) => c.stage !== 'multinational-irish-hub').length;

  // Group by stage for display
  const grouped: { stage: Stage; items: CyberCompany[] }[] = (
    Object.keys(STAGE_LABELS) as Stage[]
  )
    .map((s) => ({ stage: s, items: filtered.filter((c) => c.stage === s) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Irish Cyber Companies</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Curated directory of cybersecurity-focused employers based in Ireland.
            Startups, scale-ups, mid-sized, and multinational Irish hubs.
          </p>
        </div>
        <Rocket size={28} className="mt-1 shrink-0 text-emerald-500" />
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Total</p>
          <p className="text-lg font-bold text-zinc-900">{companies?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Startups + mid-size</p>
          <p className="text-lg font-bold text-zinc-900">{totalStartups}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Sponsor-friendly</p>
          <p className="text-lg font-bold text-emerald-700">{totalSponsor}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400">Showing</p>
          <p className="text-lg font-bold text-zinc-900">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="rounded-lg border border-zinc-200 bg-white pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 w-52"
            placeholder="Search company or focus…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | 'all')}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          <option value="all">All stages</option>
          {(Object.keys(STAGE_LABELS) as Stage[]).map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={focusFilter}
          onChange={(e) => setFocusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        >
          {ALL_FOCUS_AREAS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={sponsorOnly}
            onChange={(e) => setSponsorOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          Sponsor-friendly only
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={hideMultinational}
            onChange={(e) => setHideMultinational(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          Startups + mid-size only
        </label>
      </div>

      {/* Tip banner */}
      <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
        <strong>Where to start:</strong> Tines, Edgescan, Smarttech247, Integrity360, Ekco, Enea AdaptiveMobile, and Threatscape are the highest-yield first-job targets if you want pure Irish cybersecurity.
        For broader engineering reach with strong sponsor pipelines: IBM Security, Mastercard Cyber, Akamai, Cisco, Okta, Mandiant.
      </div>

      {loading && <p className="mt-6 text-sm text-zinc-400">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-500">Failed to load: {error}</p>}

      {/* Grouped company cards */}
      {!loading && !error && (
        <div className="mt-6 space-y-8">
          {grouped.map(({ stage, items }) => (
            <div key={stage}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STAGE_STYLES[stage]}`}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className="text-xs text-zinc-400">({items.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((c) => (
                  <div key={c.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-zinc-900">{c.name}</p>
                          <span className="text-[10px] text-zinc-400">est. {c.founded}</span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                          <MapPin size={10} />
                          {c.hq}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {c.sponsor_friendly && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700">sponsor-friendly</span>
                        )}
                        {c.english_workplace && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-medium text-blue-700">English</span>
                        )}
                      </div>
                    </div>

                    {/* What they do */}
                    <p className="text-xs text-zinc-700 leading-relaxed">{c.what_they_do}</p>

                    {/* Focus areas */}
                    <div className="flex flex-wrap gap-1">
                      {c.focus_areas.map((f) => (
                        <span key={f} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">{f}</span>
                      ))}
                    </div>

                    {/* Size + funding row */}
                    <div className="grid grid-cols-2 gap-2 rounded-md bg-zinc-50 px-3 py-2 text-[11px]">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-zinc-400">Team</p>
                        <p className="flex items-center gap-1 text-zinc-700 font-medium">
                          <Users size={9} />
                          {c.team_size}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-zinc-400">Stage</p>
                        <p className="flex items-center gap-1 text-zinc-700 font-medium">
                          <Building size={9} />
                          {c.funding_stage}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    <p className="text-xs text-zinc-500 leading-relaxed italic">{c.notes}</p>

                    {/* Links */}
                    <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
                      <a
                        href={c.company_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
                      >
                        Company <ExternalLink size={10} />
                      </a>
                      <a
                        href={c.careers_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-400"
                      >
                        Careers <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              No companies match these filters. Try clearing the focus area or unticking sponsor-only.
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-zinc-400">
        Coverage: Irish-founded cybersecurity startups, mid-sized Irish security services firms, and multinationals with substantial cybersecurity engineering presence in Ireland.
        Team sizes and funding stages are approximate — verify before relying on them in salary negotiations.
        Sponsor-friendly = company is known to issue CSEP/GEP for non-EU candidates, but always confirm per role.
      </p>
    </div>
  );
}
