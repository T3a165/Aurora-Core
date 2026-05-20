import { readFile } from "fs/promises";

export default async function handler(req, res) {
  const file = await readFile("/tmp/jarvis.mp3");
  res.setHeader("Content-Type", "audio/mpeg");
  res.send(file);
}
