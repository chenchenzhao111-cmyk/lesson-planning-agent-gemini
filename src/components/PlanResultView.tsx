import React, { useState } from 'react';
import {
  Sparkles, Copy, Printer, FileText, Check, Clock, AlertTriangle, HelpCircle,
  CheckCircle, Play, FileDown, Layers, Users, BookOpen, Share2, Edit3, Save, X
} from 'lucide-react';
import { PlanDecisionResult, LessonPlan, LessonPhase } from '../types/lesson';

interface PlanResultViewProps {
  result: PlanDecisionResult | null;
  onOpenTimer: () => void;
  onGenerateMaterial: (type: 'worksheet' | 'rubric' | 'differentiation' | 'quick_quiz' | 'discussion_cards') => void;
  onUpdateLesson?: (updated: LessonPlan) => void;
  isLoadingMaterial?: boolean;
}

export const PlanResultView: React.FC<PlanResultViewProps> = ({
  result,
  onOpenTimer,
  onGenerateMaterial,
  onUpdateLesson,
  isLoadingMaterial,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState<LessonPlan | null>(null);

  if (!result || result.action === 'AWAITING_INPUT') {
    return (
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(32,49,74,0.05)] p-8 text-center text-slate-500 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Awaiting Lesson Details</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Fill in the lesson fields above or select a curriculum sample to initiate pedagogical evaluation and structured 4-phase drafting.
        </p>
      </section>
    );
  }

  const { action, reason, message, lesson, engineUsed } = result;
  const currentLesson = editablePlan || lesson;

  const handleStartEdit = () => {
    if (lesson) {
      setEditablePlan(JSON.parse(JSON.stringify(lesson)));
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editablePlan && onUpdateLesson) {
      onUpdateLesson(editablePlan);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditablePlan(null);
    setIsEditing(false);
  };

  const handlePhaseChange = (index: number, field: keyof LessonPhase, value: string | number) => {
    if (!editablePlan) return;
    const newPhases = [...editablePlan.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setEditablePlan({ ...editablePlan, phases: newPhases });
  };

  const formatTextExport = (l: LessonPlan) => {
    return [
      `LESSON PLAN: ${l.title}`,
      `Audience: ${l.audience} | Setting: ${l.setting} | Duration: ${l.duration} minutes`,
      `Approach: ${l.pack}`,
      `Objective: ${l.objective}`,
      '',
      '--- READY-TO-USE EXAMPLE / STIMULUS ---',
      l.stimulus,
      '',
      ...(l.scaffoldingStrategy ? [`Scaffolding Strategy: ${l.scaffoldingStrategy}`, ''] : []),
      ...l.phases.flatMap((p, i) => [
        `PHASE ${i + 1} — ${p.name} (${p.minutes} min)`,
        `Purpose: ${p.goal}`,
        `Teacher: ${p.teacher}`,
        `Students: ${p.students}`,
        `Check for Understanding: ${p.check}`,
        '',
      ]),
      '--- TEACHER REVIEW NOTES ---',
      ...l.notes.map(n => `• ${n}`),
    ].join('\n');
  };

  const handleCopy = async () => {
    if (!currentLesson) return;
    const text = formatTextExport(currentLesson);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const box = document.createElement('textarea');
      box.value = text;
      box.style.position = 'fixed';
      box.style.left = '-9999px';
      document.body.appendChild(box);
      box.select();
      document.execCommand('copy');
      box.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!currentLesson) return;
    const text = `# ${currentLesson.title}

**Audience:** ${currentLesson.audience}  
**Setting:** ${currentLesson.setting} (${currentLesson.duration} minutes)  
**Instructional Approach:** ${currentLesson.pack}  

## Learning Objective
${currentLesson.objective}

## Ready-to-Use Classroom Stimulus
\`\`\`
${currentLesson.stimulus}
\`\`\`

${currentLesson.scaffoldingStrategy ? `## Scaffolding & Differentiation\n${currentLesson.scaffoldingStrategy}\n` : ''}

## Instructional Phases

${currentLesson.phases
  .map(
    (p, i) => `### Phase ${i + 1}: ${p.name} (${p.minutes} min)
- **Learning Purpose:** ${p.goal}
- **Teacher Action:** ${p.teacher}
- **Student Engagement:** ${p.students}
- **Evidence of Learning:** ${p.check}
`
  )
  .join('\n')}

## Teacher Review & Instructional Considerations
${currentLesson.notes.map(n => `- ${n}`).join('\n')}
`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_plan.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  // Status visual attributes
  const statusConfig = {
    GENERATE: {
      label: 'ACTION: GENERATE',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
      boxBg: 'bg-emerald-50/50 border-emerald-200 text-emerald-900',
    },
    CLARIFY: {
      label: 'ACTION: CLARIFY',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: HelpCircle,
      boxBg: 'bg-purple-50/50 border-purple-200 text-purple-900',
    },
    HUMAN_REVIEW: {
      label: 'ACTION: HUMAN REVIEW',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      boxBg: 'bg-amber-50/50 border-amber-200 text-amber-900',
    },
  }[action] || {
    label: action,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: HelpCircle,
    boxBg: 'bg-slate-50 border-slate-200 text-slate-800',
  };

  const StatusIcon = statusConfig.icon;

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(32,49,74,0.05)] p-6 sm:p-8 space-y-6">
      {/* Header Decision Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${statusConfig.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Engine: {engineUsed === 'gemini' ? 'Gemini 3.8 Flash' : 'Rule-Based V3'}
          </span>
        </div>

        {/* Action buttons if generated */}
        {currentLesson && action === 'GENERATE' && (
          <div className="flex items-center gap-2 no-print">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Edits
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Customize Plan
              </button>
            )}

            <button
              type="button"
              onClick={onOpenTimer}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Classroom Mode
            </button>
          </div>
        )}
      </div>

      {/* Decision callout */}
      <div className={`p-4 rounded-xl border text-sm ${statusConfig.boxBg} space-y-1`}>
        <div className="font-bold flex items-center gap-2">
          <span>{reason}</span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>

      {/* If Clarify or Human Review */}
      {action !== 'GENERATE' && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">How to proceed:</p>
          <ul className="list-disc list-inside space-y-1">
            {action === 'CLARIFY' && (
              <>
                <li>Review the missing or ambiguous fields highlighted in the message.</li>
                <li>Ensure the learning objective contains an observable verb (e.g. compare, explain, evaluate).</li>
                <li>Make sure duration is between 10 and 240 minutes.</li>
              </>
            )}
            {action === 'HUMAN_REVIEW' && (
              <>
                <li>Inspect time allocations: Ensure total activity time does not exceed available lesson time.</li>
                <li>Remember that automated systems cannot make high-stakes individual student grading or clinical diagnoses.</li>
                <li>Avoid absolute guarantees like "100% mastery for all students".</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Detailed Lesson Plan Content */}
      {currentLesson && action === 'GENERATE' && (
        <div className="space-y-6 pt-2">
          {/* Title & Metadata Strip */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {currentLesson.title}
            </h1>

            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-800 font-semibold">{currentLesson.audience}</span>
              <span aria-hidden="true">·</span>
              <span>{currentLesson.setting}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {currentLesson.duration} minutes total
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 font-semibold">{currentLesson.pack}</span>
            </div>
          </div>

          {/* Observable Learning Objective */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Observable Learning Objective
            </span>
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              {currentLesson.objective}
            </p>
          </div>

          {/* Ready-to-use Example / Stimulus */}
          <div className="p-5 bg-gradient-to-br from-blue-50/60 to-slate-50/60 rounded-xl border border-blue-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Ready-to-Use Classroom Stimulus / Prompt
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(currentLesson.stimulus)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors no-print"
              >
                <Copy className="w-3 h-3" />
                Copy stimulus
              </button>
            </div>
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
              {currentLesson.stimulus}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Authentic prompt or teacher-verified stimulus. Check factual and accessibility requirements for your classroom.
            </p>
          </div>

          {/* Scaffolding recommendation if present */}
          {currentLesson.scaffoldingStrategy && (
            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5">
              <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Scaffolding & Differentiation Note:</strong>
                <span>{currentLesson.scaffoldingStrategy}</span>
              </div>
            </div>
          )}

          {/* Visual Phase Timing Bar */}
          <div className="space-y-1.5 no-print">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Instructional Phase Allocation</span>
              <span>{currentLesson.duration} Minutes</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {currentLesson.phases.map((phase, idx) => {
                const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-sky-500', 'bg-teal-500'];
                const pct = Math.max(5, (phase.minutes / currentLesson.duration) * 100);
                return (
                  <div
                    key={idx}
                    style={{ width: `${pct}%` }}
                    className={`${colors[idx % colors.length]} transition-all hover:brightness-110 relative group`}
                    title={`Phase ${idx + 1}: ${phase.name} (${phase.minutes}m)`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {currentLesson.phases.map((p, i) => (
                <div key={i} className="text-[11px] text-slate-500 truncate">
                  <span className="font-semibold text-slate-700">P{i + 1}:</span> {p.minutes}m ({p.name})
                </div>
              ))}
            </div>
          </div>

          {/* Instructional Phases Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Instructional Sequence (4-Phase Model)
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {currentLesson.phases.map((phase, idx) => (
                <article
                  key={idx}
                  className="phase-card bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3.5"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                        Phase {idx + 1}
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={phase.name}
                          onChange={e => handlePhaseChange(idx, 'name', e.target.value)}
                          className="font-bold text-slate-900 text-base mt-1 px-2 py-1 border border-slate-300 rounded"
                        />
                      ) : (
                        <h4 className="font-bold text-slate-900 text-base">
                          {phase.name}
                        </h4>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {isEditing ? (
                        <input
                          type="number"
                          value={phase.minutes}
                          onChange={e => handlePhaseChange(idx, 'minutes', Number(e.target.value))}
                          className="w-12 text-center border border-slate-300 rounded py-0.5"
                        />
                      ) : (
                        <span>{phase.minutes} min</span>
                      )}
                    </div>
                  </div>

                  {/* Phase Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                    {/* Goal */}
                    <div className="md:col-span-2">
                      <strong className="text-slate-900 font-semibold block mb-0.5 text-xs text-blue-900">
                        Learning Purpose:
                      </strong>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={phase.goal}
                          onChange={e => handlePhaseChange(idx, 'goal', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded"
                        />
                      ) : (
                        <p className="text-slate-700 leading-relaxed">{phase.goal}</p>
                      )}
                    </div>

                    {/* Teacher Action */}
                    <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                      <strong className="text-slate-900 font-semibold block mb-1 text-xs text-indigo-900">
                        Teacher Action & Script:
                      </strong>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={phase.teacher}
                          onChange={e => handlePhaseChange(idx, 'teacher', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded"
                        />
                      ) : (
                        <p className="text-slate-700 text-xs leading-relaxed">{phase.teacher}</p>
                      )}
                    </div>

                    {/* Student Task */}
                    <div className="p-3 bg-slate-50/60 rounded-lg border border-slate-100">
                      <strong className="text-slate-900 font-semibold block mb-1 text-xs text-sky-900">
                        Learner Task & Response:
                      </strong>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={phase.students}
                          onChange={e => handlePhaseChange(idx, 'students', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded"
                        />
                      ) : (
                        <p className="text-slate-700 text-xs leading-relaxed">{phase.students}</p>
                      )}
                    </div>

                    {/* Check for Understanding */}
                    <div className="md:col-span-2 p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 text-xs">
                      <strong className="text-emerald-900 font-semibold block mb-0.5">
                        Evidence of Learning / Formative Check:
                      </strong>
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={phase.check}
                          onChange={e => handlePhaseChange(idx, 'check', e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded"
                        />
                      ) : (
                        <p className="text-emerald-800 leading-relaxed">{phase.check}</p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Teacher Review Notes */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Teacher Review & Pre-Class Checklist
            </h4>
            <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
              {currentLesson.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          {/* AI Companion Material Generator (LLM Support Feature) */}
          <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/70 space-y-3 no-print">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Teaching Material Generator
                </h4>
                <p className="text-xs text-blue-700/80 mt-0.5">
                  Generate instant classroom handouts, rubrics, and differentiation sheets based on this plan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                disabled={isLoadingMaterial}
                onClick={() => onGenerateMaterial('worksheet')}
                className="px-3 py-2 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Student Worksheet</span>
              </button>
              <button
                type="button"
                disabled={isLoadingMaterial}
                onClick={() => onGenerateMaterial('rubric')}
                className="px-3 py-2 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Rubric & Exit Ticket</span>
              </button>
              <button
                type="button"
                disabled={isLoadingMaterial}
                onClick={() => onGenerateMaterial('differentiation')}
                className="px-3 py-2 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Differentiation Plan</span>
              </button>
              <button
                type="button"
                disabled={isLoadingMaterial}
                onClick={() => onGenerateMaterial('discussion_cards')}
                className="px-3 py-2 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Discussion Cards</span>
              </button>
            </div>
          </div>

          {/* Export Actions Strip */}
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-3 no-print">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Download .MD</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print / Save PDF</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenTimer}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Classroom Timer</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
