import { AuroraClient } from "@aurora/sdk";

export const aurora = new AuroraClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  apiKey:  process.env.NEXT_PUBLIC_API_KEY  ?? "",
});
