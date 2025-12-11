import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- INTERFACES (Unchanged) ---
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

// --- API ROUTE HANDLER ---
export async function POST(req: Request) {
  try {
    const details: UserDetails = await req.json();

    // 1. Define the Strict Output Schema with all formatting instructions
    const planSchema = {
      type: Type.OBJECT,
      properties: {
        workout_plan_markdown: {
          type: Type.STRING,
          description: `A 7-day fitness plan using GitHub-flavored Markdown. 
            
            1. **STRUCTURE:** Group the exercises by day using Markdown level-4 headings (e.g., '#### Day 1: Full Body').
            2. **TABLES (STRICT):** Directly following each heading, output a clean Markdown table. **EACH LINE MUST USE PIPE DELIMITERS (|)**.
               The table MUST include headers and the alignment row: 
               | Exercise | Sets | Reps | Rest | 
               | :--- | :--- | :--- | :--- | 
            3. **LINKS:** Each exercise NAME MUST be a Markdown link using the link target '#' (e.g., [Push Ups](#)).
            
            Do NOT include the word 'Day' inside the table rows, only in the heading. Ensure every row starts and ends with a pipe.`,
        },
        diet_plan_markdown: {
          type: Type.STRING,
          description: `A 7-day diet plan using GitHub-flavored Markdown. Group meals by day using Markdown level-4 headings (e.g., '#### Day 1: Meal Plan'). 
            The table MUST include headers and the alignment row:
            | Meal | Time | Portion/Notes |
            | :--- | :--- | :--- |
            Each meal/snack name MUST be a Markdown link using the link target '#' (e.g., [Oats with Banana](#)).`,
        },
        ai_tips: {
          type: Type.STRING,
          // FIX: Enforcing numbered list for clean vertical spacing
          description: "Provide short, focused tips (maximum 3 points). Use Markdown **numbered lists (1., 2., 3.)** for perfect vertical spacing. **Bold the main topic** of each tip using double asterisks (**). Do NOT include any initial greetings (like 'Hello') or introductory phrases.",
        },
      },
      required: ['workout_plan_markdown', 'diet_plan_markdown', 'ai_tips'],
    };

    // 2. Define the Concise Prompt
    const prompt = `
Generate a comprehensive 7-day fitness and diet plan based on the user's details.

**Crucial Formatting Instruction:**
For both the workout and diet plans, **GROUP THE CONTENT BY DAY** using Markdown level-4 headings (####) before the respective table for superior readability.

**User Details:**
Name: ${details.name}
Age: ${details.age}
Gender: ${details.gender}
Height: ${details.height}
Weight: ${details.weight}
Goal: ${details.fitnessGoal}
Level: ${details.fitnessLevel}
Location: ${details.workoutLocation}
Diet: ${details.dietaryPreferences}
`;

    // 3. Call the AI Model with the Schema
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
      },
    });

    const rawText = (response as any).text ?? '';
    
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ success: false, message: 'Empty AI response' }, { status: 500 });
    }

    // JSON.parse is safe due to responseMimeType and responseSchema
    const parsed: PlanResponse = JSON.parse(rawText);

    // Validation
    if (!parsed.workout_plan_markdown || !parsed.diet_plan_markdown) {
      console.error('Missing required markdown fields in response:', { parsed });
      return NextResponse.json(
        { success: false, message: 'AI did not return required plan fields.', debug: parsed },
        { status: 500 }
      );
    }

    // Trim content for cleanliness
    const finalPlan: PlanResponse = {
      workout_plan_markdown: parsed.workout_plan_markdown.trim(),
      diet_plan_markdown: parsed.diet_plan_markdown.trim(),
      ai_tips: parsed.ai_tips.trim(),
    };

    return NextResponse.json({ success: true, plan: finalPlan });

  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json(
      { success: false, message: 'Failed to generate plan.', errorDetail: errorMessage },
      { status: 500 }
    );
  }
}