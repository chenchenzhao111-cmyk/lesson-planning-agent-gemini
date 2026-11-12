import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Clock, Volume2, CheckCircle2 } from 'lucide-react';
import { LessonPlan } from '../types/lesson';

interface ClassroomTimerModalProps {
  lesson: LessonPlan;
  onClose: () => void;
}

export const ClassroomTimerModal: React.FC<ClassroomTimerModalProps> = ({ lesson, onClose }) => {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const currentPhase = lesson.phases[currentPhaseIdx] || lesson.phases[0];

  const [secondsRemaining, setSecondsRemaining] = useState(currentPhase.minutes * 60);
  const [isActive, setIsActive] = useState(false);

  // Update seconds when switching phases
  useEffect(() => {
    setSecondsRemaining(lesson.phases[currentPhaseIdx].minutes * 60);
    setIsActive(false);
  }, [currentPhaseIdx, lesson]);

  // Interval timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setSecondsRemaining(lesson.phases[currentPhaseIdx].minutes * 60);
    setIsActive(false);
  };

  const addMinute = () => {
    setSecondsRemaining(prev => prev + 60);
  };

  const nextPhase = () => {
    if (currentPhaseIdx < lesson.phases.length - 1) {
      setCurrentPhaseIdx(prev => prev + 1);
    }
  };

  const prevPhase = () => {
    if (currentPhaseIdx > 0) {
      setCurrentPhaseIdx(prev => prev - 1);
    }
  };

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPct =
    100 - (secondsRemaining / (lesson.phases[currentPhaseIdx].minutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{lesson.title}</h3>
              <p className="text-xs text-slate-500">Live Classroom Presentation Mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Stepper */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between overflow-x-auto gap-2">
          {lesson.phases.map((phase, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPhaseIdx(idx)}
              className={`flex-1 min-w-[120px] text-left px-3 py-2 rounded-xl transition-all border ${
                idx === currentPhaseIdx
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900 shadow-xs'
                  : 'bg-slate-50/60 border-slate-100 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                Phase {idx + 1}
              </div>
              <div className="text-xs font-semibold truncate text-slate-800">{phase.name}</div>
              <div className="text-[10px] text-slate-400 tabular-nums">{phase.minutes}m</div>
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Huge Timer Clock */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
            <div
              className="absolute bottom-0 left-0 h-1.5 bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
            <div className="text-xs font-semibold tracking-widest uppercase text-blue-300 mb-1">
              Phase {currentPhaseIdx + 1}: {currentPhase.name}
            </div>
            <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tight py-2 tabular-nums">
              {formattedTime}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={resetTimer}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={toggleTimer}
                className={`px-6 py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Timer</span>
                  </>
                )}
              </button>
              <button
                onClick={addMinute}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>+1 min</span>
              </button>
            </div>
          </div>

          {/* Teacher Cue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Teacher Action / Talking Prompt
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {currentPhase.teacher}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Learner Task
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {currentPhase.students}
              </p>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Observable Check for Understanding
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {currentPhase.check}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={prevPhase}
            disabled={currentPhaseIdx === 0}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Phase
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Phase {currentPhaseIdx + 1} of {lesson.phases.length}
          </span>
          <button
            onClick={nextPhase}
            disabled={currentPhaseIdx === lesson.phases.length - 1}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors flex items-center gap-1.5"
          >
            Next Phase
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
