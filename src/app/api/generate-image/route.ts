// src/app/api/generate-image/route.ts

import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({}); 

export async function POST(req: Request) {
  try {
    const { item, type } = await req.json();

    let basePrompt = "";
    if (type === 'workout') {
      basePrompt = `Photorealistic, high-detail image of a person performing the ${item} exercise with proper form. Clean, minimalist gym background.`;
    } else if (type === 'food') {
      basePrompt = `High-quality, professional food photography of freshly prepared ${item}. Appetizing presentation, realistic lighting, soft bokeh background.`;
    } else {
      return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: [
        { role: "user", parts: [{ text: basePrompt }] }
      ],
      config: {
        responseModalities: ["IMAGE"], 
        imageConfig: { 
          aspectRatio: '1:1',
        },
      },
    });

    // START OF TS FIXES: Safely extract the first candidate and its content
    const firstCandidate = response.candidates?.[0];

    // Explicit check for both candidate and its content to satisfy TypeScript
    if (!firstCandidate || !firstCandidate.content) {
      const finishReason = response.candidates?.[0]?.finishReason;
      throw new Error(`Image generation failed. Finish Reason: ${finishReason || "No candidate content found."}`);
    }
    
    // CORRECT RESPONSE PARSING: Find the image part within the contents
    // TypeScript is now satisfied because we checked 'firstCandidate.content' above.
    const imagePart = firstCandidate.content.parts.find(
      (part: any) => part.inlineData && part.inlineData.mimeType.startsWith('image/')
    );

    const imageBytes: string | undefined = imagePart?.inlineData?.data; 
    const mimeType: string = imagePart?.inlineData?.mimeType || 'image/jpeg';

    if (!imageBytes) {
      throw new Error("No image data found in the response. Generation may have been blocked.");
    }

    const imageUrl = `data:${mimeType};base64,${imageBytes}`;

    return NextResponse.json({ success: true, imageUrl });

  } catch (err: any) {
    const status = err.status || 500;
    let message = "Failed to generate image due to an internal server error.";

    if (status === 429) {
      message = "Quota Exceeded (429). Please wait for your quota to reset or enable billing.";
    } else {
      message = err.message || message;
    }
    
    console.error("Image generation error:", err);
    return NextResponse.json(
      { success: false, message: message },
      { status: status }
    );
  }
}