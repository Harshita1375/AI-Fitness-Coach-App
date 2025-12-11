import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface UserDetails {
  name: string;
  age: number;
  gender: string;
  height: string;
  weight: string;
  fitnessGoal: string;
  fitnessLevel: string;
  workoutLocation: string;
  dietaryPreferences: string;
}

interface PlanResponse {
  workout_plan_markdown: string;
  diet_plan_markdown: string;
  ai_tips: string;
}

/**
 * Helper: try to parse JSON safely.
 * If direct JSON.parse fails, try to extract first {...} JSON-like substring.
 */
function safeParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch (e) {
    // try to extract a JSON object from the text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const details: UserDetails = await req.json();

    // Strong instruction: model MUST return a single JSON object (no extra commentary)
    // with keys: workout_plan_markdown, diet_plan_markdown, ai_tips.
    // Each table MUST be valid GitHub Markdown table and every exercise / meal MUST be a markdown link.
    // Example row: | Day 1 | [Push Ups](#) | 4 | 8-12 | 60s |
    const prompt = `
You are an expert AI Fitness Coach. Based on the user details below, return a SINGLE JSON object and NOTHING ELSE.
The JSON object must have these exact keys:
{
  "workout_plan_markdown": "<markdown table string>",
  "diet_plan_markdown": "<markdown table string>",
  "ai_tips": "<short plaintext tips>"
}

REQUIREMENTS (very strict):
1) workout_plan_markdown: A 7-day **GitHub-flavored Markdown** table with headers:
   | Day | Exercise | Sets | Reps | Rest |
   Each exercise NAME MUST be a markdown link. Use the link target '#' (hash). Example:
   | Day 1 | [Push Ups](#) | 4 | 8-12 | 60s |
   Ensure every row has exactly 5 columns separated by pipes, and include the header + separator row.

2) diet_plan_markdown: A 7-day **GitHub-flavored Markdown** table with headers:
   | Day | Meal | Time | Portion/Notes |
   Each meal / snack MUST be a markdown link. Use '#' as the link target. Example:
   | Day 1 | [Oats with Banana](#) | Breakfast | 1 bowl |

3) ai_tips: Short, focused plaintext (no markdown tables), max 3 short paragraphs (or bullet points) with personalization based on the user's details.

IMPORTANT: Return ONLY valid JSON (no explanation, no disclaimers, no extra text). Make sure all markdown table pipes and link formats are correct. Use the user's details below to personalize sets/reps and meal suggestions.

User details:
Name: ${details.name}
Age: ${details.age}
Gender: ${details.gender}
Height: ${details.height}
Weight: ${details.weight}
Goal: ${details.fitnessGoal}
Level: ${details.fitnessLevel}
Location: ${details.workoutLocation}
Diet: ${details.dietaryPreferences}

Output example (must follow exactly):
{
  "workout_plan_markdown": "| Day | Exercise | Sets | Reps | Rest |\n| --- | --- | --- | --- | --- |\n| Day 1 | [Push Ups](#) | 4 | 8-12 | 60s | ... (and so on for 7 days)",
  "diet_plan_markdown": "| Day | Meal | Time | Portion/Notes |\n| --- | --- | --- | --- |\n| Day 1 | [Oats with Banana](#) | Breakfast | 1 bowl | ... (and so on for 7 days)",
  "ai_tips": "Short tips here..."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      // model may return JSON text; request plain/text or application/json depending on model behavior.
      // We accept either but will parse robustly below.
      contents: prompt,
      config: {
        // It's OK to request JSON, but model sometimes returns extra text — we handle that.
        responseMimeType: "application/json",
      },
    });

    const rawText = (response as any).text ?? '';
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ success: false, message: 'Empty AI response' }, { status: 500 });
    }

    // Try to parse safely (direct JSON.parse or extract JSON substring)
    const parsed = safeParseJson(rawText);
    if (!parsed) {
      // return debug info to help in dev; in production you might log and return a cleaner message.
      console.error('AI raw response (unparsable):', rawText);
      return NextResponse.json(
        { success: false, message: 'AI returned unparsable output', debug: rawText.slice(0, 200) },
        { status: 500 }
      );
    }

    // Ensure the required keys exist and are strings
    const workout_markdown =
      typeof parsed.workout_plan_markdown === 'string' ? parsed.workout_plan_markdown.trim() : '';
    const diet_markdown =
      typeof parsed.diet_plan_markdown === 'string' ? parsed.diet_plan_markdown.trim() : '';
    const ai_tips = typeof parsed.ai_tips === 'string' ? parsed.ai_tips.trim() : '';

    if (!workout_markdown || !diet_markdown) {
      console.error('Missing markdown in parsed response:', { parsed });
      return NextResponse.json(
        { success: false, message: 'AI did not return required markdown fields', debug: parsed },
        { status: 500 }
      );
    }

    const plan: PlanResponse = {
      workout_plan_markdown: workout_markdown,
      diet_plan_markdown: diet_markdown,
      ai_tips,
    };

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    return NextResponse.json({ success: false, message: 'Failed to generate plan.' }, { status: 500 });
  }
}
