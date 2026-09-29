"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getModule } from "@/lib/modules";
import { ensureSignedIn, getProgress, saveModuleProgress, firebaseError } from "@/lib/firebase";
import LessonPlan from "@/components/LessonPlan";
import Chat from "@/components/Chat";
import Quiz from "@/components/Quiz";

export default function ModulePage() {
  const { id } = useParams();
  const mod = getModule(id);

  const [uid, setUid] = useState(null);
  const [moduleProgress, setModuleProgress] = useState({
    completedTopics: [],
    weakAreas: [],
    lessonPlan: null,
  });
  const [ready, setReady] = useState(false);
  const [fbError, setFbError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const userId = await ensureSignedIn();
        setUid(userId);
        const data = await getProgress(userId);
        const mp = data.modules?.[id] || { completedTopics: [], weakAreas: [], lessonPlan: null };
        setModuleProgress(mp);
      } catch (e) {
        console.error(e);
      } finally {
        setFbError(firebaseError);
        setReady(true);
      }
    })();
  }, [id]);

  if (!mod) return notFound();

  async function persist(patch) {
    const merged = { ...moduleProgress, ...patch };
    setModuleProgress(merged);
    if (uid) await saveModuleProgress(uid, id, patch);
  }

  function toggleTopic(title) {
    const set = new Set(moduleProgress.completedTopics || []);
    set.has(title) ? set.delete(title) : set.add(title);
    persist({ completedTopics: Array.from(set) });
  }

  function addWeakAreas(wrongTopics, rightTopics = []) {
    const set = new Set(moduleProgress.weakAreas || []);
    // A repeat quiz can ask the same wording again and get it right —
    // clear those exact matches. New quizzes reword questions though, so
    // this alone won't clean up an old weak area; use the controls below for that.
    rightTopics.forEach((t) => set.delete(t));
    wrongTopics.forEach((t) => set.add(t));
    persist({ weakAreas: Array.from(set) });
  }

  function removeWeakArea(topic) {
    const set = new Set(moduleProgress.weakAreas || []);
    set.delete(topic);
    persist({ weakAreas: Array.from(set) });
  }

  function clearWeakAreas() {
    persist({ weakAreas: [] });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to dashboard</Link>

      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{mod.title}</h1>
        <p className="text-slate-500 mt-1">{mod.description}</p>
      </header>

      {fbError && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Firebase isn&apos;t working ({fbError}). Progress is being saved in this browser only.
        </p>
      )}
      {!ready ? (
        <p className="text-sm text-slate-400">Loading your progress…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {moduleProgress.weakAreas?.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-800">Weak areas</h3>
                  <button
                    onClick={clearWeakAreas}
                    className="text-xs text-amber-700 underline hover:text-amber-900"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {moduleProgress.weakAreas.map((w) => (
                    <li key={w} className="flex items-start justify-between gap-2 text-xs text-amber-800">
                      <span>{w}</span>
                      <button
                        onClick={() => removeWeakArea(w)}
                        className="shrink-0 text-amber-600 hover:text-amber-900"
                        title="Mark as resolved"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <LessonPlan
              moduleId={id}
              weakAreas={moduleProgress.weakAreas}
              existingPlan={moduleProgress.lessonPlan}
              completedTopics={moduleProgress.completedTopics}
              onGenerated={(plan) => persist({ lessonPlan: plan })}
              onToggleTopic={toggleTopic}
            />
            <Quiz moduleId={id} onWeakAreaFound={addWeakAreas} />
          </div>
          <div>
            <Chat moduleId={id} />
          </div>
        </div>
      )}
    </main>
  );
}
