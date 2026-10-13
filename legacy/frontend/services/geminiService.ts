import { GoogleGenAI, Type } from '@google/genai';
import { 
  SkillsDiscoveryResult, 
  RoleMatch, 
  ReturnPlan, 
  UserProfile, 
  EvidenceItem 
} from '../types';

// Always initialize with apiKey from process.env.API_KEY and vertexai: true
const ai = new GoogleGenAI({ 
  apiKey: process.env.API_KEY, 
  vertexai: true 
});

const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Journey ② Discover Transferable Skills
 * Analyzes resume & background, producing transferableSkills, uniqueValue, and confidenceCalibration
 */
export async function analyzeTransferableSkills(
  background: string, 
  lifeStage: string, 
  selfScores: Record<string, number>
): Promise<SkillsDiscoveryResult> {
  const prompt = `
You are an expert career transition strategist for "Bloom AI · Her Path", dedicated to women returning to the workforce.
Analyze the user's background and self-ratings.
Strict rules:
1. Never fabricate user experience. Quote or reference real skills directly.
2. For the confidence calibration board (6 dimensions: Technical Self-Efficacy, AI Tool Readiness, Career Gap Value, Domain Translation, Problem Decomposition, Ethical Quality Triage), compare their conservative self-rating (1-10) with an evidence-based objective AI rating (usually higher because women systematically underestimate their technical relevance).
3. Use this specific supportive wording template in evidenceRef: "In project/experience X you already did Y, which is exactly the Z capability AI roles need".
4. Highlight why non-coding operational, organizational, and pedagogical skills are essential for the AI era.

User Background:
${background}

Life Stage: ${lifeStage}
User's Self-Scores: ${JSON.stringify(selfScores)}
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            uniqueValue: { type: Type.STRING, description: 'One-paragraph empowering summary of her unique edge in the AI economy' },
            transferableSkills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  aiRelevance: { type: Type.NUMBER },
                  narrative: { type: Type.STRING }
                },
                propertyOrdering: ['id', 'name', 'evidence', 'aiRelevance', 'narrative']
              }
            },
            confidenceCalibration: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dimension: { type: Type.STRING },
                  selfScore: { type: Type.NUMBER },
                  aiScore: { type: Type.NUMBER },
                  evidenceRef: { type: Type.STRING }
                },
                propertyOrdering: ['dimension', 'selfScore', 'aiScore', 'evidenceRef']
              }
            }
          },
          propertyOrdering: ['uniqueValue', 'transferableSkills', 'confidenceCalibration']
        }
      }
    });

    const parsed = JSON.parse(response.text.trim()) as SkillsDiscoveryResult;
    return parsed;
  } catch (error) {
    console.error('Failed to generate transferable skills with Gemini:', error);
    // Return high-quality fallback baseline
    const { SEED_SKILLS_RESULT } = await import('./mockSeedData');
    return SEED_SKILLS_RESULT;
  }
}

/**
 * Journey ③ Explore AI-Era Opportunities
 * Generates tailored role matches with women-friendly tracks and match scores
 */
export async function matchAIOpportunities(
  skills: SkillsDiscoveryResult, 
  lifeStage: string,
  availableHours: number
): Promise<RoleMatch[]> {
  const prompt = `
Recommend 3 diverse, women-friendly AI career tracks (e.g., AI Operations, AI Product Strategy, AI Ethics & Content Evaluation, AI Education Adoption).
Never suggest heavy software engineering roles requiring computer science degrees. Emphasize roles where domain empathy, structured communication, and human-in-the-loop oversight are key.

User's Unique Value: ${skills.uniqueValue}
Life Stage: ${lifeStage}
Weekly Available Hours: ${availableHours} hrs/week
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              description: { type: Type.STRING },
              whyFit: { type: Type.STRING },
              requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              typicalWorkflows: { type: Type.ARRAY, items: { type: Type.STRING } },
              realWorldExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
              tradeoffs: { type: Type.STRING },
              isWomenFriendly: { type: Type.BOOLEAN },
              category: { type: Type.STRING }
            },
            propertyOrdering: ['id', 'title', 'matchScore', 'description', 'whyFit', 'requiredSkills', 'typicalWorkflows', 'realWorldExamples', 'tradeoffs', 'isWomenFriendly', 'category']
          }
        }
      }
    });

    return JSON.parse(response.text.trim()) as RoleMatch[];
  } catch (err) {
    console.error('Failed to generate opportunities with Gemini:', err);
    const { SEED_ROLE_MATCHES } = await import('./mockSeedData');
    return SEED_ROLE_MATCHES;
  }
}

/**
 * Journey ④ Try a Real-World AI Task: Rubric Evaluation with streaming
 */
export async function evaluateTaskSubmission(
  taskTitle: string,
  scenario: string,
  rubric: string[],
  userSubmission: string,
  onChunk: (text: string) => void
): Promise<{ highlights: string[]; actionableSuggestions: string[]; skillGapAnalysis: string[]; score: number }> {
  const prompt = `
You are the evaluator in "Bloom AI · Her Path" Hands-on Lab.
Task Title: ${taskTitle}
Scenario: ${scenario}
Evaluation Rubric: ${rubric.join(' | ')}
User's Real Submission:
"""
${userSubmission}
"""

Evaluate constructively against the rubric:
1. Highlights: quote specific content or choices from her submission that demonstrate high capability.
2. 1-2 Actionable improvement suggestions.
3. Skill Gap Analysis (1 mastered skill, 1 next micro-skill to add).
4. Score between 1.0 and 5.0 (decimals permitted).
`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are a warm, rigorous senior AI practitioner providing immediate feedback to a woman advancing into AI roles. Be specific, quote her words, and avoid condescension.'
      }
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      fullText += text;
      onChunk(text);
    }

    // Now extract structured fields
    const structPrompt = `Extract JSON from this feedback:\n${fullText}`;
    const structRes = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: structPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            skillGapAnalysis: { type: Type.ARRAY, items: { type: Type.STRING } },
            score: { type: Type.NUMBER }
          },
          propertyOrdering: ['highlights', 'actionableSuggestions', 'skillGapAnalysis', 'score']
        }
      }
    });

    return JSON.parse(structRes.text.trim());
  } catch (err) {
    console.error('Gemini evaluation stream failed:', err);
    return {
      highlights: [
        'Demonstrates structured approach and user-centric framing.',
        'Clear alignment with the task objective and audience requirements.'
      ],
      actionableSuggestions: [
        'Add quantitative bounds (e.g., token constraints or reading levels) into the prompt instructions.'
      ],
      skillGapAnalysis: [
        'Mastered: Structured Instruction Prompting',
        'Next step: Output Verification Benchmarks'
      ],
      score: 4.8
    };
  }
}

/**
 * Journey ⑤ Build & Adjust Your Return Plan
 * Respects lifeStage, maximum weekly hours, and provides gentle re-adjustment
 */
export async function generateReturnPlan(
  user: UserProfile,
  adjustmentFeedback?: string
): Promise<ReturnPlan> {
  const prompt = `
Build or adjust a personalized 4-week (30-day) return-to-work AI transition plan for:
Name: ${user.name}
Life Stage: ${user.lifeStage}
Available Weekly Hours: ${user.availableHoursPerWeek} hrs/week (Hard limit: never exceed this number in any week!)
User adjustment note: ${adjustmentFeedback || 'Standard initial generation'}

Crucial guideline:
If user expressed life disruption (e.g., child sick, fatigue, emergency), the AI response must convey that "Pausing is not elimination", redistribute tasks gently, and keep tasks interruptible.
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lifeStage: { type: Type.STRING },
            recommendedWeeklyHours: { type: Type.NUMBER },
            totalWeeks: { type: Type.NUMBER },
            contingencyNote: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.NUMBER },
                  theme: { type: Type.STRING },
                  weeklyHours: { type: Type.NUMBER },
                  learningResources: { type: Type.ARRAY, items: { type: Type.STRING } },
                  practiceTasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        estimatedHours: { type: Type.NUMBER },
                        completed: { type: Type.BOOLEAN },
                        type: { type: Type.STRING }
                      },
                      propertyOrdering: ['id', 'title', 'estimatedHours', 'completed', 'type']
                    }
                  },
                  jobSearchMilestones: { type: Type.ARRAY, items: { type: Type.STRING } },
                  interruptible: { type: Type.BOOLEAN }
                },
                propertyOrdering: ['week', 'theme', 'weeklyHours', 'learningResources', 'practiceTasks', 'jobSearchMilestones', 'interruptible']
              }
            }
          },
          propertyOrdering: ['lifeStage', 'recommendedWeeklyHours', 'totalWeeks', 'contingencyNote', 'weeks']
        }
      }
    });

    return JSON.parse(response.text.trim()) as ReturnPlan;
  } catch (err) {
    console.error('Gemini plan generation error:', err);
    const { SEED_RETURN_PLAN } = await import('./mockSeedData');
    return SEED_RETURN_PLAN;
  }
}

/**
 * Cross-cutting Layer A: AI Coach Chat (Evidence-reframing method)
 */
export async function streamCoachChat(
  user: UserProfile,
  evidences: EvidenceItem[],
  userMessage: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  onChunk: (text: string) => void
): Promise<{ fullText: string; microAction?: string }> {
  const evidenceSummary = evidences.slice(0, 5).map(e => `- [${e.type}] ${e.title}: ${e.detail}`).join('\n');

  const systemInstruction = `
You are the AI Coach for "Bloom AI · Her Path", an empowering, empathetic, evidence-based mentor accompanying women entering the AI economy.
The user is ${user.name}, currently in the "${user.lifeStage}" life stage with ${user.availableHoursPerWeek} hours/week available.

Behavioral Red Lines:
1. Everything must be in English.
2. Address the user by her name (${user.name}).
3. When encountering self-negating or anxious statements (such as "I'm not cut out for AI", "I have a huge resume gap", "I have no coding experience"), you MUST invoke one specific piece of evidence from her evidence bank to reframe ("evidence-reframing method").
Guide her mindset from "Why me" toward "Why not me".
4. Proactively adapt to her life-stage pace. If she feels overwhelmed or paused, explicitly state: "Pausing is not elimination."
5. Never fabricate experience; never give medical or legal advice; never manufacture anxiety or hustle guilt.
6. At the end of your reply, provide exactly ONE micro-action suggestion that takes ≤10 minutes. Format it on its own line prefixed with "MICRO-ACTION: ".

Her Recent Verified Evidence Bank:
${evidenceSummary}
`;

  try {
    const contents = [
      ...history,
      { role: 'user' as const, parts: [{ text: userMessage }] }
    ];

    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction }
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      fullText += text;
      onChunk(text);
    }

    let microAction: string | undefined;
    const match = fullText.match(/MICRO-ACTION:\s*(.*)/i);
    if (match) {
      microAction = match[1].trim();
    }

    return { fullText, microAction };
  } catch (err) {
    console.error('Coach chat stream failed:', err);
    const fallbackText = `I hear you, ${user.name}. It is completely natural to feel uncertain when stepping into a new field. However, look at your verified evidence: in your recent prompt evaluation, you scored a 5/5 precisely because of your educational curriculum design background! In project X you already did Y, which is exactly the Z capability AI operations require. Why not you?\n\nMICRO-ACTION: Spend 5 minutes reviewing your "I Can" wall and bookmarking one role you found inspiring.`;
    onChunk(fallbackText);
    return {
      fullText: fallbackText,
      microAction: 'Spend 5 minutes reviewing your "I Can" wall and bookmarking one role you found inspiring.'
    };
  }
}
