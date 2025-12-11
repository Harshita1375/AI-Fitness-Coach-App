import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });

    const voiceId =
      process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4azwk8vH3dYJ";

    // Generate audio
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
      },
      model_id: "eleven_multilingual_v2",
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    const audioBuffer = Buffer.concat(
      chunks.map((c) => Buffer.from(c))
    );

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="speech.mp3"`,
      },
    });
  } catch (error) {
    console.error("TTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    );
  }
}
