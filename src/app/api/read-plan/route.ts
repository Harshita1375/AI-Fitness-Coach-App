import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export async function POST(req: Request) {
  try {
    // 1. Parse the request body
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // 2. Check for API Key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key missing" }, { status: 500 });
    }
    const client = new ElevenLabsClient({ apiKey });

    const voiceId = "21m00Tcm4TlvDq8ikWAM"; 

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text, 
      voiceSettings: { stability: 0.5, similarityBoost: 0.8 }
    });

    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      if (value) chunks.push(value);
      done = readerDone;
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const audioArrayBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioArrayBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    return new Response(audioArrayBuffer, {
      headers: { 
        "Content-Type": "audio/mpeg", 
        "Content-Length": totalLength.toString() 
      },
    });
  } catch (error) {
    console.error("TTS ERROR:", error);
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
  }
}