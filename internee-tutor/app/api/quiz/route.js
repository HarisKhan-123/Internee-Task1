import { NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { getModule } from "@/lib/modules";

// Generates a short diagnostic quiz for a module (or a specific lesson
// topic). Used both to test understanding and to surface weak areas that
// feed back into future lesson plans.
export async function POST(req) {
  try {
    const { moduleId, topic } = await req.json();
    const mod = getModule(moduleId);
    if (!mod) return NextResponse.json({ error: "Unknown module" }, { status: 400 });

    const groq = getGroqClient();
    const prompt = `Create a short 4-question multiple-choice quiz for the topic "${topic || mod.title}" within the module "${mod.title}".
Return ONLY valid JSON, no markdown fences, in this exact shape:
{
  "questions": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const quiz = JSON.parse(raw);
    return NextResponse.json({ quiz });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to generate quiz" }, { status: 500 });
  }
}
