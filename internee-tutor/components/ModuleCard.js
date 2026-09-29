"use client";
import Link from "next/link";

export default function ModuleCard({ mod, progress }) {
  const completed = progress?.completedTopics?.length || 0;
  // Checkboxes are per lesson in the AI-generated plan, which can have a
  // different lesson count than the module's static topic list — so use
  // the plan's own length as the denominator once one exists.
  const total = progress?.lessonPlan?.lessons?.length || mod.topics.length;
  const pct = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <Link
      href={`/module/${mod.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-500"
    >
      <h3 className="text-lg font-semibold text-slate-900">{mod.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{mod.description}</p>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {progress?.weakAreas?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {progress.weakAreas.slice(0, 3).map((w) => (
            <span
              key={w}
              className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 border border-amber-200"
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
