const { GoogleGenAI } = require('@google/genai');

let geminiClient = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return geminiClient;
}

function ensureGeminiConfigured() {
  if (process.env.AI_MODE !== 'gemini') {
    const error = new Error(
      'AI_MODE must be set to "gemini".'
    );

    error.statusCode = 503;
    error.code = 'AI_NOT_ENABLED';

    throw error;
  }

  if (!process.env.GEMINI_API_KEY) {
    const error = new Error(
      'Gemini API key is not configured.'
    );

    error.statusCode = 503;
    error.code = 'GEMINI_API_KEY_MISSING';

    throw error;
  }

  if (!process.env.GEMINI_MODEL) {
    const error = new Error(
      'Gemini model is not configured.'
    );

    error.statusCode = 503;
    error.code = 'GEMINI_MODEL_MISSING';

    throw error;
  }
}

function buildContext(metrics, profile) {
  return {
    profile: {
      age: profile?.age ?? null,
      heightCm: profile?.heightCm ?? null,
      weightKg: profile?.weightKg ?? null,
      targetWeightKg: profile?.targetWeightKg ?? null,
      fitnessGoal:
        profile?.fitnessGoal || 'GENERAL_FITNESS',
      experience:
        profile?.experience || 'BEGINNER',
      equipment: Array.isArray(profile?.equipment)
        ? profile.equipment
        : [],
    },

    analytics: {
      periodDays: metrics?.periodDays ?? 30,
      workouts30Days:
        metrics?.workouts30Days ?? 0,
      workouts7Days:
        metrics?.workouts7Days ?? 0,
      averageDurationMin:
        metrics?.averageDurationMin ?? 0,
      caloriesBurned:
        metrics?.caloriesBurned ?? 0,
      trainingVolumeKg:
        metrics?.trainingVolumeKg ?? 0,
      consistencyPercent:
        metrics?.consistencyPercent ?? 0,
      currentStreak:
        metrics?.currentStreak ?? 0,
      activeGoals:
        metrics?.activeGoals ?? 0,
      completedGoals:
        metrics?.completedGoals ?? 0,
      goalCompletionPercent:
        metrics?.goalCompletionPercent ?? 0,
    },
  };
}

async function callLLM(system, input) {
  ensureGeminiConfigured();

  const gemini = getGeminiClient();

  if (!gemini) {
    const error = new Error(
      'Gemini API client could not be initialized.'
    );

    error.statusCode = 503;
    error.code = 'GEMINI_CLIENT_UNAVAILABLE';

    throw error;
  }

  try {
    const response =
      await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL,
        contents: `${system}\n\nUSER DATA:\n${input}`,
      });

    const output =
      response.text?.trim();

    if (!output) {
      const error = new Error(
        'Gemini returned an empty response.'
      );

      error.statusCode = 502;
      error.code = 'GEMINI_EMPTY_RESPONSE';

      throw error;
    }

    return output;
  } catch (error) {
    console.error(
      'Gemini API error:',
      error.message
    );

    const wrappedError = new Error(
      error.message ||
        'Gemini request failed.'
    );

    wrappedError.statusCode =
      error.status || 502;

    wrappedError.code =
      error.code || 'GEMINI_API_ERROR';

    throw wrappedError;
  }
}

async function coach({
  question,
  metrics,
  profile,
}) {
  const cleanQuestion =
    String(question || '').trim();

  if (!cleanQuestion) {
    const error = new Error(
      'Please enter a question for the AI Coach.'
    );

    error.statusCode = 400;
    error.code = 'QUESTION_REQUIRED';

    throw error;
  }

  const context = buildContext(
    metrics,
    profile
  );

  const system = `
You are FitSense AI Coach, a personalized
fitness-planning assistant.

Your response must be based on the user's
actual profile and tracked application data.

IMPORTANT RULES:

1. Answer the user's specific question.
2. Do not give a generic response when the question
   is specific.
3. Use the supplied metrics when relevant.
4. Never invent measurements, workouts, progress,
   medical conditions, or user history.
5. Clearly distinguish tracked facts from suggestions.
6. Do not diagnose medical conditions.
7. Do not prescribe medical treatment.
8. If the supplied data is insufficient, explicitly
   say what information is missing.
9. Keep the answer practical and understandable.
10. Do not pretend to know information that was
    not provided.
11. Recommendations should be framed as general
    fitness planning guidance.
`;

  const input = JSON.stringify(
    {
      userQuestion: cleanQuestion,
      userContext: context,
    },
    null,
    2
  );

  const answer = await callLLM(
    system,
    input
  );

  return {
    source: 'GEMINI',
    answer,
    metricsUsed: context.analytics,
    profileUsed: context.profile,
    safetyNote:
      'Fitness-planning guidance based on tracked application data. Not medical advice.',
  };
}

async function generatePlan(
  profile,
  metrics = {}
) {
  const context = buildContext(
    metrics,
    profile
  );

  const system = `
You are FitSense AI Workout Planner.

Create a practical, personalized general fitness
workout plan using only the supplied profile and
recent activity data.

Consider:
- Fitness goal
- Experience level
- Current weight and target weight when relevant
- Available equipment
- Recent workout frequency
- Current consistency

Do not make medical claims.
Do not guarantee results.
Do not invent equipment.

Return ONLY valid JSON with this structure:

{
  "title": "string",
  "goal": "string",
  "experience": "string",
  "daysPerWeek": number,
  "equipment": ["string"],
  "days": [
    {
      "day": "string",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string",
          "restSeconds": number
        }
      ]
    }
  ]
}
`;

  const raw = await callLLM(
    system,
    JSON.stringify(
      {
        userContext: context,
      },
      null,
      2
    )
  );

  let plan;

  try {
    plan = JSON.parse(raw);
  } catch {
    const parseError = new Error(
      'Gemini returned an invalid workout-plan format.'
    );

    parseError.statusCode = 502;
    parseError.code = 'AI_INVALID_JSON';

    throw parseError;
  }

  return {
    source: 'GEMINI',
    plan,
  };
}

async function analyzeProgress(
  metrics,
  profile
) {
  const context = buildContext(
    metrics,
    profile
  );

  const system = `
You are FitSense AI Progress Analyzer.

Analyze the user's tracked fitness data.

Provide:

1. Current strengths
2. Areas that need attention
3. Relevant trends supported by the data
4. One or two practical next steps

IMPORTANT:

- Use only the supplied data.
- Do not invent trends.
- Do not diagnose medical conditions.
- Do not claim guaranteed outcomes.
- Clearly distinguish observations from recommendations.
- If the data is insufficient for a conclusion,
  explicitly state that.
`;

  const analysis = await callLLM(
    system,
    JSON.stringify(
      {
        userContext: context,
      },
      null,
      2
    )
  );

  return {
    source: 'GEMINI',
    analysis,
    metricsUsed: context.analytics,
    profileUsed: context.profile,
  };
}

async function adaptiveRecommendation(
  performance
) {
  const plannedWeight =
    Number(
      performance?.plannedWeight
    ) || 0;

  const actualBestWeight =
    Number(
      performance?.actualBestWeight
    ) || 0;

  const plannedReps =
    Number(
      performance?.plannedReps
    ) || 0;

  const actualBestReps =
    Number(
      performance?.actualBestReps
    ) || 0;

  const intensity =
    Number(
      performance?.intensity
    ) || 0;

  if (
    plannedReps <= 0 ||
    actualBestReps < 0
  ) {
    const error = new Error(
      'Valid planned and actual repetition values are required.'
    );

    error.statusCode = 400;
    error.code =
      'INVALID_PERFORMANCE_DATA';

    throw error;
  }

  const weightRatio =
    plannedWeight > 0
      ? actualBestWeight /
        plannedWeight
      : 1;

  let decision = 'MAINTAIN';

  let recommendation =
    'Maintain the current load and aim to complete the planned rep range consistently.';

  if (intensity >= 9) {
  decision = 'RECOVER';

  recommendation =
    'The reported intensity was very high. Avoid an immediate load increase and prioritize adequate recovery before the next comparable session.';
} else if (
  actualBestReps <
  Math.max(1, plannedReps - 2)
) {
  decision = 'REGRESS';

  recommendation =
    'Performance was below the planned target. Maintain or slightly reduce the load and focus on consistent technique and recovery.';
} else if (
  plannedWeight > 0 &&
  weightRatio >= 1 &&
  actualBestReps >= plannedReps
) {
  decision = 'PROGRESS';

  recommendation =
    'You met or exceeded the planned target. Consider a small load increase in the next comparable session if technique remains consistent.';
} else {
  decision = 'MAINTAIN';

  recommendation =
    'Maintain the current load and aim to complete the planned rep range consistently.';
}
  return {
    source: 'RULE_ENGINE',
    decision,
    recommendation,
    inputs: {
      plannedWeight,
      actualBestWeight,
      plannedReps,
      actualBestReps,
      intensity,
    },
  };
}

module.exports = {
  coach,
  generatePlan,
  analyzeProgress,
  adaptiveRecommendation,
};