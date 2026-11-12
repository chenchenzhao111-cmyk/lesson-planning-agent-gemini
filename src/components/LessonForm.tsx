import React, { useState } from 'react';
import { Sparkles, Sliders, AlertCircle, RotateCcw, Lightbulb, Play, ChevronDown, ChevronUp, Bot, ShieldCheck } from 'lucide-react';
import { LessonFormData, TeachingSetting } from '../types/lesson';
import { PRESET_LESSONS } from '../data/presets';

interface LessonFormProps {
  formData: LessonFormData;
  onChange: (data: Partial<LessonFormData>) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading: boolean;
  hasApiKey: boolean;
}

export const LessonForm: React.FC<LessonFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onClear,
  isLoading,
  hasApiKey,
}) => {
  const [showConstraints, setShowConstraints] = useState(false);
  const [showObjectiveTips, setShowObjectiveTips] = useState(false);

  const durationOptions = [30, 45, 50, 60, 90];

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = PRESET_LESSONS.find(p => p.name === e.target.value);
    if (selected) {
      onChange({
        topic: selected.topic,
        audience: selected.audience,
        duration: selected.duration,
        setting: selected.setting as TeachingSetting,
        materials: selected.materials,
        objective: selected.objective,
        activities: selected.activities,
        each: selected.each,
        enginePreference: formData.enginePreference || 'gemini',
      });
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(32,49,74,0.05)] p-6 sm:p-8 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Describe your lesson
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The agent validates constraints and constructs a complete 4-phase pedagogical plan.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="preset-select" className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Load sample:
          </label>
          <select
            id="preset-select"
            onChange={handleSelectPreset}
            defaultValue=""
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="" disabled>Choose a curriculum sample...</option>
            {PRESET_LESSONS.map(p => (
              <option key={p.name} value={p.name}>
                {p.category}: {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Topic */}
        <div>
          <label htmlFor="topic" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Lesson Topic <span className="text-blue-600">*</span>
          </label>
          <input
            id="topic"
            type="text"
            value={formData.topic}
            onChange={e => onChange({ topic: e.target.value })}
            placeholder="e.g. Evaluating Online Information or Cellular Respiration"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* 2-Column: Audience & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="audience" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Learners / Audience <span className="text-blue-600">*</span>
            </label>
            <input
              id="audience"
              type="text"
              value={formData.audience}
              onChange={e => onChange({ audience: e.target.value })}
              placeholder="e.g. First-year college students, 8th Grade"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="duration" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Duration (minutes) <span className="text-blue-600">*</span>
              </label>
              <div className="flex items-center gap-1">
                {durationOptions.map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => onChange({ duration: mins })}
                    className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                      Number(formData.duration) === mins
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
            <input
              id="duration"
              type="number"
              min="10"
              max="240"
              value={formData.duration}
              onChange={e => onChange({ duration: e.target.value })}
              placeholder="45"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* 2-Column: Setting & Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="setting" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Teaching Setting <span className="text-blue-600">*</span>
            </label>
            <select
              id="setting"
              value={formData.setting}
              onChange={e => onChange({ setting: e.target.value as TeachingSetting })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">Select teaching environment</option>
              <option value="Online">Online (Virtual Classroom)</option>
              <option value="In-person">In-person (Physical Classroom)</option>
              <option value="Hybrid">Hybrid (Mixed Remote & In-person)</option>
            </select>
          </div>

          <div>
            <label htmlFor="materials" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Available Materials / Constraints (optional)
            </label>
            <input
              id="materials"
              type="text"
              value={formData.materials}
              onChange={e => onChange({ materials: e.target.value })}
              placeholder="e.g. Online chat only; no breakout rooms or slides"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Learning Objective */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="objective" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Learning Objective / Request <span className="text-blue-600">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowObjectiveTips(!showObjectiveTips)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showObjectiveTips ? 'Hide tips' : 'Objective guidance'}</span>
            </button>
          </div>

          {showObjectiveTips && (
            <div className="mb-2 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Bloom's Taxonomy Guideline:</p>
              <p>
                Use an observable, measurable action verb (e.g. <em>compare, explain, justify, synthesize, solve, construct</em>) instead of passive goals (e.g. <em>"learn about"</em>).
              </p>
              <p className="text-slate-600">
                Example: <span className="text-blue-800">"Compare the credibility of two online sources and justify a choice using evidence."</span>
              </p>
            </div>
          )}

          <textarea
            id="objective"
            rows={3}
            value={formData.objective}
            onChange={e => onChange({ objective: e.target.value })}
            placeholder="e.g. Compare the credibility of two online sources and support a choice with evidence."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-y min-h-[76px]"
          />
          <p className="text-xs text-slate-400 mt-1">
            Specify the demonstrable outcome. Physical or tool restrictions should be stated in the materials field above.
          </p>
        </div>

        {/* Collapsible Activity Constraints */}
        <div className="border border-slate-200/80 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConstraints(!showConstraints)}
            className="w-full px-4 py-2.5 bg-slate-50/70 hover:bg-slate-100/70 text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Optional Activity Scheduling Constraints
            </span>
            {showConstraints ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showConstraints && (
            <div className="p-4 bg-white border-t border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activities" className="block text-xs font-medium text-slate-600 mb-1">
                    Number of requested activities
                  </label>
                  <input
                    id="activities"
                    type="number"
                    min="1"
                    value={formData.activities}
                    onChange={e => onChange({ activities: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="each" className="block text-xs font-medium text-slate-600 mb-1">
                    Minutes per activity
                  </label>
                  <input
                    id="each"
                    type="number"
                    min="1"
                    value={formData.each}
                    onChange={e => onChange({ each: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                These act as hard scheduling constraints. If requested activity time leaves too little room for opening, explanation, and assessment, the agent flags it for teacher review.
              </p>
            </div>
          )}
        </div>

        {/* Engine Selection & Execution Controls */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
          {/* Engine Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onChange({ enginePreference: 'gemini' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                formData.enginePreference !== 'rules'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Gemini 3.8 Flash AI</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ enginePreference: 'rules' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                formData.enginePreference === 'rules'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Classic V3 Rules</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onSubmit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing & Planning...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Ask Agent to Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
