import { useState } from 'react';
import { Search, BookOpen, HelpCircle, Tag, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useStaticData } from '../hooks/useStaticData';
import type { Resource } from '../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  topic: string;
  question: string;
  type: 'technical' | 'behavioral' | 'situational';
  difficulty: 'junior' | 'mid' | 'senior';
}

interface TopicMatch {
  topic: string;
  label: string;
  tracks: string[];
  keywords: string[];
  matched: string[];
  score: number;
}

// ─── Keyword map ──────────────────────────────────────────────────────────────

const TOPIC_DEFINITIONS: { topic: string; label: string; tracks: string[]; keywords: string[] }[] = [
  {
    topic: 'appsec',
    label: 'Application Security',
    tracks: ['appsec'],
    keywords: [
      'application security', 'appsec', 'owasp', 'xss', 'sql injection', 'csrf', 'secure coding',
      'sast', 'dast', 'burp', 'web security', 'api security', 'threat model', 'vulnerability assessment',
      'penetration test', 'pentest', 'code review', 'ssrf', 'xxe', 'injection', 'jwt', 'oauth',
      'idor', 'broken access', 'security testing', 'web application', 'product security',
      'application pen', 'secure development', 'security review', 'security engineer',
    ],
  },
  {
    topic: 'soc',
    label: 'SOC Analyst',
    tracks: ['soc'],
    keywords: [
      'soc analyst', 'security operations', 'siem', 'splunk', 'incident response', 'threat hunting',
      'log analysis', 'detection', 'alert triage', 'forensics', 'malware', 'edr',
      'endpoint detection', 'security monitoring', 'threat intelligence', 'mitre', 'playbook',
      'soar', 'security analyst', 'threat detection', 'security incident', 'blue team',
    ],
  },
  {
    topic: 'ai-security',
    label: 'AI / LLM Security',
    tracks: ['ai-security', 'llm-security'],
    keywords: [
      'llm security', 'ai security', 'machine learning security', 'prompt injection',
      'generative ai', 'model security', 'ai red team', 'owasp llm', 'large language model',
      'llm', 'genai', 'adversarial', 'model robustness', 'rag security', 'responsible ai',
    ],
  },
  {
    topic: 'grc',
    label: 'GRC / Compliance',
    tracks: [],
    keywords: [
      'grc', 'iso 27001', 'compliance', 'risk management', 'dora', 'gdpr', 'nist',
      'regulatory', 'audit', 'governance', 'risk assessment', 'iso27001', 'nis2',
      'pci dss', 'third party risk', 'vendor risk', 'policy', 'sox', 'risk analyst',
      'information security management', 'isms',
    ],
  },
  {
    topic: 'cloud',
    label: 'Cloud Security',
    tracks: ['appsec'],
    keywords: [
      'aws', 'azure', 'gcp', 'cloud security', 'iam', 's3', 'kubernetes', 'docker',
      'container security', 'terraform', 'cloud native', 'serverless', 'cloud infrastructure',
      'cloud computing', 'devsecops', 'cspm', 'security posture', 'eks', 'ecs',
    ],
  },
  {
    topic: 'devsecops',
    label: 'DevSecOps',
    tracks: ['appsec'],
    keywords: [
      'devsecops', 'devops', 'ci/cd', 'pipeline security', 'github actions', 'jenkins',
      'sonarqube', 'secret scanning', 'shift left', 'secure sdlc', 'container scanning',
      'supply chain security', 'sbom', 'dependency scanning', 'build pipeline',
    ],
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

function analyzeJd(text: string): TopicMatch[] {
  const lower = text.toLowerCase();
  return TOPIC_DEFINITIONS
    .map((def) => {
      const matched = def.keywords.filter((kw) => lower.includes(kw));
      return { ...def, matched, score: matched.length };
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS = {
  junior: 'bg-emerald-100 text-emerald-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
};

const TYPE_COLORS = {
  technical: 'bg-zinc-100 text-zinc-600',
  behavioral: 'bg-amber-50 text-amber-700',
  situational: 'bg-rose-50 text-rose-700',
};

function QuestionSection({
  title,
  questions,
  defaultOpen = true,
}: {
  title: string;
  questions: Question[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (questions.length === 0) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-zinc-50"
      >
        <span className="text-sm font-semibold text-zinc-800">{title} <span className="ml-1 text-zinc-400 font-normal">({questions.length})</span></span>
        {open ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
      </button>
      {open && (
        <div className="divide-y divide-zinc-100 border-t border-zinc-100">
          {questions.map((q, i) => (
            <div key={q.id} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-xs font-bold tabular-nums text-zinc-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-zinc-800">{q.question}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                      {q.difficulty}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[q.type]}`}>
                      {q.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Route ───────────────────────────────────────────────────────────────

export default function JdAnalyzer() {
  const [jdText, setJdText] = useState('');
  const [results, setResults] = useState<TopicMatch[] | null>(null);

  const { data: allResources } = useStaticData<Resource[]>('data/resources.json');
  const { data: allQuestions } = useStaticData<Question[]>('data/interview-questions.json');

  function analyze() {
    if (!jdText.trim()) return;
    setResults(analyzeJd(jdText));
  }

  // Derived matched data
  const matchedTracks = new Set(results?.flatMap((t) => t.tracks) ?? []);
  const matchedTopics = new Set(results?.map((t) => t.topic) ?? []);

  const matchedResources = allResources
    ? allResources.filter((r) => matchedTracks.has(r.track))
    : [];

  const matchedQuestions = allQuestions
    ? allQuestions.filter((q) => matchedTopics.has(q.topic) || (matchedTopics.size === 0 && q.topic === 'general'))
    : [];

  // Split questions by type
  const technicalQs = matchedQuestions.filter((q) => q.type === 'technical');
  const behavioralQs = matchedQuestions.filter((q) => q.type === 'behavioral');
  const situationalQs = matchedQuestions.filter((q) => q.type === 'situational');

  const noMatch = results !== null && results.length === 0;
  const hasResults = results !== null && results.length > 0;

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">JD Analyzer</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Paste a job description to get matched study resources and interview questions.
        </p>
      </div>

      {/* Input */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <label className="label">Job Description</label>
        <textarea
          className="input mt-1 min-h-[200px] resize-y font-mono text-xs"
          placeholder="Paste the full job description here — requirements, responsibilities, tech stack, nice-to-haves…"
          value={jdText}
          onChange={(e) => {
            setJdText(e.target.value);
            if (results !== null) setResults(null);
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {jdText.length > 0 ? `${jdText.length} characters` : 'No JD pasted yet'}
          </p>
          <button
            onClick={analyze}
            disabled={!jdText.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Search size={15} /> Analyse JD
          </button>
        </div>
      </div>

      {/* No match */}
      {noMatch && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">No recognisable security keywords found.</p>
            <p className="mt-0.5 text-xs text-amber-700">
              The JD may use generic language. Try pasting more of the technical requirements section,
              or check the job title and responsibilities paragraph.
            </p>
          </div>
        </div>
      )}

      {hasResults && (
        <>
          {/* Detected topics */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              <Tag size={11} className="mr-1 inline" />
              Detected Role Focus
            </p>
            <div className="flex flex-wrap gap-2">
              {results!.map((t) => (
                <div
                  key={t.topic}
                  className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs"
                >
                  <span className="font-semibold text-zinc-800">{t.label}</span>
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                    {t.score} keyword{t.score > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {results!.flatMap((t) => t.matched).map((kw) => (
                <span key={kw} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">{kw}</span>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              <BookOpen size={11} className="mr-1 inline" />
              Matched Study Resources
            </p>
            {matchedResources.length === 0 ? (
              <p className="text-sm text-zinc-400">No specific resources matched. Browse the Study page for all tracks.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchedResources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900 leading-snug">{r.title}</p>
                      <div className="flex shrink-0 flex-wrap gap-1 justify-end">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">{r.level}</span>
                        {r.free && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">free</span>}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{r.notes}</p>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Interview Questions */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              <HelpCircle size={11} className="mr-1 inline" />
              Interview Questions ({matchedQuestions.length} matched)
            </p>
            <div className="space-y-3">
              <QuestionSection
                title="Technical Questions"
                questions={technicalQs}
                defaultOpen={true}
              />
              <QuestionSection
                title="Situational Questions"
                questions={situationalQs}
                defaultOpen={true}
              />
              <QuestionSection
                title="Behavioural Questions"
                questions={behavioralQs}
                defaultOpen={false}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Questions are drawn from a static bank matched to detected role focus. Difficulty:
              <span className="ml-1 text-emerald-600">junior</span> ·{' '}
              <span className="text-blue-600">mid</span> ·{' '}
              <span className="text-purple-600">senior</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
