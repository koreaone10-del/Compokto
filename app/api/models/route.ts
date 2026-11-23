export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = searchParams.get("baseUrl");
  const apiKey = searchParams.get("apiKey") || "";
  if (!baseUrl) return new Response("baseUrl required", { status: 400 });

  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const r = await fetch(String(baseUrl).replace(/\/+$/, "") + "/models", { headers });
    if (!r.ok) return Response.json({ data: [] }, { status: 200 });
    const j: any = await r.json();
    const ids = (j.data || [])
      .map((m: any) => m.id || m.name)
      .filter(Boolean)
      .sort();
    return Response.json({ data: ids });
  } catch {
    return Response.json({ data: [] }, { status: 200 });
  }
}
