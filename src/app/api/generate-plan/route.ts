// src/app/api/generate-plan/route.ts

import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the expected structures (Recommended for type safety, even if not strictly required for the fix)
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

// 🎯 FIX: Use the named export 'POST' and ensure it is the ONLY export.
export async function POST(req: Request) {
  try {
    const details: UserDetails = await req.json();

    const prompt = `
      You are an expert AI Fitness Coach. Generate a highly personalized 7-day 
      Workout Plan and Diet Plan for the user based on the following details.

      User Details:
      - Name: ${details.name}
      - Age: ${details.age}, Gender: ${details.gender}, Height: ${details.height}, Weight: ${details.weight}
      - Goal: ${details.fitnessGoal}
      - Fitness Level: ${details.fitnessLevel}
      - Workout Location: ${details.workoutLocation}
      - Dietary Preference: ${details.dietaryPreferences}

      Output Format:
      ... (JSON structure details)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            workout_plan_markdown: { type: "string" },
            diet_plan_markdown: { type: "string" },
            ai_tips: { type: "string" }
          }
        }
      }
    });

    if (!response.text) {
        console.error("AI Response Error: Response text was empty.");
        return NextResponse.json(
            { success: false, message: 'AI model returned empty content.' },
            { status: 500 }
        );
    }
    
    const plan: PlanResponse = JSON.parse(response.text);

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("AI Plan Generation Error:", error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate plan.' },
      { status: 500 }
    );
  }
}