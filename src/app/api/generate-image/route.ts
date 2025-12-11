import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { item, type } = await req.json();

    let basePrompt = "";

    if (type === 'workout') {
      basePrompt = `Photorealistic image of a person performing a proper ${item}. 
      Show correct form, muscle engagement, clean background, high detail, realistic lighting.`;
    } else if (type === 'food') {
      basePrompt = `High-quality food photography of freshly prepared ${item}. 
      Professional lighting, clean background, appetizing presentation.`;
    } else {
      return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });
    }

    // ⭐ Correct API for your SDK version:
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-002', // updated model
      prompt: basePrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    // ⭐ Correct response reading for OLD Gemini SDK:
    const imageBytes =
      response?.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBytes) {
      throw new Error("No image bytes returned from Gemini");
    }

    // Base64 → img src
    const imageUrl = `data:image/jpeg;base64,${imageBytes}`;

    return NextResponse.json({ success: true, imageUrl });

  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to generate image." },
      { status: 500 }
    );
  }
}
