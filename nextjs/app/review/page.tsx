"use client";

import { useEffect, useState } from "react";

type Draft = { id: string; title: string; confidentiality: string };

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ReviewPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [reviewBy, setReviewBy] = useState(plusDays(180));
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadDrafts() {
    const r = await fetch("/api/drafts");
    const data = await r.json();
    setDrafts(data.drafts ?? []);
  }
  useEffect(() => {
    void loadDrafts();
  }, []);

  async function open(id: string) {
    setSel(id);
    setStatus(null);
    const r = await fetch(`/api/draft?id=${encodeURIComponent(id)}`);
    const data = await r.json();
    setMarkdown(data.markdown ?? "");
  }

  async function save() {
    if (!sel) return;
    setBusy(true);
    await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel, markdown }),
    });
    setBusy(false);
    setStatus("Saved edits.");
  }

  async function promote() {
    if (!sel) return;
    setBusy(true);
    const r = await fetch("/api/draft/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel, verified_by: verifiedBy, review_by: reviewBy }),
    });
    const data = await r.json();
    setBusy(false);
    if (data.error) {
      setStatus(data.error);
    } else {
      setStatus(`Promoted to active: ${data.id}`);
      setSel(null);
      setMarkdown("");
      void loadDrafts();
    }
  }

  async function reject() {
    if (!sel) return;
    if (!confirm("Discard this draft permanently?")) return;
    setBusy(true);
    await fetch("/api/draft/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sel }),
    });
    setBusy(false);
    setStatus("Draft discarded.");
    setSel(null);
    setMarkdown("");
    void loadDrafts();
  }

  return (
    <>
      <header>
        <h1>Review queue</h1>
        <p>
          Drafts are not firm knowledge until a person verifies them. Edit, then promote with your
          name and a next-review date — or discard. <a href="/">← back to capture</a>
        </p>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, paddingBottom: 40 }}>
        <aside>
          <h3 style={{ fontSize: 14, color: "var(--muted)", margin: "8px 0" }}>
            {drafts.length} awaiting review
          </h3>
          {drafts.map((d) => (
            <button
              key={d.id}
              onClick={() => void open(d.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                marginBottom: 6,
                background: sel === d.id ? "var(--accent)" : "#fff",
                color: sel === d.id ? "#fff" : "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 14,
              }}
            >
              {d.title}
              <div style={{ fontSize: 12, opacity: 0.7 }}>{d.confidentiality}</div>
            </button>
          ))}
          {drafts.length === 0 && <p style={{ color: "var(--muted)" }}>Nothing to review.</p>}
        </aside>

        <section>
          {sel ? (
            <>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 360,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 13,
                  padding: 12,
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  background: "#fff",
                  whiteSpace: "pre",
                  overflowWrap: "normal",
                }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                <button className="send" onClick={() => void save()} disabled={busy}>
                  Save edits
                </button>
                <span style={{ width: 1, height: 24, background: "var(--line)" }} />
                <label style={{ fontSize: 13, color: "var(--muted)" }}>Verified by</label>
                <input
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  placeholder="your name"
                  style={{ font: "inherit", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 8 }}
                />
                <label style={{ fontSize: 13, color: "var(--muted)" }}>Review by</label>
                <input
                  type="date"
                  value={reviewBy}
                  onChange={(e) => setReviewBy(e.target.value)}
                  style={{ font: "inherit", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 8 }}
                />
                <button className="done" onClick={() => void promote()} disabled={busy}>
                  Promote to active
                </button>
                <button
                  onClick={() => void reject()}
                  disabled={busy}
                  style={{ background: "#fff", color: "var(--accent)", border: "1px solid var(--accent)" }}
                >
                  Discard
                </button>
              </div>
              {status && <p style={{ color: "var(--muted)", marginTop: 10 }}>{status}</p>}
            </>
          ) : (
            <p style={{ color: "var(--muted)" }}>Select a draft to review.</p>
          )}
        </section>
      </main>
    </>
  );
}
