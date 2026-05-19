import OpenAI from "openai";
import { writeFile } from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const buffer = Buffer.concat(chunks);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcript = await client.audio.transcriptions.create({
      file: buffer,
      model: "gpt-4o-mini-tts",
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini-tts",
      messages: [
        { role: "system", content: "You are Jarvis. Respond like Jarvis." },
        { role: "user", content: transcript.text },
      ],
    });

    const text = completion.choices[0].message.content;

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    res.json({
      text,
      audioUrl: "/api/jarvis-audio",
    });

    // Save audio to tmp for serving
    await writeFile("/tmp/jarvis.mp3", audioBuffer);
  });
}
