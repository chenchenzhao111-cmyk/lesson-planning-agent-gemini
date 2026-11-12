export type TeachingSetting = 'Online' | 'In-person' | 'Hybrid';

export type AgentAction = 'AWAITING_INPUT' | 'GENERATE' | 'CLARIFY' | 'HUMAN_REVIEW';

export interface LessonPhase {
  name: string;
  minutes: number;
  goal: string;
  teacher: string;
  students: string;
  check: string;
}

export interface LessonPlan {
  title: string;
  audience: string;
  setting: string;
  duration: number;
  pack: string;
  objective: string;
  stimulus: string;
  scaffoldingStrategy?: string;
  phases: LessonPhase[];
  notes: string[];
}

export interface PlanDecisionResult {
  action: AgentAction;
  reason: string;
  message: string;
  lesson?: LessonPlan;
  engineUsed: 'gemini' | 'rules';
}

export interface LessonFormData {
  topic: string;
  audience: string;
  duration: number | string;
  setting: TeachingSetting | '';
  materials: string;
  objective: string;
  activities?: number | string;
  each?: number | string;
  enginePreference?: 'gemini' | 'rules';
}

export interface MaterialGenerationRequest {
  lesson: LessonPlan;
  type: 'worksheet' | 'rubric' | 'differentiation' | 'quick_quiz' | 'discussion_cards';
  notes?: string;
}

export interface GeneratedMaterial {
  title: string;
  type: string;
  content: string;
}
