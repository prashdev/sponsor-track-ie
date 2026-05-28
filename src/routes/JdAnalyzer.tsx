import { useState } from 'react';
import { Search, BookOpen, HelpCircle, Tag, AlertCircle, ChevronDown, ChevronUp, FileDown, MessageSquare } from 'lucide-react';
import jsPDF from 'jspdf';
import { useStaticData } from '../hooks/useStaticData';
import type { Resource } from '../lib/types';

// ─── Answer types ─────────────────────────────────────────────────────────────

interface AnswerEntry {
  answer: string;
  key_points: string[];
  follow_ups: string[];
}
type AnswerMap = Record<string, AnswerEntry>;

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

function QuestionRow({ q, i, answer }: { q: Question; i: number; answer?: AnswerEntry }) {
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <div className="px-5 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-xs font-bold tabular-nums text-zinc-300">
          {String(i + 1).padStart(2, '0')}
        </span>
        <div className="flex-1">
          <p className="text-sm text-zinc-800">{q.question}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
              {q.difficulty}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[q.type]}`}>
              {q.type}
            </span>
            {answer ? (
              <button
                onClick={() => setShowAnswer((v) => !v)}
                className="ml-1 flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
              >
                <MessageSquare size={10} />
                {showAnswer ? 'Hide answer' : 'Show answer'}
              </button>
            ) : (
              <span className="text-[10px] text-zinc-300">answer pending</span>
            )}
          </div>
          {showAnswer && answer && (
            <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs leading-relaxed text-zinc-700">{answer.answer}</p>
              {answer.key_points.length > 0 && (
                <>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Key points to hit</p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-zinc-700">
                    {answer.key_points.map((kp, idx) => <li key={idx}>{kp}</li>)}
                  </ul>
                </>
              )}
              {answer.follow_ups.length > 0 && (
                <>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Likely follow-ups</p>
                  <ul className="mt-1 space-y-0.5 text-xs italic text-zinc-600">
                    {answer.follow_ups.map((fu, idx) => <li key={idx}>— {fu}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionSection({
  title,
  questions,
  answers,
  defaultOpen = true,
}: {
  title: string;
  questions: Question[];
  answers: AnswerMap | null;
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
            <QuestionRow key={q.id} q={q} i={i} answer={answers?.[q.id]} />
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
  const { data: allAnswers } = useStaticData<AnswerMap>('data/interview-answers.json');

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
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                <HelpCircle size={11} className="mr-1 inline" />
                Interview Questions ({matchedQuestions.length} matched)
              </p>
              <button
                onClick={() => generateQAPdf(matchedQuestions, allAnswers, results![0]?.label ?? 'Security')}
                disabled={!allAnswers || matchedQuestions.length === 0}
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Download Q&A study sheet as PDF"
              >
                <FileDown size={12} />
                Download Q&amp;A PDF
              </button>
            </div>
            <div className="space-y-3">
              <QuestionSection
                title="Technical Questions"
                questions={technicalQs}
                answers={allAnswers}
                defaultOpen={true}
              />
              <QuestionSection
                title="Situational Questions"
                questions={situationalQs}
                answers={allAnswers}
                defaultOpen={true}
              />
              <QuestionSection
                title="Behavioural Questions"
                questions={behavioralQs}
                answers={allAnswers}
                defaultOpen={false}
              />
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Click "Show answer" on any question for an interview-grade model answer with key points and likely follow-ups.
              Difficulty: <span className="ml-1 text-emerald-600">junior</span> ·{' '}
              <span className="text-blue-600">mid</span> ·{' '}
              <span className="text-purple-600">senior</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

function generateQAPdf(questions: Question[], answers: AnswerMap | null, topicLabel: string) {
  if (!answers || questions.length === 0) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeText(text: string, size: number, style: 'normal' | 'bold' | 'italic', indent = 0) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const lines = doc.splitTextToSize(text, usableWidth - indent);
    const lineHeight = size * 1.35;
    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }
  }

  // Title page header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Interview Prep Study Sheet', margin, y);
  y += 28;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90);
  doc.text(`Focus: ${topicLabel}`, margin, y);
  y += 16;
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, margin, y);
  y += 16;
  doc.text(`Questions: ${questions.length}`, margin, y);
  y += 24;
  doc.setTextColor(0);

  // Group by type
  const groups = [
    { label: 'Technical Questions', items: questions.filter((q) => q.type === 'technical') },
    { label: 'Situational Questions', items: questions.filter((q) => q.type === 'situational') },
    { label: 'Behavioural Questions', items: questions.filter((q) => q.type === 'behavioral') },
  ];

  let qNum = 0;
  for (const group of groups) {
    if (group.items.length === 0) continue;
    checkPageBreak(40);
    y += 8;
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    writeText(group.label, 14, 'bold');
    y += 6;

    for (const q of group.items) {
      qNum += 1;
      const a = answers[q.id];
      checkPageBreak(60);
      y += 4;
      writeText(`Q${qNum}. ${q.question}`, 11, 'bold');
      doc.setTextColor(120);
      writeText(`Difficulty: ${q.difficulty}`, 9, 'italic', 8);
      doc.setTextColor(0);
      y += 4;

      if (a) {
        writeText('Answer:', 10, 'bold');
        writeText(a.answer, 10, 'normal', 8);

        if (a.key_points && a.key_points.length > 0) {
          y += 4;
          writeText('Key points:', 10, 'bold');
          for (const kp of a.key_points) {
            writeText(`• ${kp}`, 10, 'normal', 12);
          }
        }

        if (a.follow_ups && a.follow_ups.length > 0) {
          y += 4;
          writeText('Likely follow-ups:', 10, 'bold');
          for (const fu of a.follow_ups) {
            writeText(`— ${fu}`, 10, 'italic', 12);
          }
        }
      } else {
        doc.setTextColor(150);
        writeText('(Answer pending — refer to the in-app source materials.)', 10, 'italic', 8);
        doc.setTextColor(0);
      }
      y += 12;
    }
  }

  // Footer on last page
  checkPageBreak(20);
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(140);
  doc.text(
    'Generated by sponsor-track-ie. Answers are study guidance — adapt to your own experience before the interview.',
    margin,
    y
  );

  const slug = topicLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `interview-prep-${new Date().toISOString().slice(0, 10)}-${slug}.pdf`;
  doc.save(filename);
}
