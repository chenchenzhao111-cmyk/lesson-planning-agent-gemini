import { LessonFormData, PlanDecisionResult, LessonPhase, LessonPlan } from '../types/lesson';

const numberWords: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fortyfive: 45, sixty: 60
};

const NUM_PATTERN = '(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|sixty)';

export function asNum(s?: string): number {
  if (!s) return 0;
  const key = s.toLowerCase().replace(/[-\s]/g, '');
  return numberWords[key] ?? (Number(s) || 0);
}

export function parseActivityRequest(d: LessonFormData) {
  const request = ((d.objective || '') + ' ' + (d.topic || '')).toLowerCase();
  const countRe = new RegExp('(?:include|plan|create|with|have|design|requiring?|need)\\s+' + NUM_PATTERN + '\\s+(?:separate\\s+)?activities', 'i');
  const eachRe = new RegExp('(?:lasting|of|for|each\\s+lasting|with)\\s+' + NUM_PATTERN + '\\s*(?:minutes?|mins?)\\s+each', 'i');
  const allocatedRe = new RegExp(NUM_PATTERN + '\\s*(?:minutes?|mins?)\\s+(?:allocated|assigned|given|dedicated)\\s+to\\s+each\\s+(?:one|activity)', 'i');
  const eachBeforeRe = new RegExp(NUM_PATTERN + '\\s*(?:minutes?|mins?)\\s+per\\s+activity', 'i');

  const countMatch = request.match(countRe);
  const timeMatch = request.match(eachRe) || request.match(allocatedRe) || request.match(eachBeforeRe);
  const explicitCount = String(d.activities ?? '').trim();
  const explicitEach = String(d.each ?? '').trim();

  return {
    count: explicitCount ? Number(explicitCount) : (countMatch ? asNum(countMatch[1]) : 0),
    each: explicitEach ? Number(explicitEach) : (timeMatch ? asNum(timeMatch[1]) : 0),
    hasCount: !!explicitCount || !!countMatch,
    hasEach: !!explicitEach || !!timeMatch
  };
}

export function classify(topic: string, objective: string): string {
  const q = (topic + ' ' + objective).toLowerCase();
  if (/evaluat.*(?:online|source|information)|credib|misinformation|fact.check|reliable source|media literacy|verify.*source/.test(q)) return 'sources';
  if (/thesis|paragraph|academic writing|essay|argumentative writing|topic sentence/.test(q)) return 'writing';
  if (/sampl(e|ing)|convenience sample|random sample/.test(q)) return 'sampling';
  if (/sleep|stress/.test(q)) return 'sleep';
  if (/climate change|global warming|greenhouse/.test(q)) return 'climate';
  if (/fraction|numerator|denominator/.test(q)) return 'fractions';
  if (/artificial intelligence|\bai\b|generative ai|algorithmic bias|ai literacy/.test(q)) return 'ai';
  return 'general';
}

export function analyzeResources(setting: string, raw: string) {
  const x = (raw || '').toLowerCase();
  const online = setting.toLowerCase() === 'online';
  const onlyChat = /(?:online\s+)?chat\s+only|only\s+(?:online\s+)?chat/.test(x);
  const noBreakout = onlyChat || /\b(no|without|unavailable|cannot use|not available)\s+(?:any\s+)?breakout/.test(x);
  const noSlides = onlyChat || /\b(no|without|unavailable|cannot use|not available)\s+slides?/.test(x);
  const noGroups = /\b(no|without|avoid)\s+(?:group|pair|partner)/.test(x) || /individual\s+work\s+only/.test(x);
  const noChat = /\b(no|without|unavailable|cannot use)\s+(?:online\s+)?chat/.test(x);
  const slides = !noSlides && /slides?|powerpoint|presentation/.test(x);
  const breakout = online && !noBreakout && /breakout/.test(x);
  const chat = online && !noChat && (onlyChat || /chat|text box|messaging/.test(x));
  const board = !online && /whiteboard|chalkboard|board/.test(x);
  const paper = /paper|worksheet|handout|sticky note/.test(x);
  const lowBandwidth = /low bandwidth|limited internet|low-bandwidth/.test(x);
  return { online, onlyChat, noBreakout, noSlides, noGroups, noChat, slides, breakout, chat, board, paper, lowBandwidth, raw: (raw || '').trim() };
}

function channel(resources: ReturnType<typeof analyzeResources>): string {
  if (resources.online) {
    if (resources.chat) return 'whole-class text chat';
    if (resources.lowBandwidth) return 'a short low-bandwidth written response';
    return 'the course platform’s text-response space';
  }
  if (resources.board) return 'the whiteboard and a short spoken response';
  if (resources.paper) return 'paper and a short spoken response';
  return 'a short individual written or spoken response';
}

function participation(resources: ReturnType<typeof analyzeResources>): string {
  if (resources.online) {
    if (resources.breakout) return 'Pairs work in the available breakout rooms, then share one conclusion in the main room.';
    if (resources.chat) return 'Students first type their own answers in the shared chat, then respond to a peer’s idea in that same chat.';
    return 'Students submit individual responses in the main session; the teacher discusses two contrasting responses.';
  }
  if (resources.noGroups) return 'Students work individually; the teacher invites volunteers to explain their reasoning.';
  return 'Students compare responses with a nearby partner and explain one revision to the whole class.';
}

function evidenceMode(r: ReturnType<typeof analyzeResources>): string {
  return r.online && r.chat ? 'a brief message in the chat' : r.board ? 'a short explanation on the whiteboard' : r.paper ? 'a completed written response' : 'a brief individual response';
}

function learnerScaffold(a: string): string {
  const x = a.toLowerCase();
  if (/first.year|beginner|novice|no .*background|elementary|high school|k-12/.test(x)) return 'Offer a one-sentence response frame and show one worked example before independent practice.';
  if (/graduate|advanced|experienced|senior/.test(x)) return 'Ask learners to justify their choices and name one limitation or counterargument.';
  return 'Invite learners to give a reason or example, not only a short answer.';
}

function teachingPack(kind: string, ctx: { topic: string; objective: string; resources: ReturnType<typeof analyzeResources>; audience: string }): { label: string; stimulus: string; phases: Omit<LessonPhase, 'minutes'>[] } {
  const { topic, objective, resources: res, audience } = ctx;
  const ch = channel(res);
  const peer = participation(res);
  const evidence = evidenceMode(res);
  const commonScaffold = learnerScaffold(audience);

  if (kind === 'sources') {
    const examples = 'Hypothetical Source A: a dated article with a named author, a stated method and links to its evidence.\nHypothetical Source B: an anonymous undated post making the same claim without links or supporting evidence.';
    return {
      label: 'Source credibility comparison',
      stimulus: examples,
      phases: [
        { name: 'Activate prior knowledge', goal: 'Identify features that make a source credible.', teacher: 'Share the two hypothetical source descriptions. Ask: “Which source would you trust first, and what clue influenced your choice?”', students: 'Submit a quick A/B choice with one reason through ' + ch + '.', check: 'Collect one credibility cue from at least two different responses.' },
        { name: 'Model a credibility check', goal: 'Use explicit criteria instead of relying on appearance.', teacher: 'Demonstrate how to check author, evidence, date and purpose using Source A and B. Name one limitation: these cues help, but do not prove that a claim is true.', students: 'Apply the four checks to Source B and identify which supporting details are missing.', check: 'Ask students to name the difference between “credible presentation” and “verified claim.”' },
        { name: 'Compare and justify', goal: 'Compare two sources and defend a choice with evidence.', teacher: 'Give the prompt: “Which source is more credible? Use two details from the source descriptions and acknowledge one uncertainty.” ' + commonScaffold, students: peer + ' Then post: “I would use Source __ because __ and __. I would still check __.”', check: 'Look for a clear selection, two specific source features, and a remaining verification step.' },
        { name: 'Check learning and reflect', goal: 'Show evidence-based source evaluation independently.', teacher: 'Give an exit ticket: “Choose A or B, cite two credibility indicators, and state one additional check you would do.”', students: 'Submit ' + evidence + '.', check: 'Success = comparison plus two relevant indicators and one appropriate follow-up check.' }
      ]
    };
  }

  if (kind === 'writing') {
    const examples = 'Weak thesis: “Campus libraries are important.”\nMore arguable thesis: “Campus libraries should extend weekend hours because students with jobs need reliable quiet study spaces.”';
    return {
      label: 'Thesis statement practice',
      stimulus: examples,
      phases: [
        { name: 'Notice what makes a claim clear', goal: 'Distinguish a broad topic statement from an arguable thesis.', teacher: 'Show both sample thesis statements. Ask which one identifies a position and reason.', students: 'Identify the claim, scope and reason in the stronger example through ' + ch + '.', check: 'Look for mention of a specific position and a defensible reason.' },
        { name: 'Unpack a strong model', goal: 'Use criteria to revise vague claims.', teacher: 'Model a revision using three checks: specific topic, defensible claim, and clear reason. Avoid claiming a good thesis is guaranteed to earn a grade.', students: 'Annotate which phrases satisfy the three checks.', check: 'Ask for a one-sentence explanation of why the weaker thesis is less useful.' },
        { name: 'Write and revise', goal: 'Draft a clear, arguable thesis.', teacher: 'Prompt: “Should campus libraries extend weekend hours? Write a thesis with a position and a reason.” ' + commonScaffold, students: 'Write a one-sentence thesis. ' + peer + ' Revise it using the three checks.', check: 'Look for a stance, narrow scope and at least one supporting reason.' },
        { name: 'Exit ticket', goal: 'Demonstrate independent thesis writing.', teacher: 'Ask for a final thesis statement plus a short note identifying its claim and supporting reason.', students: 'Submit ' + evidence + '.', check: 'Success = arguable position, specific focus and clear reason.' }
      ]
    };
  }

  if (kind === 'sampling') {
    const examples = 'Study goal: estimate how often all students at a college use the library.\nOption A: ask 30 people who happen to enter the library at noon.\nOption B: randomly select 30 names from a complete student roster and invite them to respond.';
    return {
      label: 'Sampling-method decision',
      stimulus: examples,
      phases: [
        { name: 'Start with a research choice', goal: 'Identify which participants a study needs to represent.', teacher: 'Introduce the college library-use scenario and ask which sample is more representative of the full student body.', students: 'Select A or B and give one reason through ' + ch + '.', check: 'Check that learners distinguish a population from those who are easy to reach.' },
        { name: 'Explain two sampling methods', goal: 'Distinguish random from convenience sampling.', teacher: 'Label A as convenience sampling and B as random selection. Model why A is easier but could overrepresent library visitors; B can reduce selection bias but still faces nonresponse.', students: 'Identify one tradeoff for each method.', check: 'Students should correctly match both methods and explain one possible limitation.' },
        { name: 'Make and defend a decision', goal: 'Choose a method for a research question.', teacher: 'Ask: “To estimate library use for the whole college, which option is preferable, and what might still make its results unrepresentative?” ' + commonScaffold, students: peer + ' Provide a choice, a reason, and one remaining risk.', check: 'Look for a justified method choice and an appropriate bias or nonresponse concern.' },
        { name: 'Exit ticket', goal: 'Transfer sampling reasoning.', teacher: 'Ask learners to choose a sampling method to survey students about commuting and justify it.', students: 'Submit ' + evidence + '.', check: 'Success = a method, rationale linked to the population, and one possible limitation.' }
      ]
    };
  }

  if (kind === 'sleep') {
    const examples = 'Hypothetical case: During exam week, a student sleeps much less than usual and reports feeling more stressed. A second student has a different routine and reports feeling less stressed.';
    return {
      label: 'Sleep–stress explanation',
      stimulus: examples,
      phases: [
        { name: 'Begin with a relevant case', goal: 'Identify a possible relationship between sleep and stress.', teacher: 'Present the hypothetical exam-week case. Ask: “What might connect sleep routines and feelings of stress?”', students: 'Offer one possible explanation through ' + ch + '.', check: 'Listen for a relationship rather than an unsupported guaranteed cause.' },
        { name: 'Model an explanation', goal: 'Explain how stress and sleep can influence one another.', teacher: 'Draw or explain a two-way example: stress can make sleep harder; reduced sleep may also affect mood and coping. Avoid diagnosing individual learners.', students: 'Explain one direction of the relationship and identify why the example alone cannot prove causation.', check: 'Look for the two directions and one uncertainty.' },
        { name: 'Apply to a new scenario', goal: 'Connect a sleep-related factor to a plausible stress response.', teacher: 'Ask learners to analyze a hypothetical student balancing exams and work. ' + commonScaffold, students: peer + ' Produce a short chain: “Situation → sleep pattern → possible stress impact,” plus one alternative explanation.', check: 'Look for a plausible mechanism and acknowledgement of uncertainty.' },
        { name: 'Check and reflect', goal: 'Demonstrate understanding without overclaiming.', teacher: 'Exit ticket: “Describe one way sleep and stress may be connected; give an example and name one reason to avoid a guaranteed conclusion.”', students: 'Submit ' + evidence + '.', check: 'Success = a clear explanation, example and limitation.' }
      ]
    };
  }

  if (kind === 'climate') {
    const examples = 'Hypothetical local decision: a campus is deciding whether to improve building insulation, increase bus service, or expand tree cover. Different actions address different emissions or impacts.';
    return {
      label: 'Climate explanation and solutions',
      stimulus: examples,
      phases: [
        { name: 'Elicit initial ideas', goal: 'Connect human activities with climate change.', teacher: 'Give the hypothetical campus decision. Ask: “Which options might reduce emissions, and which might primarily reduce local impacts?”', students: 'Sort the three options through ' + ch + '.', check: 'Check the difference between mitigation and adaptation.' },
        { name: 'Build a cause-and-effect model', goal: 'Explain a basic greenhouse-gas pathway.', teacher: 'Model a simple chain: activity → greenhouse-gas emissions → warming → possible impacts. Differentiate scientific mechanisms from proposed solutions.', students: 'Explain the chain using an example.', check: 'Look for a sensible link between emissions, warming and impacts.' },
        { name: 'Evaluate a response', goal: 'Justify an action using a cause-and-effect explanation.', teacher: 'Ask students to select one campus action, identify the mechanism, and name a tradeoff. ' + commonScaffold, students: peer + ' Support the choice with reasoning rather than an unsupported factual number.', check: 'Look for a stated action, plausible mechanism and limitation.' },
        { name: 'Check understanding', goal: 'Explain a cause and evaluate one possible solution.', teacher: 'Exit ticket: “Describe a contributor to climate change and justify one response, including a tradeoff.”', students: 'Submit ' + evidence + '.', check: 'Success = a correct basic causal chain and a reasoned response.' }
      ]
    };
  }

  if (kind === 'fractions') {
    const examples = 'Compare 3/4 and 2/3. Which is larger? One route: rewrite both with denominator 12 (9/12 and 8/12).';
    return {
      label: 'Fraction comparison',
      stimulus: examples,
      phases: [
        { name: 'Predict before calculating', goal: 'Activate knowledge of equivalent fractions.', teacher: 'Present 3/4 versus 2/3 and ask for an initial comparison.', students: 'Choose the larger fraction and describe the strategy through ' + ch + '.', check: 'Notice whether students compare denominators only.' },
        { name: 'Model a comparison', goal: 'Use equivalent fractions to compare values.', teacher: 'Work through 3/4 = 9/12 and 2/3 = 8/12, explaining why equal denominators allow comparison.', students: 'Explain the conversion step.', check: 'Students should identify 3/4 as larger and justify it.' },
        { name: 'Practice a transfer example', goal: 'Apply the method independently.', teacher: 'Prompt: “Compare 5/6 and 3/4 using a common denominator, then explain your answer.” ' + commonScaffold, students: peer + ' Show the steps and compare results.', check: 'Look for 10/12 > 9/12 and correct reasoning.' },
        { name: 'Exit ticket', goal: 'Demonstrate the comparison method.', teacher: 'Ask: “Which is larger, 2/5 or 1/2? Show one method.”', students: 'Submit ' + evidence + '.', check: 'Success = 1/2 is larger with a valid calculation or number-line explanation.' }
      ]
    };
  }

  if (kind === 'ai') {
    const examples = 'Hypothetical AI response: “All information generated by AI is accurate, so you never need to check sources.” The statement is intentionally unreliable.';
    return {
      label: 'Critical AI literacy',
      stimulus: examples,
      phases: [
        { name: 'Notice an AI claim', goal: 'Identify why a fluent answer may still require verification.', teacher: 'Display the hypothetical inaccurate AI statement. Ask learners to identify a problem with it.', students: 'State one concern through ' + ch + '.', check: 'Look for mention of errors, missing evidence, bias or privacy.' },
        { name: 'Model a verification process', goal: 'Distinguish using AI from trusting it uncritically.', teacher: 'Model three checks: verify against credible sources, examine possible bias, and avoid entering sensitive personal information.', students: 'Name which check would help with the example claim.', check: 'Learners should distinguish evidence checking from fluency or confidence.' },
        { name: 'Evaluate a case', goal: 'Decide when and how to use AI responsibly.', teacher: 'Give the case: “A tool suggests a citation with no link or publication details.” Ask learners to propose a safe next step. ' + commonScaffold, students: peer + ' Draft a check-before-use protocol.', check: 'Look for independent verification and no fabricated evidence.' },
        { name: 'Exit ticket', goal: 'State a responsible-use decision.', teacher: 'Ask: “Name one useful AI task, one verification step and one task you would not delegate to AI.”', students: 'Submit ' + evidence + '.', check: 'Success = balanced use case, credible verification and meaningful boundary.' }
      ]
    };
  }

  const firstVerb = (objective.match(/\b(compare|explain|evaluate|justify|write|design|apply|identify|analyze|describe|solve|create)\b/i) || [])[1] || 'explain';
  const item = objective.replace(/[.!?]+$/, '').trim();

  return {
    label: 'General objective-aligned draft (teacher customization needed)',
    stimulus: 'Teacher preparation: supply one authentic example, short text, case or problem about “' + topic + '”. Verify the example before teaching.',
    phases: [
      { name: 'Activate relevant ideas', goal: 'Connect existing understanding to the stated objective.', teacher: 'Introduce a short teacher-selected example of ' + topic + '. Ask one focused question: “What do we already know that will help us ' + firstVerb.toLowerCase() + ' this?”', students: 'Respond through ' + ch + '.', check: 'Collect one relevant prior idea or misconception.' },
      { name: 'Model the targeted thinking', goal: 'Show how to approach the learning objective.', teacher: 'Model one worked example addressing: “' + item + '.” Explain each reasoning step with a teacher-verified example.', students: 'Name the key step and why it matters.', check: 'Ask learners to explain the step rather than repeat the model.' },
      { name: 'Independent application', goal: 'Use the target skill on a second case.', teacher: 'Provide a different teacher-verified example of ' + topic + ' and request a short written explanation or decision aligned with: “' + item + '.” ' + commonScaffold, students: peer + ' Produce an answer that includes a claim and a reason.', check: 'Look for specific evidence that the chosen objective was achieved.' },
      { name: 'Exit ticket', goal: 'Collect assessable evidence for the stated objective.', teacher: 'Ask learners to complete the objective in their own words or demonstrate it in a short response: “' + item + '.”', students: 'Submit ' + evidence + '.', check: 'Success = observable evidence of the target action, not simply participation.' }
    ]
  };
}

export function allocateTime(duration: number, objective: string): number[] {
  const skill = /\b(write|solve|design|create|apply|practice|demonstrate)\b/i.test(objective);
  const compare = /\b(compare|evaluate|justify|analy[sz]e|debate)\b/i.test(objective);
  const ratios = skill ? [0.12, 0.20, 0.50, 0.18] : compare ? [0.15, 0.20, 0.45, 0.20] : [0.16, 0.24, 0.39, 0.21];
  const mins = ratios.map(r => Math.floor(duration * r));
  let rem = duration - mins.reduce((a, b) => a + b, 0);
  for (let i = 0; rem > 0; i = (i + 1) % 4, rem--) mins[i]++;
  return mins;
}

export function decideRuleBased(d: LessonFormData): PlanDecisionResult {
  const topic = String(d.topic || '').trim();
  const audience = String(d.audience || '').trim();
  const setting = String(d.setting || '').trim();
  const objective = String(d.objective || '').trim();
  const materials = String(d.materials || '').trim();
  const durationRaw = String(d.duration ?? '').trim();
  const duration = Number(durationRaw);
  const requests = parseActivityRequest(d);

  const missing: string[] = [];
  if (!topic) missing.push('lesson topic');
  if (!audience) missing.push('learner group');
  if (!durationRaw || !Number.isInteger(duration) || duration <= 0) missing.push('valid positive duration in whole minutes');
  if (!setting) missing.push('teaching setting');
  if (!objective) missing.push('observable learning objective');

  if (missing.length) {
    return {
      action: 'CLARIFY',
      reason: 'Essential lesson information is missing or invalid',
      message: 'Please provide: ' + missing.join(', ') + '.',
      engineUsed: 'rules'
    };
  }

  if (!['Online', 'In-person', 'Hybrid'].includes(setting)) {
    return {
      action: 'CLARIFY',
      reason: 'Unrecognized teaching setting',
      message: 'Please select Online, In-person, or Hybrid.',
      engineUsed: 'rules'
    };
  }

  if (/\b(learn something|know something|talk about|understand stuff|do something|teach something)\b/i.test(objective) || objective.toLowerCase().trim().replace(/[.!?]/g, '').length < 8) {
    return {
      action: 'CLARIFY',
      reason: 'Learning objective needs clarification',
      message: 'Please describe an observable outcome (for example: “compare two sources and justify a choice using evidence”) rather than a broad or unclear goal.',
      engineUsed: 'rules'
    };
  }

  if (duration < 10) {
    return {
      action: 'CLARIFY',
      reason: 'Not enough time for a four-phase lesson',
      message: `The lesson lasts ${duration} minutes. Please allow at least 10 minutes for a four-phase plan or redesign this as one micro-activity with teacher guidance.`,
      engineUsed: 'rules'
    };
  }

  if (duration > 240) {
    return {
      action: 'CLARIFY',
      reason: 'Duration is beyond this short-lesson planner',
      message: 'This planner supports lessons up to 240 minutes. Please shorten the duration or split it into separate sessions.',
      engineUsed: 'rules'
    };
  }

  if ((requests.hasCount && !Number.isInteger(requests.count)) || (requests.hasEach && !Number.isInteger(requests.each)) || (requests.hasCount && requests.count <= 0) || (requests.hasEach && requests.each <= 0)) {
    return {
      action: 'CLARIFY',
      reason: 'Invalid activity constraint',
      message: 'Please enter positive whole-number activity counts and minutes.',
      engineUsed: 'rules'
    };
  }

  if (requests.hasCount !== requests.hasEach) {
    return {
      action: 'CLARIFY',
      reason: 'Activity timing needs clarification',
      message: 'Please specify both number of activities and minutes per activity, or leave both fields blank.',
      engineUsed: 'rules'
    };
  }

  const issues: string[] = [];
  if (/\b(?:assign|give|calculate|determine)\s+(?:final\s+)?grades?\b|\bgrade\s+(?:individual\s+)?students\b|\bdiagnos(?:e|is)\s+students\b/i.test(objective + ' ' + topic)) {
    issues.push('The system cannot assign consequential student grades or make individual student clinical diagnoses.');
  }
  if (/guarantee(?:d|s)?|100\s*%|every student will master|all students will master|ensure (?:all|every) students? (?:master|learn)/i.test(objective + ' ' + topic)) {
    issues.push('A lesson plan cannot guarantee that all students will master the topic.');
  }
  if (setting === 'Online' && /\b(no|without)\s+(?:internet|online access|connection)\b/i.test(materials)) {
    issues.push('Online instruction is requested without an online connection; the teacher needs to clarify the delivery setting.');
  }
  if (requests.hasCount && requests.hasEach) {
    const activityTime = requests.count * requests.each;
    if (activityTime > duration) {
      issues.push(`The requested ${requests.count} activities × ${requests.each} minutes require ${activityTime} minutes, exceeding the available ${duration} minutes.`);
    } else if (activityTime > duration * 0.75) {
      issues.push(`The requested ${activityTime} minutes of activities leave too little time for introduction, explanation and assessment in the four-phase format.`);
    }
  }

  if (issues.length) {
    return {
      action: 'HUMAN_REVIEW',
      reason: 'Conflicting constraints or outside pedagogical boundary',
      message: issues.join(' ') + ' Teacher review is required before a feasible plan can be generated.',
      engineUsed: 'rules'
    };
  }

  const resources = analyzeResources(setting, materials);
  const kind = classify(topic, objective);
  const ctx = { topic, audience, objective, setting, resources };
  const pack = teachingPack(kind, ctx);
  const times = allocateTime(duration, objective);
  const phases: LessonPhase[] = pack.phases.map((p, i) => ({ ...p, minutes: times[i] }));

  const notes: string[] = [];
  if (resources.onlyChat) notes.push('Delivery uses only the available online text chat; breakout rooms and slides are not needed.');
  else if (resources.raw) notes.push(`Planned around the stated resources: ${resources.raw}.`);
  else notes.push('No materials were specified; activities use low-preparation discussion or short written responses.');

  if (kind === 'general') notes.push('No specific topic template matched in rule base. Supply and verify the example materials before using this draft.');
  if (requests.hasCount && requests.hasEach) notes.push(`Activity constraints entered: ${requests.count} activities × ${requests.each} minutes. Feasible, but verify pacing in class.`);
  notes.push('Review subject accuracy, accessibility, student needs and the feasibility of each activity before teaching.');

  const lesson: LessonPlan = {
    title: topic,
    audience,
    setting,
    objective,
    duration,
    pack: pack.label,
    stimulus: pack.stimulus,
    phases,
    notes,
    scaffoldingStrategy: learnerScaffold(audience)
  };

  return {
    action: 'GENERATE',
    reason: 'Required information present; pedagogical checks passed',
    message: 'A structured, context-sensitive draft for teacher review — ready to adapt and teach.',
    lesson,
    engineUsed: 'rules'
  };
}
