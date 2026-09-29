"use client";
import { useState } from "react";

export default function Quiz({ moduleId, onWeakAreaFound }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setSubmitted(false);
    setAnswers({});
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setQuiz(data.quiz);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    setSubmitted(true);
    const wrongTopics = [];
    const rightTopics = [];
    quiz.questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) wrongTopics.push(q.question);
      else rightTopics.push(q.question);
    });
    onWeakAreaFound?.(wrongTopics, rightTopics);
  }

  const score = quiz
    ? quiz.questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Quick Check Quiz</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? "Generating…" : quiz ? "New quiz" : "Start quiz"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {quiz && (
        <div className="mt-4 space-y-4">
          {quiz.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-900">{i + 1}. {q.question}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((opt, j) => {
                  const isCorrect = submitted && j === q.correctIndex;
                  const isWrongPick = submitted && answers[i] === j && j !== q.correctIndex;
                  return (
                    <label
                      key={j}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                        isCorrect ? "bg-green-50 text-green-700" : isWrongPick ? "bg-red-50 text-red-700" : "text-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        disabled={submitted}
                        checked={answers[i] === j}
                        onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-2 text-[11px] text-slate-500">{q.explanation}</p>
              )}
            </div>
          ))}

          {!submitted ? (
            <button
              onClick={submit}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
            >
              Submit answers
            </button>
          ) : (
            <p className="text-sm font-medium text-slate-900">
              Score: {score} / {quiz.questions.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
