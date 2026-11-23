"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import Composer from "@/components/Composer";
import Settings from "@/components/Settings";
import ToolsPanel from "@/components/ToolsPanel";
import { MODES, MODE_ORDER, type ModeId } from "@/lib/modes";
import {
  DEFAULT_SETTINGS,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
  uid,
  type Attachment,
  type Msg,
  type Settings as S,
} from "@/lib/store";
import { buildPayload, streamChat } from "@/lib/api";

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [settings, setSettings] = useState<S>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<ModeId>("general");
  const [busy, setBusy] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setMessages(loadHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveHistory(messages);
  }, [messages, ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamId]);

  const updateSettings = (s: S) => {
    setSettings(s);
    saveSettings(s);
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(false);
    setStreamId(null);
  };

  const send = useCallback(
    async (text: string, files: Attachment[]) => {
      if (!settings.apiKey && !settings.baseUrl.includes("localhost")) {
        setErr("أضف API Key من الإعدادات أولاً.");
        setShowSettings(true);
        return;
      }

      setErr("");
      const userMsg: Msg = { id: uid(), role: "user", content: text, files };
      const history = [...messages, userMsg];
      setMessages(history);

      const aId = uid();
      setMessages((p) => [...p, { id: aId, role: "assistant", content: "" }]);
      setBusy(true);
      setStreamId(aId);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const payload = buildPayload(history, mode, settings);
        await streamChat(
          payload,
          (d) => {
            setMessages((p) =>
              p.map((m) => (m.id === aId ? { ...m, content: m.content + d } : m))
            );
          },
          ctrl.signal
        );
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setErr(e?.message?.slice(0, 400) || "فشل الاتصال بالمزوّد");
        }
      } finally {
        setBusy(false);
        setStreamId(null);
      }
    },
    [messages, mode, settings]
  );

  return (
    <div className="app">
      <header className="bar">
        <span className="dot" />
        <span className="brand">AXIOM</span>
        <span className="spacer" />
        <button className="iconbtn" onClick={() => setShowTools(true)} title="أدوات">
          ⚙
        </button>
        <button className="iconbtn" onClick={() => setShowSettings(true)} title="إعدادات">
          ☰
        </button>
      </header>

      <div className="scroll">
        {messages.length === 0 && (
          <div className="hero">
            <h1>بلا قيود.</h1>
            <p>{MODES[mode].hint} — اختر وضعاً وابدأ</p>
            <div className="cards">
              {MODE_ORDER.map((id) => (
                <button key={id} className="card" onClick={() => setMode(id)}>
                  <span className="ic">{MODES[id].icon}</span>
                  <b>{MODES[id].label}</b>
                  <span>{MODES[id].hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} m={m} streaming={m.id === streamId} />
        ))}

        <div ref={bottomRef} />
      </div>

      {err && <div className="err">{err}</div>}

      <Composer mode={mode} setMode={setMode} onSend={send} busy={busy} onStop={stop} />

      {showSettings && (
        <Settings
          settings={settings}
          setSettings={updateSettings}
          onClose={() => setShowSettings(false)}
          onClear={() => {
            setMessages([]);
            setShowSettings(false);
          }}
        />
      )}

      {showTools && <ToolsPanel onClose={() => setShowTools(false)} />}
    </div>
  );
}
