"use client";

import { useState } from "react";

type Tool = "b64" | "hex" | "url" | "sha" | "jwt" | "fetch";

export default function ToolsPanel({ onClose }: { onClose: () => void }) {
  const [tool, setTool] = useState<Tool>("b64");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"enc" | "dec">("enc");

  const sha = async (t: string) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const run = async () => {
    setOutput("");
    try {
      if (tool === "b64") {
        setOutput(
          mode === "enc"
            ? btoa(unescape(encodeURIComponent(input)))
            : decodeURIComponent(escape(atob(input.trim())))
        );
      } else if (tool === "hex") {
        if (mode === "enc") {
          setOutput(
            Array.from(new TextEncoder().encode(input))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("")
          );
        } else {
          const clean = input.replace(/[^0-9a-f]/gi, "");
          const bytes = new Uint8Array(clean.match(/.{1,2}/g)?.map((h) => parseInt(h, 16)) || []);
          setOutput(new TextDecoder().decode(bytes));
        }
      } else if (tool === "url") {
        setOutput(mode === "enc" ? encodeURIComponent(input) : decodeURIComponent(input));
      } else if (tool === "sha") {
        setOutput(await sha(input));
      } else if (tool === "jwt") {
        const parts = input.trim().split(".");
        if (parts.length < 2) throw new Error("JWT غير صالح");
        const dec = (s: string) =>
          JSON.stringify(
            JSON.parse(
              decodeURIComponent(
                escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))
              )
            ),
            null,
            2
          );
        setOutput("HEADER:\n" + dec(parts[0]) + "\n\nPAYLOAD:\n" + dec(parts[1]));
      } else if (tool === "fetch") {
        const r = await fetch(`/api/fetch?url=${encodeURIComponent(input.trim())}`);
        const t = await r.text();
        try {
          const j = JSON.parse(t);
          setOutput(`[${j.status}] ${j.contentType}\n\n${j.text}`);
        } catch {
          setOutput(t);
        }
      }
    } catch (e: any) {
      setOutput("خطأ: " + (e?.message || "فشل"));
    }
  };

  const tools: { id: Tool; label: string }[] = [
    { id: "b64", label: "Base64" },
    { id: "hex", label: "Hex" },
    { id: "url", label: "URL" },
    { id: "sha", label: "SHA-256" },
    { id: "jwt", label: "JWT" },
    { id: "fetch", label: "جلب صفحة" },
  ];

  const cheat = `# استطلاع
nmap -sV -sC -p- TARGET
nmap -sU --top-ports 50 TARGET

# ويب
ffuf -u https://TARGET/FUZZ -w wordlist.txt
gobuster dir -u https://TARGET -w wordlist.txt
nikto -h https://TARGET
whatweb https://TARGET

# SQLi / XSS
sqlmap -u "https://TARGET/?id=1" --batch --dbs
dalfox url https://TARGET

# كلمات مرور
hydra -L users.txt -P pass.txt ssh://TARGET
john --wordlist=rockyou.txt hash.txt

# AD
netexec smb TARGET -u '' -p '' --shares
impacket-GetNPUsers DOMAIN/ -dc-ip DC

# أندرويد
apktool d app.apk
jadx-gui app.apk
frida-ps -U`;

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer">
        <h3>
          أدوات
          <button className="mini" onClick={onClose}>
            إغلاق
          </button>
        </h3>

        <div className="toolrow">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`pill ${tool === t.id ? "on" : ""}`}
              onClick={() => {
                setTool(t.id);
                setOutput("");
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="field">
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="المدخل…"
          />
        </div>

        {(tool === "b64" || tool === "hex" || tool === "url") && (
          <div className="toolrow">
            <button className={`pill ${mode === "enc" ? "on" : ""}`} onClick={() => setMode("enc")}>
              تشفير
            </button>
            <button className={`pill ${mode === "dec" ? "on" : ""}`} onClick={() => setMode("dec")}>
              فك
            </button>
          </div>
        )}

        <button className="btn" onClick={run} style={{ marginBottom: 12 }}>
          تنفيذ
        </button>

        {output && (
          <>
            <div className="toolout">{output}</div>
            <button
              className="btn ghost"
              style={{ marginTop: 8 }}
              onClick={() => navigator.clipboard.writeText(output)}
            >
              نسخ الناتج
            </button>
          </>
        )}

        <h3 style={{ marginTop: 22 }}>ورقة أوامر</h3>
        <div className="cheat">{cheat}</div>
      </aside>
    </>
  );
}
