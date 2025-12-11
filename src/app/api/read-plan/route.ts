import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key missing" }, { status: 500 });
    }

    const client = new ElevenLabsClient({ apiKey });

    const voiceId = "21m00Tcm4TlvDq8ikWAM"; // default voice

    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.8,
      },
    });

    const audioArrayBuffer = await audio.arrayBuffer();
    return new Response(audioArrayBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("TTS ERROR:", error);
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
  }
}
