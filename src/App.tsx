import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LessonForm } from './components/LessonForm';
import { PlanResultView } from './components/PlanResultView';
import { ClassroomTimerModal } from './components/ClassroomTimerModal';
import { MaterialModal } from './components/MaterialModal';
import { PresetLibraryModal } from './components/PresetLibraryModal';
import { PedagogicalFrameworkModal } from './components/PedagogicalFrameworkModal';
import { LessonFormData, PlanDecisionResult, GeneratedMaterial, LessonPlan } from './types/lesson';
import { decideRuleBased } from './lib/rulePlanner';
import { Sparkles, Shield, AlertCircle, HeartHandshake, CheckCircle2 } from 'lucide-react';

const INITIAL_FORM: LessonFormData = {
  topic: 'Evaluating Online Information',
  audience: 'First-year college students',
  duration: 45,
  setting: 'Online',
  materials: 'Online chat only; no breakout rooms or slides',
  objective: 'Compare the credibility of two online sources and support a choice with evidence.',
  activities: '',
  each: '',
  enginePreference: 'gemini',
};

export default function App() {
  const [formData, setFormData] = useState<LessonFormData>(INITIAL_FORM);
  const [result, setResult] = useState<PlanDecisionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Modals
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isFrameworkOpen, setIsFrameworkOpen] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<GeneratedMaterial | null>(null);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Check server status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setHasApiKey(data.hasApiKey);
      })
      .catch(() => {
        // Dev fallback
        setHasApiKey(false);
      });
  }, []);

  const handleFormChange = (data: Partial<LessonFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Call server endpoint
      const response = await fetch('/api/plan-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: PlanDecisionResult = await response.json();
      setResult(data);
    } catch (err) {
      console.warn('API error, falling back to local rule-based engine:', err);
      // Client-side fallback to rule-based engine
      const fallback = decideRuleBased(formData);
      fallback.engineUsed = 'rules';
      setResult(fallback);
    } finally {
      setIsLoading(false);
      // Smooth scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleClear = () => {
    setFormData({
      topic: '',
      audience: '',
      duration: '',
      setting: '',
      materials: '',
      objective: '',
      activities: '',
      each: '',
      enginePreference: formData.enginePreference,
    });
    setResult(null);
  };

  const handleGenerateMaterial = async (type: 'worksheet' | 'rubric' | 'differentiation' | 'quick_quiz' | 'discussion_cards') => {
    if (!result?.lesson) return;
    setIsLoadingMaterial(true);

    try {
      const response = await fetch('/api/generate-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson: result.lesson,
          type,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate material');
      }

      const data: GeneratedMaterial = await response.json();
      setActiveMaterial(data);
    } catch (err: any) {
      // Offline fallback mock material
      const titles = {
        worksheet: 'Student Guided Practice Handout',
        rubric: 'Formative Assessment Rubric & Exit Ticket',
        differentiation: 'Differentiated Instruction Strategies',
        quick_quiz: 'Diagnostic Quick Quiz',
        discussion_cards: 'Classroom Discussion Task Cards',
      };
      setActiveMaterial({
        title: `${result.lesson.title} — ${titles[type]}`,
        type,
        content: `# ${titles[type]}\n\n**Lesson:** ${result.lesson.title}\n**Audience:** ${result.lesson.audience}\n\n## Learning Goal\n${result.lesson.objective}\n\n## Practice Stimulus\n${result.lesson.stimulus}\n\n## Student Task Prompts\n1. Analyze the sample source provided above. Identify two specific credibility indicators.\n2. In 2-3 sentences, defend which source you would recommend for an academic paper.\n3. Formulate one follow-up verification question you would investigate further.\n\n*(Note: For dynamic AI content generation, ensure GEMINI_API_KEY is active.)*`,
      });
    } finally {
      setIsLoadingMaterial(false);
    }
  };

  const handleUpdateLesson = (updated: LessonPlan) => {
    if (result) {
      setResult({ ...result, lesson: updated });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fc]">
      {/* Top Header */}
      <Header
        onNewPlan={handleClear}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenFramework={() => setIsFrameworkOpen(true)}
        hasApiKey={hasApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Editorial Subtitle & Context Hero */}
        <section className="space-y-1.5 no-print">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-blue-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pedagogical Planning Engine</span>
            <span>·</span>
            <span>Gemini 3.8 Flash + V3 Rule Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Instructional Lesson Planning Agent
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Constructs context-sensitive, 4-phase pedagogical lesson plans with authentic classroom stimuli, verified time-budgets, and observable learning objectives.
          </p>
        </section>

        {/* Input Form Panel */}
        <LessonForm
          formData={formData}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onClear={handleClear}
          isLoading={isLoading}
          hasApiKey={hasApiKey}
        />

        {/* Decision & Lesson Result Panel */}
        <div ref={resultRef}>
          <PlanResultView
            result={result}
            onOpenTimer={() => setIsTimerOpen(true)}
            onGenerateMaterial={handleGenerateMaterial}
            onUpdateLesson={handleUpdateLesson}
            isLoadingMaterial={isLoadingMaterial}
          />
        </div>

        {/* Footer / Transparency Disclaimer */}
        <footer className="pt-6 pb-12 border-t border-slate-200/80 text-xs text-slate-500 space-y-2 no-print">
          <p className="leading-relaxed">
            <strong>Professional Educator Notice:</strong> This application combines Gemini 3.8 Flash LLM pedagogical generation with rule-based instructional constraints. It does not access external student records, assign consequential course grades, or make psychological/clinical student diagnoses.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-400">
            <span>© Lesson Planning Agent AI</span>
            <span>·</span>
            <span>4-Phase Pedagogical Arc</span>
            <span>·</span>
            <span>Bloom's Taxonomy Compliant</span>
            <span>·</span>
            <button
              onClick={() => setIsFrameworkOpen(true)}
              className="text-blue-600 hover:underline"
            >
              View Decision Heuristics
            </button>
          </div>
        </footer>
      </main>

      {/* Modals */}
      {isTimerOpen && result?.lesson && (
        <ClassroomTimerModal
          lesson={result.lesson}
          onClose={() => setIsTimerOpen(false)}
        />
      )}

      {activeMaterial && (
        <MaterialModal
          material={activeMaterial}
          onClose={() => setActiveMaterial(null)}
        />
      )}

      {isPresetsOpen && (
        <PresetLibraryModal
          onSelect={(preset) => {
            setFormData({
              topic: preset.topic,
              audience: preset.audience,
              duration: preset.duration,
              setting: preset.setting,
              materials: preset.materials,
              objective: preset.objective,
              activities: preset.activities,
              each: preset.each,
              enginePreference: formData.enginePreference || 'gemini',
            });
          }}
          onClose={() => setIsPresetsOpen(false)}
        />
      )}

      {isFrameworkOpen && (
        <PedagogicalFrameworkModal
          onClose={() => setIsFrameworkOpen(false)}
        />
      )}
    </div>
  );
}
