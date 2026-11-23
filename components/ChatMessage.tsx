"use client";

import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Msg } from "@/lib/store";

function CodeBlock({ children }: any) {
  const ref = useRef<HTMLPreElement>(null);
  const lang = (children?.props?.className || "").replace("language-", "") || "code";

  const copy = () => {
    const t = ref.current?.innerText || "";
    navigator.clipboard.writeText(t);
  };

  return (
    <div className="codewrap">
      <div className="codehead">
        <span>{lang}</span>
        <button className="mini" onClick={copy}>
          نسخ
        </button>
      </div>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

export default function ChatMessage({
  m,
  streaming,
}: {
  m: Msg;
  streaming?: boolean;
}) {
  const copyAll = () => navigator.clipboard.writeText(m.content);

  return (
    <div className={`msg ${m.role}`}>
      <div className="avatar">{m.role === "user" ? "أنت" : "AI"}</div>
      <div style={{ maxWidth: "100%" }}>
        <div className="bubble">
          {m.role === "assistant" ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{ pre: CodeBlock }}
            >
              {m.content || ""}
            </ReactMarkdown>
          ) : (
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          )}
          {streaming && <span className="cursor" />}
        </div>

        {m.files && m.files.length > 0 && (
          <div className="filechips">
            {m.files.map((f, i) => (
              <span className="chip" key={i}>
                {f.kind === "image" ? "🖼 " : "📄 "}
                {f.name}
              </span>
            ))}
          </div>
        )}

        {!streaming && m.content && (
          <div className="rowacts">
            <button className="mini" onClick={copyAll}>
              نسخ الرد
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
