import { useState } from 'react';
import { Globe2, ExternalLink, ClipboardList, Briefcase, Users, DollarSign, Calendar, BookOpen, ShieldCheck } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';

interface Resource { label: string; url: string; }
interface SprintPhase { phase: string; items: string[]; }
interface RegionData {
  id: string;
  title: string;
  market_context: string;
  process_norms: string[];
  cultural_notes: string[];
  regulatory_context_to_know?: string[];
  salary_bands?: string[];
  salary_bands_aed_tax_free?: string[];
  common_technical_questions: string[];
  common_behavioural_questions: string[];
  prep_resources: Resource[];
  sprint_plan_2_months: SprintPhase[];
}
interface PrepFile { india: RegionData; uae: RegionData; }

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
        {icon}{title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 list-disc list-outside pl-5 text-xs text-zinc-700 leading-relaxed">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

function RegionView({ data }: { data: RegionData }) {
  const salaryList = data.salary_bands || data.salary_bands_aed_tax_free || [];
  return (
    <div className="space-y-4">
      <Section title="Market Context" icon={<Globe2 size={12} />}>
        <p className="text-xs text-zinc-700 leading-relaxed">{data.market_context}</p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Process Norms" icon={<ClipboardList size={12} />}>
          <BulletList items={data.process_norms} />
        </Section>
        <Section title="Cultural Notes" icon={<Users size={12} />}>
          <BulletList items={data.cultural_notes} />
        </Section>
      </div>

      {data.regulatory_context_to_know && (
        <Section title="Regulatory Context to Know" icon={<ShieldCheck size={12} />}>
          <BulletList items={data.regulatory_context_to_know} />
        </Section>
      )}

      <Section title="Salary Bands" icon={<DollarSign size={12} />}>
        <BulletList items={salaryList} />
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Common Technical Questions" icon={<Briefcase size={12} />}>
          <ol className="space-y-1.5 list-decimal list-outside pl-5 text-xs text-zinc-700 leading-relaxed">
            {data.common_technical_questions.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </Section>
        <Section title="Behavioural Questions" icon={<Users size={12} />}>
          <ol className="space-y-1.5 list-decimal list-outside pl-5 text-xs text-zinc-700 leading-relaxed">
            {data.common_behavioural_questions.map((q, i) => <li key={i}>{q}</li>)}
          </ol>
        </Section>
      </div>

      <Section title="Free Prep Resources" icon={<BookOpen size={12} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.prep_resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:border-zinc-400 hover:text-zinc-900">
              <ExternalLink size={10} className="text-zinc-400 shrink-0" />
              <span className="truncate">{r.label}</span>
            </a>
          ))}
        </div>
      </Section>

      <Section title="8-Week Sprint Plan (2 months to offer)" icon={<Calendar size={12} />}>
        <div className="space-y-3">
          {data.sprint_plan_2_months.map((phase, i) => (
            <div key={i} className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-xs font-bold text-zinc-800">{phase.phase}</p>
              <ul className="mt-1.5 space-y-1 list-disc list-outside pl-5 text-xs text-zinc-700 leading-relaxed">
                {phase.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export default function RegionalPrep() {
  const { data, loading, error } = useStaticData<PrepFile>('data/regional-prep.json');
  const [region, setRegion] = useState<'india' | 'uae'>('india');

  if (loading) return <div className="text-sm text-zinc-400">Loading…</div>;
  if (error || !data) return <div className="text-sm text-red-500">Failed to load: {error}</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Regional Interview Prep</h1>
          <p className="mt-1 text-sm text-zinc-500">
            India + UAE (Dubai / Abu Dhabi) cybersecurity interview prep — market, process, regulatory, sprint plan.
            Calibrated to a 2-month sprint for Associate Security Engineer / AppSec / Product Security / Security Analyst roles.
          </p>
        </div>
        <Globe2 size={28} className="mt-1 shrink-0 text-blue-500" />
      </div>

      <div className="mt-5 flex border-b border-zinc-200">
        {([
          { id: 'india', label: '🇮🇳 India' },
          { id: 'uae', label: '🇦🇪 UAE (Dubai)' },
        ] as const).map((r) => (
          <button key={r.id} onClick={() => setRegion(r.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              region === r.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <h2 className="text-lg font-bold text-zinc-900 mb-3">{data[region].title}</h2>
        <RegionView data={data[region]} />
      </div>
    </div>
  );
}
