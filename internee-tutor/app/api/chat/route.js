import { NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { getModule } from "@/lib/modules";

// Answers a learner's question, scoped to the module they're studying so
// answers stay relevant and at an appropriate level.
export async function POST(req) {
  try {
    const { moduleId, messages = [] } = await req.json();
    const mod = getModule(moduleId);
    const groq = getGroqClient();

    const system = {
      role: "system",
      content: `You are a friendly, patient tutor on Internee.pk helping an intern learn "${mod?.title || "their module"}".
Keep answers clear, concise, and beginner-friendly unless the learner shows advanced understanding.
Use short examples where helpful. If a question is unrelated to the module, gently redirect back to it.`,
    };

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [system, ...messages],
      temperature: 0.6,
    });

    const reply = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to get a response" }, { status: 500 });
  }
}
