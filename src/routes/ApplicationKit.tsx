import { useState, useMemo } from 'react';
import {
  FileText, Mail, Send, FileDown, Copy, Check, Sparkles, AlertCircle, Building2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useStaticData } from '../hooks/useStaticData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CvExperience {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  context_tags: string[];
  bullets: string[];
}

interface CvEducation {
  institution: string;
  qualification: string;
  location: string;
  start: string;
  end: string;
  notes: string;
}

interface CvProject {
  name: string;
  url: string;
  description: string;
}

interface CvBase {
  personal: {
    name: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    linkedin: string;
    medium: string;
    work_authorisation_note: string;
  };
  summary_variants: Record<string, string>;
  skills: Record<string, string[]>;
  experience: CvExperience[];
  education: CvEducation[];
  certifications: string[];
  recognitions: string[];
  projects: CvProject[];
}

// ─── Keyword → summary variant + skill highlighting ───────────────────────────

const VARIANT_KEYWORDS: { variant: string; keywords: string[] }[] = [
  { variant: 'appsec', keywords: ['application security', 'appsec', 'product security', 'sast', 'dast', 'owasp', 'secure code', 'code review', 'xss', 'sql injection', 'idor', 'ssrf', 'api security'] },
  { variant: 'pentester', keywords: ['penetration test', 'pen test', 'pentester', 'red team', 'offensive security', 'ethical hacker', 'security consultant', 'bug bounty'] },
  { variant: 'soc', keywords: ['soc analyst', 'security operations', 'siem', 'splunk', 'sentinel', 'incident response', 'threat hunt', 'detection', 'blue team', 'edr'] },
  { variant: 'grc', keywords: ['grc', 'iso 27001', 'iso27001', 'compliance', 'risk management', 'dora', 'gdpr', 'audit', 'governance', 'isms'] },
  { variant: 'ai_security', keywords: ['ai security', 'llm security', 'prompt injection', 'generative ai', 'genai', 'machine learning security', 'owasp llm'] },
];

function detectVariant(jd: string): keyof CvBase['summary_variants'] {
  const lower = jd.toLowerCase();
  let best = { variant: 'generic', score: 0 };
  for (const v of VARIANT_KEYWORDS) {
    const score = v.keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
    if (score > best.score) best = { variant: v.variant, score };
  }
  return (best.score > 0 ? best.variant : 'generic') as keyof CvBase['summary_variants'];
}

function extractTopKeywords(jd: string, limit = 8): string[] {
  const lower = jd.toLowerCase();
  const stopwords = new Set(['the', 'and', 'for', 'with', 'you', 'your', 'our', 'are', 'have', 'will', 'work', 'role', 'team', 'from', 'into', 'this', 'that', 'they', 'their', 'about', 'must', 'should']);
  const words = lower.replace(/[^a-z0-9\s+]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !stopwords.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

function scoreBullet(bullet: string, jdKeywords: string[]): number {
  const lower = bullet.toLowerCase();
  return jdKeywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
}

function rankExperienceBullets(cv: CvBase, jdKeywords: string[]): CvExperience[] {
  return cv.experience.map((exp) => {
    const scored = exp.bullets.map((b) => ({ text: b, score: scoreBullet(b, jdKeywords) }));
    scored.sort((a, b) => b.score - a.score);
    return { ...exp, bullets: scored.map((s) => s.text) };
  });
}

function pickSkillGroups(cv: CvBase, variant: string): { label: string; items: string[] }[] {
  const groupOrder: Record<string, string[]> = {
    appsec: ['offensive', 'defensive', 'tools', 'frameworks_standards', 'cloud_devops', 'languages'],
    pentester: ['offensive', 'tools', 'frameworks_standards', 'languages', 'cloud_devops', 'defensive'],
    soc: ['defensive', 'tools', 'frameworks_standards', 'offensive', 'cloud_devops', 'languages'],
    grc: ['frameworks_standards', 'defensive', 'offensive', 'cloud_devops', 'tools', 'languages'],
    ai_security: ['ai_security', 'offensive', 'tools', 'frameworks_standards', 'defensive', 'languages'],
    generic: ['offensive', 'defensive', 'tools', 'frameworks_standards', 'cloud_devops', 'languages'],
  };
  const order = groupOrder[variant] || groupOrder.generic;
  const labels: Record<string, string> = {
    offensive: 'Offensive Security',
    defensive: 'Defensive & Vulnerability Management',
    cloud_devops: 'Cloud & DevOps',
    tools: 'Tooling',
    frameworks_standards: 'Frameworks & Standards',
    languages: 'Programming & Scripting',
    ai_security: 'AI / LLM Security',
  };
  return order
    .filter((k) => cv.skills[k] && cv.skills[k].length > 0)
    .map((k) => ({ label: labels[k] || k, items: cv.skills[k] }));
}

// ─── Cover letter generator ───────────────────────────────────────────────────

function generateCoverLetter(cv: CvBase, jd: string, company: string, roleTitle: string): string {
  const variant = detectVariant(jd);
  const kws = extractTopKeywords(jd, 6);
  const kwPhrase = kws.slice(0, 3).join(', ');
  const today = new Date().toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' });

  const openings: Record<string, string> = {
    appsec: `I am applying for the ${roleTitle || 'Application Security'} role at ${company || '[Company]'}. My background is 3+ years of hands-on application security across web, API, and mobile — most recently at Cubic Telecom, where I delivered 15+ full-scope assessments against connected-device platforms.`,
    pentester: `I am writing to apply for the ${roleTitle || 'Penetration Tester'} role at ${company || '[Company]'}. My background is 3+ years of offensive security engagements across web, API, mobile, and infrastructure targets in telecom and financial services — most recently at Cubic Telecom.`,
    soc: `I am applying for the ${roleTitle || 'Security Analyst'} role at ${company || '[Company]'}. I bring 3+ years of security engineering experience, including hands-on exposure to detection engineering, incident triage, and vulnerability management alongside offensive assessments.`,
    grc: `I am writing to apply for the ${roleTitle || 'GRC / Information Security'} role at ${company || '[Company]'}. I combine 3+ years of technical security experience with ISO 27001 Lead Implementer training and DORA fundamentals — an unusual bridge between engineering depth and governance craft.`,
    ai_security: `I am applying for the ${roleTitle || 'AI Security'} role at ${company || '[Company]'}. I have 3+ years of application security experience and I've been actively specialising in AI/LLM security — building vulnerable LLM agents and red-teaming them with Garak, PyRIT, and promptfoo.`,
    generic: `I am applying for the ${roleTitle || 'Security'} role at ${company || '[Company]'}. My background is 3+ years across application security, penetration testing, and vulnerability management in telecom and financial-services environments.`,
  };

  const middleTechnical = `Reading through the role, the emphasis on ${kwPhrase} maps directly onto the work I've been doing. At Cubic Telecom I identified a critical JWT authentication bypass that would have exposed connected-vehicle telemetry across the fleet — reported through the agreed channel and remediated within 48 hours. Prior to that, at Indusface, I ran continuous web + API assessments for enterprise SaaS customers, writing findings that mapped cleanly to CWE / OWASP references and included prescriptive remediation guidance.`;

  const middleRecognition = `Beyond client work I've been recognised in the Nokia Security Hall of Fame and the Government of India Cybersecurity Hall of Fame for responsible disclosures. I hold an MSc in Cybersecurity from the National College of Ireland.`;

  const close = `I am based in Dublin and require Critical Skills / EU Blue Card sponsorship depending on the location. I would welcome a conversation about how my experience fits ${company || '[Company]'}'s current priorities.\n\nThank you for your consideration.\n\nBest regards,\n${cv.personal.name}\n${cv.personal.email} | ${cv.personal.linkedin}`;

  return `${today}\n\nDear Hiring Team,\n\n${openings[variant]}\n\n${middleTechnical}\n\n${middleRecognition}\n\n${close}`;
}

// ─── Cold email generator ────────────────────────────────────────────────────

function generateColdEmail(cv: CvBase, jd: string, company: string, roleTitle: string): { subject: string; body: string } {
  const variant = detectVariant(jd);
  const roleShort: Record<string, string> = {
    appsec: 'AppSec Engineer',
    pentester: 'Penetration Tester',
    soc: 'Security Analyst',
    grc: 'InfoSec / GRC',
    ai_security: 'AI Security Engineer',
    generic: 'Security Engineer',
  };
  const subject = `Interest in the ${roleTitle || roleShort[variant]} role at ${company || '[Company]'}`;

  const body = `Hi [Recruiter Name],

I came across the ${roleTitle || roleShort[variant]} opening at ${company || '[Company]'} and wanted to reach out directly.

Quick context: I have 3+ years of application security + pentesting experience across telecom and financial services (Cubic Telecom, Indusface). Recognised in the Nokia and Government of India Halls of Fame for responsible disclosure. MSc Cybersecurity from NCI, based in Dublin.

Two specifics from recent work that seem relevant:
• Discovered a critical JWT auth bypass in a production API gateway at Cubic Telecom — reachable impact to connected-device telemetry, patched within 48 hours.
• Delivered 15+ web / API / mobile assessments end-to-end, from scoping through dual-audience reporting (exec summary + engineering fix guidance).

I need CSEP / EU Blue Card sponsorship. Would you be open to a 15-minute call this week or next?

CV: [attach or link]
LinkedIn: ${cv.personal.linkedin}

Thanks,
${cv.personal.name}
${cv.personal.email}`;

  return { subject, body };
}

// ─── PDF generators ───────────────────────────────────────────────────────────

function generateResumePdf(cv: CvBase, jd: string, targetRole: string): void {
  const variant = detectVariant(jd);
  const jdKws = extractTopKeywords(jd, 10);
  const tailoredExperience = rankExperienceBullets(cv, jdKws);
  const skillGroups = pickSkillGroups(cv, variant);
  const summary = cv.summary_variants[variant] || cv.summary_variants.generic;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 44;
  const marginTop = 44;
  const marginBottom = 44;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginTop;
  let currentPage = 1;

  function addPageIfNeeded(needed: number): boolean {
    if (y + needed > pageHeight - marginBottom) {
      doc.addPage();
      currentPage++;
      y = marginTop;
      return true;
    }
    return false;
  }

  function writeLine(text: string, size: number, style: 'normal' | 'bold' | 'italic', color: [number, number, number] = [30, 30, 30], indent = 0) {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = size * 1.3;
    for (const line of lines) {
      addPageIfNeeded(lineHeight);
      doc.text(line, marginX + indent, y);
      y += lineHeight;
    }
  }

  function sectionHeader(label: string) {
    addPageIfNeeded(28);
    y += 6;
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(label.toUpperCase(), marginX, y);
    y += 14;
  }

  // ── HEADER (name, contact) — ATS-safe: text only, no columns
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(cv.personal.name, marginX, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(targetRole || cv.personal.title, marginX, y);
  y += 14;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const contactLine = `${cv.personal.location} | ${cv.personal.email} | ${cv.personal.phone} | ${cv.personal.linkedin}`;
  doc.text(contactLine, marginX, y);
  y += 12;
  if (cv.personal.work_authorisation_note) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text(cv.personal.work_authorisation_note, marginX, y);
    y += 12;
  }

  // ── SUMMARY
  sectionHeader('Professional Summary');
  writeLine(summary, 10, 'normal');

  // ── SKILLS
  sectionHeader('Core Skills');
  for (const group of skillGroups) {
    writeLine(group.label, 10, 'bold', [40, 40, 40]);
    writeLine(group.items.join(' · '), 9.5, 'normal', [60, 60, 60], 4);
    y += 2;
  }

  // ── EXPERIENCE
  sectionHeader('Professional Experience');
  for (const exp of tailoredExperience) {
    addPageIfNeeded(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(20, 20, 20);
    doc.text(exp.role, marginX, y);
    const dateStr = `${exp.start || ''} – ${exp.end || 'Present'}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(90, 90, 90);
    const dateWidth = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageWidth - marginX - dateWidth, y);
    y += 12;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`${exp.company}, ${exp.location}`, marginX, y);
    y += 12;

    // Bullets — cap at 5 to control length across 2 pages
    const bulletsToRender = exp.bullets.slice(0, 5);
    for (const b of bulletsToRender) {
      addPageIfNeeded(24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      const bulletLines = doc.splitTextToSize(`•  ${b}`, contentWidth - 6);
      for (const line of bulletLines) {
        addPageIfNeeded(11);
        doc.text(line, marginX + 4, y);
        y += 11;
      }
      y += 2;
    }
    y += 6;
  }

  // ── EDUCATION
  sectionHeader('Education');
  for (const ed of cv.education.filter((e) => e.institution && !e.institution.startsWith('['))) {
    addPageIfNeeded(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(ed.qualification, marginX, y);
    const dateStr = `${ed.start || ''}${ed.start && ed.end ? ' – ' : ''}${ed.end || ''}`;
    if (dateStr.trim()) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(90, 90, 90);
      const w = doc.getTextWidth(dateStr);
      doc.text(dateStr, pageWidth - marginX - w, y);
    }
    y += 12;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`${ed.institution}, ${ed.location}`, marginX, y);
    y += 12;
    if (ed.notes) writeLine(ed.notes, 9, 'normal', [80, 80, 80], 4);
    y += 4;
  }

  // ── CERTIFICATIONS & RECOGNITION (combined block for compactness)
  sectionHeader('Certifications & Recognition');
  for (const c of cv.certifications) writeLine(`•  ${c}`, 9.5, 'normal', [40, 40, 40], 4);
  for (const r of cv.recognitions) writeLine(`•  ${r}`, 9.5, 'normal', [40, 40, 40], 4);

  // ── PROJECTS (only if space allows on page 2)
  if (currentPage <= 2 && y < pageHeight - marginBottom - 80) {
    sectionHeader('Selected Projects');
    for (const p of cv.projects.slice(0, 2)) {
      addPageIfNeeded(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(p.name, marginX, y);
      y += 12;
      if (p.url && !p.url.startsWith('[')) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(60, 100, 180);
        doc.text(p.url, marginX, y);
        y += 11;
      }
      writeLine(p.description, 9.5, 'normal', [50, 50, 50], 4);
      y += 4;
    }
  }

  const slug = (targetRole || 'security').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${cv.personal.name.replace(/\s+/g, '_')}_CV_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

function generateCoverLetterPdf(cv: CvBase, coverLetter: string, company: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 48;
  const marginBottom = 48;
  const contentWidth = pageWidth - marginX * 2;
  let y = marginTop;

  // Sender block (top-right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  const senderLines = [
    cv.personal.name,
    cv.personal.email,
    cv.personal.phone,
    cv.personal.location,
    cv.personal.linkedin,
  ];
  for (const line of senderLines) {
    const w = doc.getTextWidth(line);
    doc.text(line, pageWidth - marginX - w, y);
    y += 11;
  }
  y += 20;

  // Body
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  const paragraphs = coverLetter.split('\n\n');
  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, contentWidth);
    for (const line of lines) {
      if (y + 14 > pageHeight - marginBottom) { doc.addPage(); y = marginTop; }
      doc.text(line, marginX, y);
      y += 14;
    }
    y += 8;
  }

  const slug = (company || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`${cv.personal.name.replace(/\s+/g, '_')}_CoverLetter_${slug}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Copy helper ──────────────────────────────────────────────────────────────

function useCopy(): [string | null, (text: string, id: string) => void] {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  return [copiedId, copy];
}

// ─── Main route ───────────────────────────────────────────────────────────────

export default function ApplicationKit() {
  const { data: cv, loading, error } = useStaticData<CvBase>('data/cv-base.json');
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [generated, setGenerated] = useState(false);
  const [tab, setTab] = useState<'resume' | 'cover' | 'email'>('resume');
  const [copiedId, copy] = useCopy();

  const detected = useMemo(() => {
    if (!jd.trim()) return null;
    return {
      variant: detectVariant(jd),
      keywords: extractTopKeywords(jd, 8),
    };
  }, [jd]);

  const previewResume = useMemo(() => {
    if (!cv || !jd.trim()) return null;
    const variant = detectVariant(jd);
    const kws = extractTopKeywords(jd, 10);
    return {
      variant,
      summary: cv.summary_variants[variant] || cv.summary_variants.generic,
      experience: rankExperienceBullets(cv, kws),
      skillGroups: pickSkillGroups(cv, variant),
    };
  }, [cv, jd]);

  const coverLetter = useMemo(() => {
    if (!cv || !jd.trim()) return '';
    return generateCoverLetter(cv, jd, company, roleTitle);
  }, [cv, jd, company, roleTitle]);

  const coldEmail = useMemo(() => {
    if (!cv || !jd.trim()) return null;
    return generateColdEmail(cv, jd, company, roleTitle);
  }, [cv, jd, company, roleTitle]);

  if (loading) return <div className="text-sm text-zinc-400">Loading base CV…</div>;
  if (error || !cv) return <div className="text-sm text-red-500">Failed to load base CV: {error}</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Application Kit</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Paste a JD → get a tailored 2-page EU-friendly CV, cover letter, and cold email. All PDFs generated locally, no data leaves your browser.
          </p>
        </div>
        <Sparkles size={28} className="mt-1 shrink-0 text-emerald-500" />
      </div>

      {/* Honest banner */}
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">Honest read on this tool.</p>
          <p className="mt-1">
            <strong>ATS:</strong> No tool "bypasses 100% of ATS" — that's marketing. What this outputs: single-column layout, standard section headers,
            text-selectable PDF, no tables/columns/images/emojis. Parses cleanly in Workday, Greenhouse, Lever, iCIMS, Taleo.
          </p>
          <p className="mt-1">
            <strong>Tailoring:</strong> Client-side keyword matching against your base CV — picks the best-matching summary variant, re-ranks your experience bullets by JD keyword overlap, and orders skill groups to lead with the most relevant.
            It does <em>not</em> invent experience or exaggerate — every bullet comes from your base CV file.
          </p>
          <p className="mt-1">
            <strong>Base CV data:</strong> stored in <code className="bg-amber-100 px-1 rounded">public/data/cv-base.json</code>.
            Edit that file to add your phone number, exact dates, and any additional bullets. Placeholders marked with <code className="bg-amber-100 px-1 rounded">[verify]</code> need your input.
          </p>
        </div>
      </div>

      {/* Input row */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Company (optional but recommended)</label>
          <div className="relative">
            <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              className="input pl-7"
              placeholder="e.g. Tines, N26, Deutsche Bank"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Target Role Title (optional)</label>
          <input
            className="input"
            placeholder="e.g. Application Security Engineer"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="label">Job Description</label>
        <textarea
          className="input mt-1 min-h-[200px] resize-y font-mono text-xs"
          placeholder="Paste the full job description here…"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            {jd.length > 0 ? `${jd.length} characters` : 'No JD pasted yet'}
          </p>
          <button
            onClick={() => setGenerated(true)}
            disabled={!jd.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} /> Generate Application Kit
          </button>
        </div>
      </div>

      {/* Detected topic + keywords */}
      {detected && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-700">Detected focus + keywords</p>
          <p className="mt-1 text-xs text-blue-900">
            Variant: <strong>{detected.variant}</strong>{' '}·{' '}
            Keywords: {detected.keywords.map((k) => (
              <span key={k} className="inline-block rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-blue-800 mr-1 mb-1">{k}</span>
            ))}
          </p>
        </div>
      )}

      {generated && jd.trim() && (
        <>
          {/* Tabs */}
          <div className="mt-6 flex border-b border-zinc-200">
            {([
              { id: 'resume', label: 'Resume', icon: <FileText size={13} className="inline mr-1" /> },
              { id: 'cover', label: 'Cover Letter', icon: <Mail size={13} className="inline mr-1" /> },
              { id: 'email', label: 'Cold Email', icon: <Send size={13} className="inline mr-1" /> },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Resume tab */}
          {tab === 'resume' && previewResume && (
            <div className="mt-4">
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => generateResumePdf(cv, jd, roleTitle)}
                  className="flex items-center gap-1.5 rounded bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700"
                >
                  <FileDown size={13} /> Download 2-page CV (PDF)
                </button>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                {/* Header preview */}
                <div>
                  <p className="text-xl font-bold text-zinc-900">{cv.personal.name}</p>
                  <p className="text-sm text-zinc-600">{roleTitle || cv.personal.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {cv.personal.location} | {cv.personal.email} | {cv.personal.phone} | {cv.personal.linkedin}
                  </p>
                  <p className="mt-1 text-[10px] italic text-zinc-400">{cv.personal.work_authorisation_note}</p>
                </div>

                <div className="border-t border-zinc-200 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Professional Summary</p>
                  <p className="mt-1 text-sm text-zinc-700 leading-relaxed">{previewResume.summary}</p>
                </div>

                <div className="border-t border-zinc-200 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Core Skills</p>
                  <div className="mt-1 space-y-1.5">
                    {previewResume.skillGroups.map((g) => (
                      <div key={g.label}>
                        <span className="text-xs font-semibold text-zinc-800">{g.label}: </span>
                        <span className="text-xs text-zinc-600">{g.items.join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Experience (bullets re-ranked by JD relevance)</p>
                  <div className="mt-2 space-y-3">
                    {previewResume.experience.map((e, idx) => (
                      <div key={idx}>
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-semibold text-zinc-900">{e.role}</p>
                          <p className="text-xs text-zinc-500">{e.start} – {e.end || 'Present'}</p>
                        </div>
                        <p className="text-xs italic text-zinc-600">{e.company}, {e.location}</p>
                        <ul className="mt-1 space-y-0.5 list-disc list-inside text-xs text-zinc-700">
                          {e.bullets.slice(0, 5).map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cover letter tab */}
          {tab === 'cover' && (
            <div className="mt-4">
              <div className="flex justify-end gap-2 mb-3">
                <button
                  onClick={() => copy(coverLetter, 'cover')}
                  className="flex items-center gap-1.5 rounded border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400"
                >
                  {copiedId === 'cover' ? <><Check size={12} className="text-emerald-500" /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <button
                  onClick={() => generateCoverLetterPdf(cv, coverLetter, company)}
                  className="flex items-center gap-1.5 rounded bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-700"
                >
                  <FileDown size={13} /> Download PDF
                </button>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 leading-relaxed">{coverLetter}</pre>
              </div>
            </div>
          )}

          {/* Cold email tab */}
          {tab === 'email' && coldEmail && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Subject line</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-900">{coldEmail.subject}</p>
                  <button
                    onClick={() => copy(coldEmail.subject, 'subject')}
                    className="shrink-0 flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400"
                  >
                    {copiedId === 'subject' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Email body</p>
                  <button
                    onClick={() => copy(coldEmail.body, 'email')}
                    className="flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hover:border-zinc-400"
                  >
                    {copiedId === 'email' ? <><Check size={11} className="text-emerald-500" /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-800 leading-relaxed">{coldEmail.body}</pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
