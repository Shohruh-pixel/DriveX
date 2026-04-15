"use strict";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intent", "label", "title", "summary", "causes", "actions", "urgency", "recommendation", "cta", "suggestions", "sourcesUsed", "services"],
  properties: {
    intent: { type: "string", enum: ["explain_service", "diagnostic", "maintenance", "find_service", "clarify"] },
    label: { type: "string" },
    title: { type: "string" },
    summary: { type: "string" },
    causes: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    urgency: { type: "string", enum: ["low", "medium", "high"] },
    recommendation: { type: "string" },
    cta: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary"],
      properties: {
        primary: {
          type: "object",
          additionalProperties: false,
          required: ["label", "action"],
          properties: { label: { type: "string" }, action: { type: "string" } }
        },
        secondary: {
          type: "object",
          additionalProperties: false,
          required: ["label", "action"],
          properties: { label: { type: "string" }, action: { type: "string" } }
        }
      }
    },
    suggestions: { type: "array", items: { type: "string" } },
    sourcesUsed: { type: "array", items: { type: "string" } },
    services: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "city", "district", "rating", "isOpen"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          city: { type: "string" },
          district: { type: "string" },
          rating: { type: "number" },
          isOpen: { type: "boolean" }
        }
      }
    }
  }
};

const systemPrompt = `
Ты AI-консультант DriveX для автомобильного приложения.
Отвечай как умный мастер и понятный консультант: коротко, точно, безопасно.
Используй только переданный retrieval-контекст, данные автомобиля и безопасный здравый смысл.
Не путай тему вопроса.
Если intent = explain_service, объясняй деталь или слова мастера. Не диагностируй другую проблему.
Если intent = diagnostic, дай возможные причины симптома и действия.
Если intent = maintenance, используй правила обслуживания и пробег.
Если intent = find_service, используй только services из контекста.
Если ответ про конкретную деталь или запчасть, secondary CTA должен быть: label "Найти запчасть", action "find_part".
Если ответ именно про подбор сервиса, secondary CTA должен быть: label "Показать на карте", action "show_map".
Если context слабый, дай полезное уточнение и следующий шаг.
Не ставь точный диагноз как факт. Пиши: "возможные причины", "может быть связано", "желательно проверить".
Никогда не отвечай "не знаю" и не оставляй пользователя без следующего шага.
Для тормозов, густого дыма, запаха гари, сильного перегрева и потери тяги ставь urgency = "high".
Не придумывай несуществующие сервисы.
Верни только JSON по схеме, без markdown и без лишнего текста.
`;

function buildPromptContext(context) {
  return {
    userMessage: context.input.userMessage,
    normalizedMessage: context.classification.normalizedMessage,
    localIntentHint: context.classification.intent,
    localIntentConfidence: context.classification.confidence,
    vehicle: context.vehicle,
    location: context.input.location,
    locale: context.input.locale || "ru",
    retrieval: context.retrieval
  };
}

module.exports = {
  systemPrompt,
  responseSchema,
  buildPromptContext
};
