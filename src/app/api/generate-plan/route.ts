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

// Utility to convert TAB-separated text into Markdown table with merged Day column
function tabToMarkdownTable(tabText: string) {
  const lines = tabText.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  const headers = lines[0].split('\t').map(h => h.trim());
  const separator = headers.map(() => '---');

  let lastDay = '';
  const rows = lines.slice(1).map(line => {
    const cells = line.split('\t').map(cell => cell.trim());
    if (cells[0] === lastDay) cells[0] = ''; // merge repeated day
    else lastDay = cells[0];
    return '| ' + cells.join(' | ') + ' |';
  });

  return '| ' + headers.join(' | ') + ' |\n| ' + separator.join(' | ') + ' |\n' + rows.join('\n');
}

export async function POST(req: Request) {
  try {
    const details: UserDetails = await req.json();

    const prompt = `
You are an expert AI Fitness Coach. Generate a highly personalized 7-day 
Workout Plan and Diet Plan for the user based on these details:

Name: ${details.name}, Age: ${details.age}, Gender: ${details.gender}
Height: ${details.height}, Weight: ${details.weight}
Goal: ${details.fitnessGoal}, Level: ${details.fitnessLevel}
Location: ${details.workoutLocation}, Diet: ${details.dietaryPreferences}

Output format:
1. Provide Workout Plan as TAB-separated text, first line is header: "Day\tExercise\tSets\tReps\tRest Time"
2. Provide Diet Plan as TAB-separated text, first line is header: "Day\tMeal\tCalories\tProtein\tCarbs\tFats"
3. Provide AI tips as plain text
Return JSON with keys: workout_plan, diet_plan, ai_tips
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (!response.text) {
      return NextResponse.json({ success: false, message: 'Empty AI response' }, { status: 500 });
    }

    // Parse AI JSON response safely
    const result = JSON.parse(response.text);

    // Convert TAB text to Markdown tables
    const workout_markdown = typeof result.workout_plan === 'string'
      ? tabToMarkdownTable(result.workout_plan)
      : '';
    const diet_markdown = typeof result.diet_plan === 'string'
      ? tabToMarkdownTable(result.diet_plan)
      : '';

    const plan: PlanResponse = {
      workout_plan_markdown: workout_markdown,
      diet_plan_markdown: diet_markdown,
      ai_tips: result.ai_tips || ''
    };

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    return NextResponse.json({ success: false, message: 'Failed to generate plan.' }, { status: 500 });
  }
}
