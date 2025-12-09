import { ElevenLabsClient } from "elevenlabs";
import { NextResponse } from "next/server";

const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4azwk8vH3dYJ";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ message: "No text provided" }, { status: 400 });
    }

    const audioStream = await elevenlabs.textToSpeech.convert(
      voiceId, 
      {
        text,
        model_id: "eleven_multilingual_v2",
      }, 
      {} 
    );

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }

    const audioBuffer = Buffer.concat(chunks);

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="speech.mp3"'
      }
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json({ message: "Failed to generate audio" }, { status: 500 });
  }
}
