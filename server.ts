import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { decideRuleBased } from './src/lib/rulePlanner';
import { LessonFormData, PlanDecisionResult } from './src/types/lesson';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';

const app = express();
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Status check endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!ai,
    engine: ai ? 'gemini-3.8-flash' : 'rule-based',
  });
});

// Helper for timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errMsg = 'Operation timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms)),
  ]);
}

// Lesson planning endpoint
app.post('/api/plan-lesson', async (req, res) => {
  const formData: LessonFormData = req.body;
  const enginePref = formData.enginePreference || (ai ? 'gemini' : 'rules');

  // If user requested rules or Gemini is not initialized, run rule-based engine
  if (enginePref === 'rules' || !ai) {
    const result = decideRuleBased(formData);
    return res.json(result);
  }

  // Use Gemini 3.8 Flash for deep pedagogical planning
  try {
    const prompt = `
You are an expert pedagogical lesson planning agent and instructional designer.
Analyze the teacher's lesson request and decide whether to GENERATE a structured 4-phase lesson plan, CLARIFY missing/unclear goals, or request HUMAN_REVIEW for conflicts/boundary issues.

Teacher Request:
- Topic: ${formData.topic || '(empty)'}
- Learners / Audience: ${formData.audience || '(empty)'}
- Duration (minutes): ${formData.duration || '(empty)'}
- Teaching setting: ${formData.setting || '(empty)'}
- Available materials / restrictions: ${formData.materials || '(None specified)'}
- Learning objective: ${formData.objective || '(empty)'}
- Activity constraints: ${formData.activities ? `${formData.activities} activities` : 'None specified'}, ${formData.each ? `${formData.each} min each` : 'None specified'}

Decision Guidelines:
1. "CLARIFY":
   - Essential information is missing (topic, audience, duration, setting, or objective).
   - Duration is < 10 mins (too short for 4 phases) or > 240 mins.
   - Objective is too broad/unobservable (e.g. "learn stuff", "talk about physics") with no observable action verb.
   - Activity timing conflicts (e.g., specified activity count without minutes per activity).

2. "HUMAN_REVIEW":
   - Requests claiming guaranteed 100% mastery ("guarantee all students pass").
   - Out of scope requests (e.g. automated high-stakes clinical diagnosis or punitive grading).
   - Incompatible setting/materials (e.g. Online instruction requested with "no internet connection").
   - Activity time exceeds total duration (e.g., 3 activities * 20 min in a 40 min class).

3. "GENERATE":
   - When required details are present and sound.
   - Provide a highly specific, authentic lesson plan.
   - Create a realistic, ready-to-use "stimulus" (e.g., realistic source texts, contrasting examples, math problem with common misconception, sample argument).
   - Provide 4 structured phases:
     Phase 1: Activate prior knowledge / Hook
     Phase 2: Direct instruction & Modeling
     Phase 3: Guided/Independent practice & Collaboration
     Phase 4: Formative assessment & Reflection
   - Each phase MUST have:
     - "name": descriptive title
     - "minutes": integer minutes (the 4 phases must add up exactly to the total duration: ${Number(formData.duration) || 45})
     - "goal": clear learning purpose
     - "teacher": concrete teacher script, guiding questions, or actions (tailored to materials like ${formData.materials || 'default'})
     - "students": concrete learner actions and engagement channel (respecting setting: ${formData.setting})
     - "check": observable evidence of learning / formative check criteria
   - "scaffoldingStrategy": 1-2 sentence recommendation on how to support novices or challenge advanced learners in this cohort.
   - "notes": 3-4 practical teacher review notes (classroom management, common misconceptions, accessibility).

Return valid JSON adhering to the specified schema.
`;

    const apiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: 'Must be GENERATE, CLARIFY, or HUMAN_REVIEW',
            },
            reason: {
              type: Type.STRING,
              description: 'Brief 1-line reason for the agent decision',
            },
            message: {
              type: Type.STRING,
              description: 'Explanatory message, guidance, or next steps',
            },
            lesson: {
              type: Type.OBJECT,
              description: 'Present only when action is GENERATE',
              properties: {
                title: { type: Type.STRING },
                audience: { type: Type.STRING },
                setting: { type: Type.STRING },
                duration: { type: Type.INTEGER },
                pack: { type: Type.STRING, description: 'Instructional methodology label' },
                objective: { type: Type.STRING },
                stimulus: { type: Type.STRING, description: 'Authentic classroom example, prompt or text passage' },
                scaffoldingStrategy: { type: Type.STRING },
                phases: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      minutes: { type: Type.INTEGER },
                      goal: { type: Type.STRING },
                      teacher: { type: Type.STRING },
                      students: { type: Type.STRING },
                      check: { type: Type.STRING },
                    },
                    required: ['name', 'minutes', 'goal', 'teacher', 'students', 'check'],
                  },
                },
                notes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
          },
          required: ['action', 'reason', 'message'],
        },
      },
    });

    // 10 second timeout for Gemini call
    const response = await withTimeout(apiCall, 10000);

    const parsed = JSON.parse(response.text || '{}');
    const result: PlanDecisionResult = {
      action: parsed.action || 'GENERATE',
      reason: parsed.reason || 'AI pedagogical analysis complete',
      message: parsed.message || '',
      lesson: parsed.lesson,
      engineUsed: 'gemini',
    };

    return res.json(result);
  } catch (err: any) {
    console.error('Gemini API call failed or timed out, falling back to rule-based engine:', err?.message || err);
    const fallback = decideRuleBased(formData);
    fallback.message += ' (Evaluated using the instant rule-based engine)';
    fallback.engineUsed = 'rules';
    return res.json(fallback);
  }
});

// Endpoint to generate accompanying teaching materials
app.post('/api/generate-material', async (req, res) => {
  const { lesson, type, notes } = req.body;

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key is not configured for material generation.',
    });
  }

  try {
    const typeDescriptions: Record<string, string> = {
      worksheet: 'Printable student activity worksheet with guided prompts, stimulus excerpt, and blank response spaces',
      rubric: 'Formative assessment rubric with 3-tier criteria (Developing, Proficient, Advanced) and an exit ticket with an exemplar student response',
      differentiation: 'Differentiated instruction strategy guide: adaptations for Struggling / ELL learners, High-Achieving extensions, and Low-Tech / Offline alternatives',
      quick_quiz: '3 quick formative check questions with answer keys, common misconceptions, and diagnostic feedback',
      discussion_cards: '4-6 student pair/group discussion prompts formatted as ready-to-print discussion task cards',
    };

    const targetDesc = typeDescriptions[type] || 'Instructional support resource';

    const prompt = `
You are an expert instructional designer assisting a teacher.
Based on this lesson plan:
- Title: ${lesson.title}
- Audience: ${lesson.audience}
- Setting: ${lesson.setting} (${lesson.duration} minutes)
- Objective: ${lesson.objective}
- Classroom Stimulus / Example: ${lesson.stimulus}
- Instructional Approach: ${lesson.pack}

Generate: ${targetDesc}
Teacher additional notes: ${notes || 'None'}

Please format your response in clean Markdown with appropriate headings, clear instructions, and ready-to-use classroom text. Keep it practical, directly aligned with the objective, and immediately usable.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      title: `${lesson.title} — ${type.replace('_', ' ').toUpperCase()}`,
      type,
      content: response.text || '',
    });
  } catch (err: any) {
    console.error('Material generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate material' });
  }
});

// Setup dev server with Vite or production static serving
async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
