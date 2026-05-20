import OpenAI from "openai";
import { writeFile } from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    // Collect raw audio bytes
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Save to /tmp so OpenAI can read it
    const tempPath = path.join("/tmp", "input.webm");
    await writeFile(tempPath, buffer);

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Speech → text
    const transcript = await client.audio.transcriptions.create({
      file: tempPath,
      model: "gpt-4o-mini-transcribe",
    });

    const userText = transcript.text || "";

    // LLM response
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Jarvis. Respond like Jarvis." },
        { role: "user", content: userText },
      ],
    });

    const text = completion.choices[0]?.message?.content || "I am Jarvis.";

    // Text → speech
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const audioBase64 = audioBuffer.toString("base64");

    res.status(200).json({
      text,
      audio: audioBase64,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Jarvis backend error." });
  }
}
