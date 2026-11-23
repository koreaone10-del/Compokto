export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("url");
  if (!target) return new Response("url required", { status: 400 });

  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (!/^https?:$/.test(u.protocol)) return new Response("only http/https", { status: 400 });

  try {
    const r = await fetch(u.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Axiom/1.0)" },
    });
    const raw = (await r.text()).slice(0, 300000);

    const looksHtml = /html/i.test(r.headers.get("content-type") || "");
    let out = raw;
    if (looksHtml) {
      out = raw
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
    }

    return Response.json({
      status: r.status,
      contentType: r.headers.get("content-type") || "",
      text: out.slice(0, 60000),
    });
  } catch (e: any) {
    return new Response(e?.message || "fetch failed", { status: 502 });
  }
}
