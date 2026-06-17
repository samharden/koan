/**
 * Draft-review card — the interactive MCP App UI.
 *
 * Renders a captured draft inside the Cowork iframe and lets the user edit,
 * promote (verify), or discard it — each action calls the corresponding server
 * tool through the ext-apps bridge (app.callServerTool). The draft arrives via
 * the `toolresult` notification's structuredContent.
 *
 * Bundled by esbuild and inlined into the ui://kg-draft-card resource.
 */
import { App } from "@modelcontextprotocol/ext-apps";

type Draft = { id: string; title: string; status: string; confidentiality: string; markdown: string };

const root = document.getElementById("root")!;
const app = new App({ name: "kg-draft-card", version: "0.1.0" });

let draft: Draft | null = null;
let mode: "view" | "edit" | "promote" | "done" = "view";
let message = "";
let busy = false;

app.ontoolresult = (res: any) => {
  const sc = res?.structuredContent;
  if (sc && typeof sc.markdown === "string") {
    draft = sc as Draft;
    mode = draft.status === "active" ? "done" : "view";
    render();
  }
};

app
  .connect()
  .then(() => {
    if (!draft) root.innerHTML = shell(`<div style="color:#6b655c">Waiting for a draft…</div>`);
  })
  .catch((e: any) => {
    root.innerHTML = shell(`<div style="color:#b4532a">Card error: ${esc(String(e?.message ?? e))}</div>`);
  });

// ---- actions -------------------------------------------------------------
async function call(name: string, args: Record<string, unknown>) {
  busy = true;
  render();
  try {
    const r = await app.callServerTool({ name, arguments: args });
    busy = false;
    return r as any;
  } catch (e: any) {
    busy = false;
    return { isError: true, content: [{ type: "text", text: String(e?.message ?? e) }] };
  }
}

const resultText = (r: any): string =>
  (r?.content ?? []).find((c: any) => c?.type === "text")?.text ?? "";

async function saveEdit(text: string) {
  const r = await call("update_draft", { id: draft!.id, markdown: text });
  if (r.isError) message = "Save failed: " + resultText(r);
  else {
    draft!.markdown = text;
    message = "Saved.";
    mode = "view";
  }
  render();
}

async function promote(verifiedBy: string, reviewBy: string) {
  if (!verifiedBy.trim()) {
    message = "Enter who is verifying this before promoting.";
    render();
    return;
  }
  const r = await call("promote_unit", { id: draft!.id, verified_by: verifiedBy, review_by: reviewBy });
  if (r.isError) message = "Promote failed: " + resultText(r);
  else {
    message = resultText(r) || "Promoted to active.";
    mode = "done";
  }
  render();
}

async function discard() {
  const r = await call("reject_draft", { id: draft!.id });
  if (r.isError) message = "Discard failed: " + resultText(r);
  else {
    message = "Draft discarded.";
    mode = "done";
  }
  render();
}

// ---- rendering -----------------------------------------------------------
function render() {
  if (!draft) return;
  const badge = (t: string, c: string) =>
    `<span style="font-size:11px;background:${c};color:#fff;border-radius:6px;padding:2px 7px;margin-left:6px">${esc(t)}</span>`;

  const header =
    `<div style="display:flex;align-items:center;flex-wrap:wrap">` +
    `<strong style="font-size:16px">${esc(draft.title)}</strong>` +
    badge(draft.status || "draft", draft.status === "active" ? "#2e7d32" : "#9a8f7d") +
    (draft.confidentiality ? badge(draft.confidentiality, "#6b655c") : "") +
    `</div>`;

  let main = "";
  const binds: Array<[string, string, (e?: any) => void]> = [];

  if (mode === "edit") {
    main =
      `<textarea id="ed" spellcheck="false" style="width:100%;min-height:240px;font-family:ui-monospace,Menlo,monospace;font-size:12px;padding:10px;border:1px solid #e2dccf;border-radius:8px;white-space:pre">${esc(draft.markdown)}</textarea>` +
      row([button("save", "Save", "#1f1d1a"), button("cancel", "Cancel", "#fff", "#1f1d1a")]);
    binds.push(["save", "click", () => saveEdit((document.getElementById("ed") as HTMLTextAreaElement).value)]);
    binds.push(["cancel", "click", () => ((mode = "view"), (message = ""), render())]);
  } else if (mode === "promote") {
    main =
      mdRender(draft.markdown) +
      `<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">` +
      `<label style="font-size:12px;color:#6b655c">Verified by</label>` +
      `<input id="vb" placeholder="your name" style="font:inherit;padding:5px 9px;border:1px solid #e2dccf;border-radius:7px">` +
      `<label style="font-size:12px;color:#6b655c">Review by</label>` +
      `<input id="rb" type="date" value="${plusDays(180)}" style="font:inherit;padding:5px 9px;border:1px solid #e2dccf;border-radius:7px">` +
      `</div>` +
      row([button("doPromote", "Confirm promote", "#2e7d32"), button("cancel", "Cancel", "#fff", "#1f1d1a")]);
    binds.push([
      "doPromote",
      "click",
      () =>
        promote(
          (document.getElementById("vb") as HTMLInputElement).value,
          (document.getElementById("rb") as HTMLInputElement).value
        ),
    ]);
    binds.push(["cancel", "click", () => ((mode = "view"), (message = ""), render())]);
  } else if (mode === "done") {
    main = mdRender(draft.markdown);
  } else {
    // view
    main =
      mdRender(draft.markdown) +
      row([
        button("edit", "Edit", "#1f1d1a"),
        button("promote", "Promote", "#2e7d32"),
        button("discard", "Discard", "#fff", "#b4532a"),
      ]);
    binds.push(["edit", "click", () => ((mode = "edit"), (message = ""), render())]);
    binds.push(["promote", "click", () => ((mode = "promote"), (message = ""), render())]);
    binds.push(["discard", "click", () => discard()]);
  }

  const note = message
    ? `<div style="margin-top:10px;color:#6b655c;font-size:13px">${esc(message)}</div>`
    : "";
  const spinner = busy ? `<div style="margin-top:8px;color:#9a8f7d;font-size:12px">working…</div>` : "";

  root.innerHTML = shell(header + `<div style="margin-top:8px">${main}</div>` + note + spinner);
  for (const [id, ev, fn] of binds) document.getElementById(id)?.addEventListener(ev, fn);
}

// ---- helpers -------------------------------------------------------------
function shell(inner: string): string {
  return (
    `<div style="font:14px/1.5 Georgia,'Times New Roman',serif;color:#1f1d1a;padding:14px;background:#f4f1ea">` +
    `<div style="background:#fff;border:1px solid #e2dccf;border-left:4px solid #b4532a;border-radius:10px;padding:16px">${inner}</div>` +
    `</div>`
  );
}

function row(buttons: string[]): string {
  return `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${buttons.join("")}</div>`;
}

function button(id: string, label: string, bg: string, fg = "#fff"): string {
  const border = bg === "#fff" ? `border:1px solid ${fg};` : "border:0;";
  return `<button id="${id}" style="font:inherit;${border}background:${bg};color:${fg};border-radius:8px;padding:8px 14px;cursor:pointer">${esc(label)}</button>`;
}

function mdRender(md: string): string {
  const body = md.replace(/^---\n[\s\S]*?\n---\n?/, "");
  let html = "";
  let inList = false;
  const closeList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };
  for (const ln of body.split("\n")) {
    if (/^#{2,}\s+/.test(ln)) {
      closeList();
      html += `<h4 style="margin:14px 0 4px">${esc(ln.replace(/^#{2,}\s+/, ""))}</h4>`;
    } else if (/^#\s+/.test(ln)) {
      closeList();
      html += `<h3 style="margin:0 0 6px">${esc(ln.replace(/^#\s+/, ""))}</h3>`;
    } else if (/^-\s+/.test(ln)) {
      if (!inList) {
        html += `<ul style="margin:4px 0 4px 18px">`;
        inList = true;
      }
      html += `<li>${esc(ln.replace(/^-\s+/, ""))}</li>`;
    } else if (ln.trim() === "") {
      closeList();
    } else {
      closeList();
      html += `<p style="margin:4px 0">${esc(ln)}</p>`;
    }
  }
  closeList();
  return html;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
