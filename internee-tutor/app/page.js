"use client";
import { useEffect, useState } from "react";
import { MODULES } from "@/lib/modules";
import { ensureSignedIn, getProgress, resetAllProgress } from "@/lib/firebase";
import ModuleCard from "@/components/ModuleCard";

export default function Dashboard() {
  const [progress, setProgress] = useState({});
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const userId = await ensureSignedIn();
        setUid(userId);
        const data = await getProgress(userId);
        setProgress(data.modules || {});
      } catch (e) {
        console.error(e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Same fix as ModuleCard: count against each module's generated lesson
  // plan length when one exists, since that's what's actually checked off.
  const totalTopics = MODULES.reduce(
    (sum, m) => sum + (progress[m.id]?.lessonPlan?.lessons?.length || m.topics.length),
    0
  );
  const doneTopics = MODULES.reduce(
    (sum, m) => sum + (progress[m.id]?.completedTopics?.length || 0),
    0
  );
  const overallPct = totalTopics ? Math.min(100, Math.round((doneTopics / totalTopics) * 100)) : 0;
  const hasAnyProgress = Object.keys(progress).length > 0;

  async function handleReset() {
    if (!uid) return;
    const ok = window.confirm(
      "Reset ALL progress across every module? Completed lessons, saved lesson plans, and weak areas will be cleared. This can't be undone."
    );
    if (!ok) return;
    setResetting(true);
    try {
      await resetAllProgress(uid);
      setProgress({});
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-brand-600">Internee.pk</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">Your AI Tutor</h1>
        <p className="mt-2 text-slate-500">
          Pick a module to get a personalized lesson plan, ask questions any time, and track your progress and weak areas automatically.
        </p>

        {ready && (
          <div className="mt-4 max-w-sm">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Overall progress</span>
              <span>{overallPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${overallPct}%` }} />
            </div>
            {hasAnyProgress && (
              <button
                onClick={handleReset}
                disabled={resetting}
                className="mt-3 text-xs text-slate-400 underline hover:text-red-600 disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "Reset all progress"}
              </button>
            )}
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULES.map((mod) => (
          <ModuleCard key={mod.id} mod={mod} progress={progress[mod.id]} />
        ))}
      </section>
    </main>
  );
}
