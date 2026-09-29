"use client";
import { useState } from "react";

export default function LessonPlan({ moduleId, weakAreas, onGenerated, existingPlan, completedTopics = [], onToggleTopic }) {
  const [plan, setPlan] = useState(existingPlan || null);
  const [level, setLevel] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, level, weakAreas }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data.plan);
      onGenerated?.(data.plan);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-base font-semibold text-slate-900">Personalized Lesson Plan</h3>
        <div className="flex items-center gap-2">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {loading ? "Generating…" : plan ? "Regenerate" : "Generate plan"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {plan && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">{plan.summary}</p>
          <ol className="space-y-3">
            {plan.lessons?.map((lesson, i) => {
              const done = completedTopics.includes(lesson.title);
              return (
                <li key={i} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {i + 1}. {lesson.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{lesson.objective}</p>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => onToggleTopic?.(lesson.title)}
                      />
                      Done
                    </label>
                  </div>
                  {lesson.keyPoints?.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs text-slate-500 space-y-0.5">
                      {lesson.keyPoints.map((kp, j) => (
                        <li key={j}>{kp}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[11px] text-slate-400">~{lesson.estMinutes} min</p>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
