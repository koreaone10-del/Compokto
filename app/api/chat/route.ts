export const runtime = "edge";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const { baseUrl, apiKey, model, messages, temperature, maxTokens } = body || {};
  if (!baseUrl || !model) {
    return new Response("baseUrl and model are required", { status: 400 });
  }

  const url = String(baseUrl).replace(/\/+$/, "") + "/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: typeof temperature === "number" ? temperature : 0.7,
      max_tokens: typeof maxTokens === "number" ? maxTokens : 4096,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(text || `Upstream ${upstream.status}`, {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
