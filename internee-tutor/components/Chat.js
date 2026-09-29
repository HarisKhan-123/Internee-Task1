"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Minimal styling for elements GFM markdown can produce (tables, lists,
// code) since Tailwind's typography plugin isn't installed — without this,
// a table renders as unstyled/unreadable default browser markup.
const markdownComponents = {
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-slate-200 px-2 py-1.5 text-left font-semibold text-slate-700 whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-slate-100 px-2 py-1.5 align-top">{children}</td>
  ),
  ul: ({ children }) => <ul className="my-1 list-disc pl-4 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal pl-4 space-y-0.5">{children}</ol>,
  code: ({ children }) => (
    <code className="rounded bg-slate-200/70 px-1 py-0.5 text-[11px]">{children}</code>
  ),
  p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
};

export default function Chat({ moduleId }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything about this module and I'll help you understand it." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, messages: next.filter((m) => m.role !== "system") }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[480px] rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-400">
              thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-slate-200 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question about this module…"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
