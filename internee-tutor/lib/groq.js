import Groq from "groq-sdk";

let client;
export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "Missing GROQ_API_KEY. Get a free key at https://console.groq.com/keys and add it to .env.local"
    );
  }
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

// Free, fast, currently-supported Groq model. llama-3.3-70b-versatile was
// retired by Groq on 2026-08-16; this is their recommended replacement.
// Override with a GROQ_MODEL env var if Groq deprecates this one too —
// check console.groq.com/docs/deprecations for the current list.
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
