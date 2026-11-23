import type { Msg, Settings } from "./store";
import type { ModeId } from "./modes";
import { MODES } from "./modes";

export function buildPayload(history: Msg[], mode: ModeId, s: Settings) {
  const messages: any[] = [{ role: "system", content: MODES[mode].system }];

  for (const m of history) {
    if (m.role === "user" && m.files && m.files.length) {
      const parts: any[] = [];
      if (m.content) parts.push({ type: "text", text: m.content });
      for (const f of m.files) {
        if (f.kind === "image") {
          parts.push({ type: "image_url", image_url: { url: f.data } });
        } else {
          parts.push({
            type: "text",
            text: `\n--- ملف: ${f.name} ---\n${f.data}\n--- نهاية الملف ---\n`,
          });
        }
      }
      messages.push({ role: "user", content: parts });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }

  return {
    baseUrl: s.baseUrl,
    apiKey: s.apiKey,
    model: s.model,
    temperature: s.temperature,
    maxTokens: s.maxTokens,
    messages,
  };
}

export async function streamChat(
  payload: any,
  onDelta: (t: string) => void,
  signal: AbortSignal
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {}
    throw new Error(detail || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const j = JSON.parse(data);
        const d = j.choices?.[0]?.delta?.content;
        if (typeof d === "string" && d) onDelta(d);
      } catch {}
    }
  }
}
