// app/api/generate-image/route.ts
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { item, type } = await req.json();
    
    let basePrompt = "";
    if (type === 'workout') {
      basePrompt = `Photorealistic image of a person performing a perfect ${item}. Focus on correct form, clarity, and visible muscle engagement.`;
    } else if (type === 'food') {
      basePrompt = `High-quality food photography of freshly prepared ${item}. Bright, clean, visually appealing presentation.`;
    } else {
      return NextResponse.json({ message: 'Invalid type provided.' }, { status: 400 });
    }

    const response = await ai.models.generateImages({
      model: 'imagen-2.5-generate-002',
      prompt: basePrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    });

    // SAFE: Ensure images exist
    if (
        !response.generatedImages ||
        response.generatedImages.length === 0 ||
        !response.generatedImages[0].image ||
        !response.generatedImages[0].image.imageBytes
        ) {
        throw new Error("No images were generated.");
        }

    const imageBase64 = response.generatedImages[0].image.imageBytes;

   
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    return NextResponse.json({ success: true, imageUrl });

  } catch (error) {
    console.error("Image Generation Error:", error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate image.' },
      { status: 500 }
    );
  }
}
