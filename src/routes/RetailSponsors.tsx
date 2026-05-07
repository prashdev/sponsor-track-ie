import { useState } from 'react';
import { ExternalLink, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';

interface RetailSponsor {
  id: string;
  name: string;
  website: string;
  careers_url: string;
  sector: string;
  roles: string[];
  dublin_office: boolean;
  locations: string[];
  notes: string;
  sponsor_confidence: 'high' | 'medium' | 'low';
}

const CONFIDENCE_STYLES: Record<RetailSponsor['sponsor_confidence'], string> = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-600',
};

const CONFIDENCE_LABELS: Record<RetailSponsor['sponsor_confidence'], string> = {
  high: 'High confidence',
  medium: 'Verify first',
  low: 'Unconfirmed',
};

const SECTORS = [
  'All',
  'BPO / Customer Experience',
  'Tech / E-Commerce',
  'Tech / Consumer Electronics',
  'Telecommunications',
  'Media / Telecommunications',
  'Retail / Grocery',
  'Retail / Fashion',
  'Gaming / Betting',
  'Financial Services / FinTech',
  'IT Services / Tech',
];

export default function RetailSponsors() {
  const { data: sponsors, loading, error } = useStaticData<RetailSponsor[]>('data/retail-sponsors.json');
  const [sector, setSector] = useState('All');
  const [dublinOnly, setDublinOnly] = useState(false);
  const [confFilter, setConfFilter] = useState<'all' | 'high' | 'medium'>('all');

  const filtered = (sponsors ?? []).filter((s) => {
    if (sector !== 'All' && s.sector !== sector) return false;
    if (dublinOnly && !s.dublin_office) return false;
    if (confFilter !== 'all' && s.sponsor_confidence !== confFilter) return false;
    return true;
  });

  const highCount = (sponsors ?? []).filter((s) => s.sponsor_confidence === 'high').length;

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Fallback Roles</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Retail &amp; customer service companies known to sponsor Irish work permits.
          </p>
        </div>
        <ShoppingBag size={28} className="mt-1 shrink-0 text-zinc-300" />
      </div>

      {/* Warning banner */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">GEP-only route — use only if the security track stalls.</p>
          <p className="mt-1 text-xs text-amber-700">
            These roles use the General Employment Permit (€36,605+ minimum). That's{' '}
            <strong>57 months to Stamp 4</strong> vs 21 months via CSEP. Every month you spend on GEP is
            3 extra months before you get residency. With a December 2026 visa expiry, treat these as
            the option of last resort — viable if you have less than 3 months left and the security
            route hasn't landed.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
        >
          {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex gap-1.5">
          {(['all', 'high', 'medium'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setConfFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                confFilter === v ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {v === 'all' ? 'All confidence' : v === 'high' ? `High (${highCount})` : 'Verify first'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={dublinOnly}
            onChange={(e) => setDublinOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          Dublin office only
        </label>

        <span className="ml-auto text-xs text-zinc-400">{filtered.length} companies</span>
      </div>

      {/* Cards */}
      {loading && <p className="mt-6 text-sm text-zinc-400">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-500">Failed to load: {error}</p>}

      {!loading && !error && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{s.name}</p>
                  <p className="text-xs text-zinc-500">{s.sector}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_STYLES[s.sponsor_confidence]}`}>
                  {CONFIDENCE_LABELS[s.sponsor_confidence]}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {s.roles.map((r) => (
                  <span key={r} className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">{r}</span>
                ))}
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">{s.notes}</p>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {s.locations.map((loc) => (
                    <span key={loc} className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{loc}</span>
                  ))}
                </div>
                <a
                  href={s.careers_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  Careers <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-2 rounded-lg border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500">
              No companies match these filters.
            </div>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-zinc-400">
        Confidence ratings: <strong>High</strong> = known to sponsor regularly ·{' '}
        <strong>Verify first</strong> = has sponsored in the past, confirm with recruiter ·{' '}
        <strong>Unconfirmed</strong> = large employer, sponsorship not publicly confirmed.
        Always cross-check against the{' '}
        <a href="https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/trusted-partner-initiative/" target="_blank" rel="noreferrer" className="underline hover:text-zinc-700">
          DETE Trusted Partner list
        </a>{' '}
        before investing time in an application.
      </p>
    </div>
  );
}
