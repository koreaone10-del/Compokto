"use client";

import { useRef, useState } from "react";
import type { Attachment } from "@/lib/store";
import { MODES, MODE_ORDER, type ModeId } from "@/lib/modes";

const MAX_TEXT = 60000;

export default function Composer({
  mode,
  setMode,
  onSend,
  busy,
  onStop,
}: {
  mode: ModeId;
  setMode: (m: ModeId) => void;
  onSend: (text: string, files: Attachment[]) => void;
  busy: boolean;
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const next: Attachment[] = [];

    for (const f of Array.from(list).slice(0, 6)) {
      if (f.type.startsWith("image/")) {
        const data = await new Promise<string>((res) => {
          const fr = new FileReader();
          fr.onload = () => res(String(fr.result));
          fr.readAsDataURL(f);
        });
        next.push({ name: f.name, kind: "image", data });
      } else {
        const txt = await f.text();
        next.push({ name: f.name, kind: "text", data: txt.slice(0, MAX_TEXT) });
      }
    }
    setFiles((p) => [...p, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    if (busy) return;
    const t = text.trim();
    if (!t && files.length === 0) return;
    onSend(t, files);
    setText("");
    setFiles([]);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  return (
    <div className="composer">
      <div className="modes">
        {MODE_ORDER.map((id) => (
          <button
            key={id}
            className={`pill ${mode === id ? "on" : ""}`}
            onClick={() => setMode(id)}
          >
            {MODES[id].icon} {MODES[id].label}
          </button>
        ))}
      </div>

      {files.length > 0 && (
        <div className="filechips" style={{ marginBottom: 8 }}>
          {files.map((f, i) => (
            <span className="chip" key={i}>
              {f.kind === "image" ? "🖼 " : "📄 "}
              {f.name}
              <button
                className="mini"
                style={{ marginInlineStart: 6, padding: "0 4px" }}
                onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="inputwrap">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.php,.go,.rs,.java,.c,.cpp,.cs,.rb,.sh,.yml,.yaml,.sql,.html,.css,.xml,.csv,.log"
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
        <button className="iconbtn" onClick={() => fileRef.current?.click()} title="إرفاق">
          ＋
        </button>
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          placeholder={`اكتب هنا… (${MODES[mode].label})`}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {busy ? (
          <button className="send stop" onClick={onStop} title="إيقاف">
            ■
          </button>
        ) : (
          <button className="send" onClick={submit} title="إرسال">
            ↑
          </button>
        )}
      </div>
    </div>
  );
}
