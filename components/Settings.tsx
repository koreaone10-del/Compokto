"use client";

import { useState } from "react";
import type { Settings as S } from "@/lib/store";

export default function Settings({
  settings,
  setSettings,
  onClose,
  onClear,
}: {
  settings: S;
  setSettings: (s: S) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const patch = (p: Partial<S>) => setSettings({ ...settings, ...p });

  const pullModels = async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `/api/models?baseUrl=${encodeURIComponent(settings.baseUrl)}&apiKey=${encodeURIComponent(settings.apiKey)}`
      );
      const j = await r.json();
      setModels(j.data || []);
    } catch {
      setModels([]);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer">
        <h3>
          الإعدادات
          <button className="mini" onClick={onClose}>
            إغلاق
          </button>
        </h3>

        <div className="hintbox">
          المفتاح يُخزَّن في متصفحك فقط ولا يُحفظ على السيرفر. أي مزوّد بصيغة OpenAI يعمل.
        </div>

        <div className="field">
          <label>Base URL</label>
          <input
            value={settings.baseUrl}
            onChange={(e) => patch({ baseUrl: e.target.value })}
            placeholder="https://api.venice.ai/api/v1"
          />
        </div>

        <div className="field">
          <label>API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => patch({ apiKey: e.target.value })}
            placeholder="sk-…"
          />
        </div>

        <div className="field">
          <label>الموديل</label>
          <input
            value={settings.model}
            onChange={(e) => patch({ model: e.target.value })}
            placeholder="venice-uncensored"
          />
        </div>

        <button className="btn ghost" onClick={pullModels} style={{ marginBottom: 10 }}>
          {loading ? "جارٍ الجلب…" : "جلب قائمة الموديلات"}
        </button>

        {models.length > 0 && (
          <div className="field">
            <label>المتاح ({models.length})</label>
            <select value={settings.model} onChange={(e) => patch({ model: e.target.value })}>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Temperature: {settings.temperature}</label>
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => patch({ temperature: Number(e.target.value) })}
          />
        </div>

        <div className="field">
          <label>Max tokens</label>
          <input
            type="number"
            value={settings.maxTokens}
            onChange={(e) => patch({ maxTokens: Number(e.target.value) })}
          />
        </div>

        <div className="hintbox">
          <b>مزوّدون:</b>
          <br />
          Venice: api.venice.ai/api/v1
          <br />
          OpenRouter: openrouter.ai/api/v1
          <br />
          Groq: api.groq.com/openai/v1
          <br />
          Ollama محلي: عنوان النفق + /v1
        </div>

        <button className="btn ghost" onClick={onClear}>
          مسح المحادثة
        </button>
      </aside>
    </>
  );
            }
