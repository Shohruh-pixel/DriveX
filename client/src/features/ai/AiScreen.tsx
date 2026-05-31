import React, { useState, useRef, useEffect } from "react";
import { PageLayout } from "@shared/ui/Layout";
import { Button } from "@shared/ui/Button";
import { Card } from "@shared/ui/Card";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";

interface Message { role: "user" | "assistant"; text: string; ts: number }

const QUICK_PROMPTS = [
  "Когда менять масло в Toyota Camry?",
  "Признаки неисправности тормозов",
  "Как проверить давление в шинах?",
  "Почему горит Check Engine?",
  "Лучшее масло для зимы",
];

async function askAi(question: string, carInfo: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, context: `Автомобиль пользователя: ${carInfo}` }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.message || data.response || "Не удалось получить ответ.";
  } catch {
    // Fallback ответы если сервер недоступен
    if (question.toLowerCase().includes("масло")) return "Масло рекомендуется менять каждые 7 000–10 000 км или раз в год. Для Toyota Camry 2019–2023 используйте SAE 0W-20 или 5W-30 (уточняйте в мануале). Признаки что пора: тёмный цвет масла, запах гари, увеличенный расход.";
    if (question.toLowerCase().includes("тормоз")) return "Признаки проблем с тормозами: скрип или визг при торможении, машину тянет в сторону, педаль «проваливается», вибрация руля при торможении. Рекомендую провериться в СТО — это вопрос безопасности.";
    if (question.toLowerCase().includes("шин") || question.toLowerCase().includes("давление")) return "Давление в шинах проверяйте раз в месяц и перед дальними поездками. Норма для большинства авто — 2.2–2.5 бар (32–36 psi). Точное значение — на наклейке внутри двери водителя.";
    if (question.toLowerCase().includes("check") || question.toLowerCase().includes("лампа")) return "Check Engine может означать много разных проблем — от незакрытой крышки бензобака до серьёзных неисправностей двигателя. Нужна компьютерная диагностика в СТО для считывания кодов ошибок (OBD-II сканер).";
    return `Хороший вопрос! По вашему запросу «${question}» рекомендую обратиться к специалисту в ближайший СТО. Опишите симптомы подробнее и мастер поможет диагностировать проблему.`;
  }
}

export function AiScreen() {
  const { cars, activeCarId } = useAuthStore();
  const activeCar = cars.find((c) => c.id === activeCarId) ?? cars[0];
  const carInfo   = activeCar ? `${activeCar.make} ${activeCar.model} ${activeCar.year}` : "не указан";

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: `Привет! Я AI-ассистент DRIVEX. ${activeCar ? `Вижу ваш ${carInfo}.` : ""} Задайте вопрос про техобслуживание, ремонт или выбор запчастей.`, ts: Date.now() },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await askAi(text, carInfo);
      setMessages((prev) => [...prev, { role: "assistant", text: reply, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="🤖 AI Ассистент">
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 130px)" }}>

        {/* Быстрые вопросы */}
        <div style={{ padding: "12px 16px", display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
          {QUICK_PROMPTS.map((q) => (
            <button key={q} onClick={() => send(q)} style={{ flexShrink: 0, padding: "7px 13px", borderRadius: "20px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: colors.neonCyan, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}>
              {q}
            </button>
          ))}
        </div>

        {/* Сообщения */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((msg) => (
            <div key={msg.ts} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                background: msg.role === "user" ? `linear-gradient(135deg, ${colors.neonCyan}, ${colors.electricBlue})` : "rgba(255,255,255,0.07)",
                color: msg.role === "user" ? colors.black : colors.white,
                fontSize: "14px",
                lineHeight: 1.5,
                fontWeight: msg.role === "user" ? 600 : 400,
              }}>
                {msg.role === "assistant" && <span style={{ fontSize: "16px", marginRight: "6px" }}>🤖</span>}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "4px", padding: "12px 16px", background: "rgba(255,255,255,0.07)", borderRadius: "20px 20px 20px 4px", width: "fit-content" }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors.silver, animation: `bounce 1s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Ввод */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "10px", flexShrink: 0, background: colors.black }}>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
            placeholder="Спросите про ваш автомобиль..."
            style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: colors.white, fontSize: "15px", outline: "none" }}
          />
          <Button onClick={() => send(input)} disabled={!input.trim() || loading} style={{ padding: "12px 18px", borderRadius: "16px", flexShrink: 0 }}>
            ↑
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </PageLayout>
  );
}
