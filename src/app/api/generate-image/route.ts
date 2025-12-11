import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { item, type } = await req.json();

    if (!item || !type) {
      return NextResponse.json({ error: "Missing item or type" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Create a clear, high-resolution ${type === "workout" ? "exercise" : "food"} image:
      "${item}"
      - Clean background
      - Focus on the subject
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          text: prompt, 
        },
      ],
    });

    const candidate = result.candidates?.[0];

    if (!candidate || !candidate.content?.parts) {
      return NextResponse.json({ error: "No image content returned" }, { status: 500 });
    }

    const imagePart = candidate.content.parts.find(
      (p) => p.inlineData && p.inlineData.mimeType?.startsWith("image/")
    );

    if (!imagePart || !imagePart.inlineData?.data) {
      return NextResponse.json({ error: "No image part found" }, { status: 500 });
    }

    const base64 = imagePart.inlineData.data;
    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("IMAGE API ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
