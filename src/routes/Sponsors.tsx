import { useState } from 'react';
import { ExternalLink, Plus, Search } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';
import { useAppState } from '../hooks/useLocalStorage';
import type { Sponsor } from '../lib/types';

const PERMIT_COLORS: Record<string, string> = {
  CSEP: 'bg-emerald-100 text-emerald-700',
  GEP: 'bg-blue-100 text-blue-700',
  unverified: 'bg-zinc-100 text-zinc-500',
};

export default function Sponsors() {
  const { data: sponsors, loading, error } = useStaticData<Sponsor[]>('data/sponsors.json');
  const [, setState] = useAppState();

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [dublinOnly, setDublinOnly] = useState(false);
  const [permitFilter, setPermitFilter] = useState('all');

  const [pendingName, setPendingName] = useState('');
  const [pendingWebsite, setPendingWebsite] = useState('');
  const [pendingJson, setPendingJson] = useState('');

  if (loading) return <div className="text-sm text-zinc-500">Loading sponsors…</div>;
  if (error || !sponsors) return <div className="text-sm text-red-500">Failed to load sponsors: {error}</div>;

  const allSectors = Array.from(new Set(sponsors.flatMap((s) => s.sectors))).sort();

  const filtered = sponsors.filter((s) => {
    const q = search.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q) && !s.notes.toLowerCase().includes(q) && !s.sectors.join(' ').toLowerCase().includes(q)) return false;
    if (sectorFilter !== 'all' && !s.sectors.includes(sectorFilter)) return false;
    if (dublinOnly && !s.dublin_office) return false;
    if (permitFilter !== 'all' && !s.permit_types.includes(permitFilter)) return false;
    return true;
  });

  function trackSponsor(s: Sponsor) {
    setState((prev) => ({
      ...prev,
      jobs: [
        ...prev.jobs,
        {
          id: `j-${Date.now()}`,
          company: s.name,
          role: '',
          source_url: s.careers_url,
          sponsor_confirmed: !s.permit_types.includes('unverified'),
          permit_type_target: s.permit_types.includes('CSEP') ? 'CSEP' : s.permit_types.includes('GEP') ? 'GEP' : 'Unknown',
          salary_eur: null,
          applied_on: null,
          status: 'saved',
          next_action: '',
          next_action_due: null,
          notes: s.notes,
        },
      ],
    }));
    alert(`Added ${s.name} to Jobs as a draft. Set the role and details there.`);
  }

  function suggestSponsor() {
    if (!pendingName || !pendingWebsite) return;
    const entry = {
      name: pendingName,
      website: pendingWebsite,
      careers_url: '',
      sectors: [],
      permit_types: ['unverified'],
      dublin_office: false,
      notes: 'User-suggested. Verify before trusting.',
      source_verified_on: new Date().toISOString().slice(0, 10),
    };
    setPendingJson(JSON.stringify(entry, null, 2));
    setPendingName('');
    setPendingWebsite('');
  }

  return (
    <div className="max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Sponsors</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {sponsors.length} companies &mdash; {filtered.length} matching filters
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="all">All sectors</option>
          {allSectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
          value={permitFilter}
          onChange={(e) => setPermitFilter(e.target.value)}
        >
          <option value="all">All permit types</option>
          <option value="CSEP">CSEP</option>
          <option value="GEP">GEP</option>
          <option value="unverified">Unverified</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={dublinOnly}
            onChange={(e) => setDublinOnly(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-800"
          />
          Dublin office only
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Company</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Sectors</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Permits</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Dublin</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Notes</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map((s) => (
              <tr key={s.name} className="bg-white hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">
                  <div className="flex items-center gap-2">
                    {s.name}
                    <a href={s.website} target="_blank" rel="noreferrer">
                      <ExternalLink size={12} className="text-zinc-400 hover:text-zinc-700" />
                    </a>
                  </div>
                  <a
                    href={s.careers_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block text-xs text-blue-600 hover:underline"
                  >
                    Careers page →
                  </a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.sectors.map((sec) => (
                      <span key={sec} className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{sec}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.permit_types.map((p) => (
                      <span key={p} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PERMIT_COLORS[p] ?? 'bg-zinc-100 text-zinc-500'}`}>{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">{s.dublin_office ? '✓ Yes' : '—'}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-zinc-500">{s.notes}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => trackSponsor(s)}
                    className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Plus size={12} /> Track
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No companies match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-800">Suggest a Sponsor</h2>
        <p className="mt-1 text-xs text-zinc-500">Generates a JSON snippet you can paste into data/sponsors.json and commit.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            className="input w-48"
            placeholder="Company name"
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
          />
          <input
            className="input w-64"
            placeholder="https://company.com"
            value={pendingWebsite}
            onChange={(e) => setPendingWebsite(e.target.value)}
          />
          <button onClick={suggestSponsor} className="btn-secondary">Generate JSON</button>
        </div>
        {pendingJson && (
          <pre className="mt-3 overflow-x-auto rounded bg-zinc-50 p-3 text-xs text-zinc-700">{pendingJson}</pre>
        )}
      </div>
    </div>
  );
}
