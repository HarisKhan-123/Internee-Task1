import { NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { getModule } from "@/lib/modules";

// Generates a personalized lesson plan for a module, taking the learner's
// self-reported level and any known weak areas (from past quizzes) into
// account so the plan adapts over time instead of being static.
export async function POST(req) {
  try {
    const { moduleId, level, weakAreas = [] } = await req.json();
    const mod = getModule(moduleId);
    if (!mod) {
      return NextResponse.json({ error: "Unknown module" }, { status: 400 });
    }

    const groq = getGroqClient();
    const weakAreasLine = weakAreas.length
      ? `The learner has previously struggled with: ${weakAreas.join(", ")}. Give these extra emphasis and review.`
      : "No prior weak areas recorded yet — cover the fundamentals evenly.";

    const prompt = `You are a personal tutor for an internship learning platform called Internee.pk.
Create a personalized lesson plan for the module "${mod.title}" (${mod.description}).
Core topics to cover: ${mod.topics.join(", ")}.
Learner's self-reported level: ${level || "beginner"}.
${weakAreasLine}

Return ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{
  "summary": "one short paragraph introducing the plan",
  "lessons": [
    { "title": "...", "objective": "...", "estMinutes": 30, "keyPoints": ["...", "..."] }
  ]
}
Produce 5-7 lessons, ordered from foundational to advanced, tailored to the learner's level and weak areas.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const plan = JSON.parse(raw);
    return NextResponse.json({ plan });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to generate lesson plan" }, { status: 500 });
  }
}
