import React from 'react';
import { X, CheckCircle2, ShieldAlert, Cpu, BookOpen, Layers, Award } from 'lucide-react';

interface PedagogicalFrameworkModalProps {
  onClose: () => void;
}

export const PedagogicalFrameworkModal: React.FC<PedagogicalFrameworkModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Instructional Design Architecture</h3>
              <p className="text-xs text-slate-500">Agent Decision Engine & Pedagogical Principles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1: 4-Phase Architecture */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-blue-600" />
              1. The 4-Phase Instructional Model
            </h4>
            <p className="text-slate-600">
              The agent organizes every lesson into an evidence-based pedagogical sequence that balances direct instruction with active student engagement:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-blue-700 block mb-1">Phase 1: Prior Knowledge Activation</span>
                Connects learner background knowledge to the new objective through an authentic hook, question, or diagnostic check.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-indigo-700 block mb-1">Phase 2: Modeling & Demonstration</span>
                Explicit teacher walkthrough using worked examples, criteria rubrics, and non-examples.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-sky-700 block mb-1">Phase 3: Active Application</span>
                Independent, paired, or small-group problem solving with structured sentence frames and peer response channels.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-emerald-700 block mb-1">Phase 4: Formative Evidence</span>
                Exit tickets, quick polls, or written justifications providing observable evidence of individual understanding.
              </div>
            </div>
          </div>

          {/* Section 2: Agent Boundary Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              2. Ethical Boundaries & Validation Guardrails
            </h4>
            <p className="text-slate-600">
              Unlike generic chatbots, this agent strictly adheres to educational safety boundaries:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1 text-xs">
              <li>
                <strong>No Consequential Automated Grading:</strong> The agent cannot assign student course grades or deliver individual psychological/learning diagnoses.
              </li>
              <li>
                <strong>No False Mastery Guarantees:</strong> Claims that "100% of students will master" trigger human review, reinforcing that learning outcomes require teacher judgment.
              </li>
              <li>
                <strong>Constraint Feasibility Checking:</strong> Rejects unworkable schedules where sub-activity minutes exceed total class duration.
              </li>
              <li>
                <strong>Channel-Specific Scaffolding:</strong> Adapts prompts specifically to the teaching setting (e.g. Chat waterfall for online without breakout rooms; whiteboard pairs for in-person).
              </li>
            </ul>
          </div>

          {/* Section 3: Dual Engine Choice */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Cpu className="w-4 h-4 text-purple-600" />
              3. Dual Engine Architecture
            </h4>
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs space-y-1.5">
              <p>
                <strong>Gemini 3.8 Flash (Server-Side LLM):</strong> Leverages generative intelligence to craft authentic domain-specific stimuli, customized teacher scripts, and tailored differentiation.
              </p>
              <p>
                <strong>Classic V3 Rule Engine:</strong> Deterministic, offline-capable fallback preserving the exact decision heuristics and timing ratios from the original prototype.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
