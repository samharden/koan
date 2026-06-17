"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type Result = { path: string; title: string; confidentiality: string; open_questions: string[] };

// Kept in sync with KICKOFF in lib/capture.ts. Hidden from the rendered chat;
// the server-side transcript formatter drops it too.
const KICKOFF = "Let's begin. Ask me what I want to capture.";

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "user", content: KICKOFF }]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Kick off the first interviewer question once on mount.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void agentTurn([{ role: "user", content: KICKOFF }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [messages, streaming, result]);

  async function agentTurn(history: Msg[]) {
    setBusy(true);
    setStreaming("");
    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    if (!res.body) {
      setBusy(false);
      return;
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let acc = "";
    for (;;) {
      const { value, done: d } = await reader.read();
      if (d) break;
      acc += dec.decode(value, { stream: true });
      setStreaming(acc);
    }
    setMessages([...history, { role: "assistant", content: acc.trim() }]);
    setStreaming("");
    setBusy(false);
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await agentTurn([...messages, { role: "user", content: text }]);
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, name }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setResult({ path: "", title: data.error, confidentiality: "", open_questions: [] });
    } else {
      setResult(data as Result);
      setDone(true);
    }
  }

  async function uploadDoc(file: File) {
    setUploadMsg(`Uploading ${file.name}…`);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);
    const res = await fetch("/api/ingest", { method: "POST", body: fd });
    const data = await res.json();
    if (data.error) {
      setUploadMsg(data.error);
    } else if (data.draft) {
      setUploadMsg(`Indexed ${data.chunks} chunk(s). Draft proposed: "${data.draft.title}" — needs review.`);
    } else {
      setUploadMsg(`Indexed ${data.chunks} chunk(s).`);
    }
  }

  const visible = messages.filter((m) => m.content !== KICKOFF);

  return (
    <>
      <header>
        <h1>Knowledge Capture</h1>
        <p>
          Tell me how the firm does one thing. I&apos;ll turn it into a reusable playbook for review.{" "}
          <a href="/review">Review queue →</a>
        </p>
      </header>

      <main>
        {visible.map((m, i) => (
          <div key={i} className={`msg ${m.role === "assistant" ? "agent" : "you"}`}>
            <div>
              <div className="who">{m.role === "assistant" ? "Interviewer" : "You"}</div>
              <div className="bubble">{m.content}</div>
            </div>
          </div>
        ))}

        {streaming && (
          <div className="msg agent">
            <div>
              <div className="who">Interviewer</div>
              <div className="bubble">{streaming}</div>
            </div>
          </div>
        )}

        {result && (
          <div className="result">
            {result.path ? (
              <>
                <strong>Draft saved for review.</strong>
                <div style={{ marginTop: 6 }}>Title: {result.title}</div>
                <div>
                  Confidentiality: <code>{result.confidentiality}</code>
                </div>
                <div style={{ marginTop: 6, color: "var(--muted)" }}>
                  Saved to <code>{result.path}</code>
                </div>
                {result.open_questions.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    Open questions for the reviewer:
                    <ul>
                      {result.open_questions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <span>{result.title}</span>
            )}
          </div>
        )}
      </main>

      {!done && (
        <footer>
          <div className="meta">
            <label htmlFor="name">Your name (optional):</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. J. Doe" size={14} />
            <label htmlFor="doc" style={{ marginLeft: "auto" }}>Upload a sample doc (PDF/DOCX/TXT/MD):</label>
            <input
              id="doc"
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadDoc(f);
                e.target.value = "";
              }}
            />
          </div>
          {uploadMsg && (
            <div className="meta" style={{ color: "var(--muted)", fontSize: 13 }}>
              {uploadMsg}
            </div>
          )}
          <div className="bar">
            <textarea
              rows={1}
              value={input}
              disabled={busy}
              placeholder="Type your answer…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button className="send" onClick={() => void send()} disabled={busy}>
              Send
            </button>
            <button className="done" onClick={() => void finish()} disabled={busy}>
              Generate draft
            </button>
          </div>
        </footer>
      )}
    </>
  );
}
