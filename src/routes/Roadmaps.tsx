import { useState } from 'react';
import { Calendar, ExternalLink, FileDown, Sparkles, Target, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import { useStaticData } from '../hooks/useStaticData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResourceLink {
  label: string;
  url: string;
}

interface DayPlan {
  day: number;
  week: number;
  topic: string;
  outcome: string;
  time_hours: number;
  resources: ResourceLink[];
}

interface WeekBlock {
  label: string;
  focus: string;
}

interface Project {
  title: string;
  tagline: string;
  stand_out: string;
  steps: string[];
  deliverables: string[];
}

interface Roadmap {
  id: string;
  title: string;
  subtitle: string;
  audience: string;
  project: Project;
  weeks: WeekBlock[];
  days: DayPlan[];
}

interface RoadmapData {
  appsec: Roadmap;
  grc: Roadmap;
  ai_security: Roadmap;
}

type TrackId = 'appsec' | 'grc' | 'ai_security';

// ─── Day card ─────────────────────────────────────────────────────────────────

function DayCard({ day }: { day: DayPlan }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="shrink-0 rounded-md bg-zinc-900 text-white px-2.5 py-1 text-xs font-bold tabular-nums">
            Day {day.day}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{day.topic}</p>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              <span className="font-semibold text-zinc-700">Outcome: </span>{day.outcome}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
          {day.time_hours}h
        </span>
      </div>
      <div className="mt-3 space-y-1">
        {day.resources.map((r, i) => (
          r.url === '#' ? (
            <p key={i} className="text-xs text-zinc-500 italic">→ {r.label}</p>
          ) : (
            <a key={i} href={r.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <ExternalLink size={10} />
              {r.label}
            </a>
          )
        ))}
      </div>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
      <div className="flex items-start gap-2.5">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Stand-out Project</p>
          <h3 className="mt-0.5 text-base font-bold text-zinc-900">{project.title}</h3>
          <p className="mt-1 text-sm text-zinc-700 italic">{project.tagline}</p>
          <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
            <span className="font-semibold">Why it stands out: </span>{project.stand_out}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Build Steps</p>
        <ol className="mt-1.5 space-y-1.5 list-decimal list-inside text-xs text-zinc-700">
          {project.steps.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
        </ol>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Deliverables</p>
        <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-xs text-zinc-700">
          {project.deliverables.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
    </div>
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

export default function Roadmaps() {
  const { data, loading, error } = useStaticData<RoadmapData>('data/roadmaps.json');
  const [track, setTrack] = useState<TrackId>('appsec');

  if (loading) return <div className="text-sm text-zinc-400">Loading roadmaps…</div>;
  if (error || !data) return <div className="text-sm text-red-500">Failed to load: {error}</div>;

  const roadmap = data[track];

  // Group days by week
  const weeksGrouped = roadmap.weeks.map((w, idx) => ({
    ...w,
    weekNum: idx + 1,
    days: roadmap.days.filter((d) => d.week === idx + 1),
  }));

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">30-Day Roadmaps</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Distraction-free interview prep tracks. Free resources only. Each day capped at ~1.5–2 hours.
          </p>
        </div>
        <Target size={28} className="mt-1 shrink-0 text-zinc-300" />
      </div>

      {/* Track tabs */}
      <div className="mt-5 flex flex-wrap border-b border-zinc-200">
        {([
          { id: 'appsec', label: 'Application Security' },
          { id: 'grc', label: 'Governance & ISO 27001' },
          { id: 'ai_security', label: 'AI / LLM Security' },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTrack(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              track === t.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Title block + PDF button */}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-zinc-900">{roadmap.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{roadmap.subtitle}</p>
          <p className="mt-2 text-xs text-zinc-500 italic">{roadmap.audience}</p>
        </div>
        <button
          onClick={() => generateRoadmapPdf(roadmap)}
          className="shrink-0 flex items-center gap-1.5 rounded-md bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <FileDown size={14} />
          Download PDF
        </button>
      </div>

      {/* Project card */}
      <div className="mt-6">
        <ProjectCard project={roadmap.project} />
      </div>

      {/* Week-by-week */}
      <div className="mt-8 space-y-8">
        {weeksGrouped.map((w) => (
          <div key={w.weekNum}>
            <div className="mb-3 flex items-baseline gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-700">
                <Calendar size={13} /> {w.label}
              </h3>
            </div>
            <p className="mb-3 text-xs text-zinc-500 italic">{w.focus}</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {w.days.map((d) => <DayCard key={d.day} day={d} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
          <BookOpen size={12} /> How to use this roadmap
        </p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-zinc-600">
          <li>Block 1.5–2 hours per day. Same time each day if possible.</li>
          <li>Stop reading after the outcome is hit — do not chase rabbit holes during the 30 days.</li>
          <li>Project work is interleaved on specific days. Don't skip those — the project is your differentiator.</li>
          <li>Use the JD Analyzer tab in this app for question-and-answer drilling alongside the roadmap.</li>
          <li>Download the PDF and check off days offline. The PDF is the same content in printable form.</li>
        </ul>
      </div>
    </div>
  );
}

// ─── PDF generator ────────────────────────────────────────────────────────────

function generateRoadmapPdf(roadmap: Roadmap) {
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

  function writeText(text: string, size: number, style: 'normal' | 'bold' | 'italic', indent = 0, color: [number, number, number] = [0, 0, 0]) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, usableWidth - indent);
    const lineHeight = size * 1.35;
    for (const line of lines) {
      checkPageBreak(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }
  }

  function divider() {
    checkPageBreak(12);
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
  }

  // ── Title page
  writeText(roadmap.title, 18, 'bold');
  y += 4;
  writeText(roadmap.subtitle, 11, 'normal', 0, [90, 90, 90]);
  y += 4;
  writeText(roadmap.audience, 10, 'italic', 0, [120, 120, 120]);
  y += 14;
  writeText(`Generated: ${new Date().toISOString().slice(0, 10)}`, 9, 'normal', 0, [140, 140, 140]);
  y += 18;

  // ── Project section
  divider();
  writeText('STAND-OUT PROJECT', 11, 'bold', 0, [180, 100, 0]);
  y += 4;
  writeText(roadmap.project.title, 14, 'bold');
  writeText(roadmap.project.tagline, 10, 'italic', 0, [90, 90, 90]);
  y += 6;
  writeText('Why this stands out:', 10, 'bold');
  writeText(roadmap.project.stand_out, 10, 'normal', 8);
  y += 8;

  writeText('Build steps:', 10, 'bold');
  roadmap.project.steps.forEach((s, i) => {
    writeText(`${i + 1}. ${s}`, 10, 'normal', 8);
  });
  y += 8;

  writeText('Deliverables:', 10, 'bold');
  roadmap.project.deliverables.forEach((d) => {
    writeText(`• ${d}`, 10, 'normal', 8);
  });
  y += 8;

  // ── Days, grouped by week
  roadmap.weeks.forEach((w, idx) => {
    const weekNum = idx + 1;
    const weekDays = roadmap.days.filter((d) => d.week === weekNum);

    checkPageBreak(60);
    y += 6;
    divider();
    writeText(w.label.toUpperCase(), 12, 'bold', 0, [40, 40, 40]);
    writeText(w.focus, 10, 'italic', 0, [120, 120, 120]);
    y += 6;

    weekDays.forEach((d) => {
      checkPageBreak(70);
      writeText(`Day ${d.day} — ${d.topic}  (${d.time_hours}h)`, 11, 'bold');
      writeText(`Outcome: ${d.outcome}`, 10, 'normal', 8, [70, 70, 70]);
      if (d.resources.length > 0) {
        writeText('Resources:', 9, 'bold', 8);
        d.resources.forEach((r) => {
          if (r.url && r.url !== '#') {
            writeText(`• ${r.label}`, 9, 'normal', 16, [50, 50, 50]);
            writeText(`  ${r.url}`, 8, 'italic', 16, [60, 100, 180]);
          } else {
            writeText(`• ${r.label}`, 9, 'italic', 16, [80, 80, 80]);
          }
        });
      }
      y += 8;
    });
  });

  // ── Footer
  checkPageBreak(20);
  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(140, 140, 140);
  doc.text(
    'Generated by sponsor-track-ie. All resources verified free at time of generation. Block your calendar, ship the project, get the interview.',
    margin,
    y
  );

  const slug = roadmap.id;
  const filename = `30-day-roadmap-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
