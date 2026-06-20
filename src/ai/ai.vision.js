"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Vision-генератор карточки товара для DriveX seller CRM.
//
// Вход:  { image: dataURL|base64, title, ocrText, categories: [имена категорий] }
// Выход: { title, category, brand, sku, description, specs[], tags[] }
//
// Сейчас реализован провайдер Gemini (vision). Чтобы переключиться на другой
// движок (Ollama + Qwen2.5-VL, Grok и т.д.) — добавь свою ветку в
// generateProductCard ниже, формат входа/выхода тот же.
// Если ключа нет — отдаём mock-карточку, чтобы UI работал без настройки.
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_CARD_CONTRACT = {
  title: "краткое точное название товара",
  category: "ровно одна из переданных категорий (по имени), иначе пустая строка",
  brand: "производитель/бренд если виден, иначе пустая строка",
  sku: "артикул/код модели если виден на фото или в тексте, иначе пустая строка",
  description: "структурированное продающее описание для маркетплейса: 1 вводное предложение, затем 3-5 блоков, каждый блок = строка-заголовок вида «Заголовок:» и под ней 1-2 предложения; блоки разделены пустой строкой (\\n\\n)",
  specs: ["ключевая характеристика", "..."],
  tags: ["слово для поиска", "..."],
  compat: {
    brands: ["марка авто если запчасть подходит к конкретным, иначе пусто"],
    models: ["модель авто, иначе пусто"],
    yearFrom: "год с (4 цифры) или пусто",
    yearTo: "год по (4 цифры) или пусто"
  }
};

function parseDataUrl(image) {
  const str = String(image || "");
  const m = str.match(/^data:([^;]+);base64,(.*)$/s);
  if (m) return { mimeType: m[1], data: m[2] };
  // Уже голый base64 без префикса
  return { mimeType: "image/jpeg", data: str.replace(/^data:[^,]*,/, "") };
}

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return "";
  if (key.includes("your_") || key.includes("replace_this")) return "";
  return key;
}

function buildPrompt({ title, ocrText, categories }) {
  const cats =
    Array.isArray(categories) && categories.length
      ? categories.join(", ")
      : "Шины, Масла, АКБ, Запчасти, Аксессуары";
  return [
    "Ты — ассистент маркетплейса автозапчастей DriveX (Таджикистан, язык — русский).",
    "По фото товара и подсказкам составь карточку товара для продавца.",
    "Верни ТОЛЬКО валидный JSON без markdown, строго по этому контракту:",
    JSON.stringify(PRODUCT_CARD_CONTRACT),
    `Поле category выбери СТРОГО из списка: ${cats}. Если ничего не подходит — оставь пустым.`,
    "Не выдумывай артикулы и бренды: если их не видно на фото/в тексте — оставь пустыми.",
    "description: пиши структурно как в маркетплейсе — вводное предложение, затем 3-5 блоков, каждый с заголовком-строкой «Заголовок:» (например «Защита от непогоды:», «Долговечность:», «Удобство:») и 1-2 предложениями под ним; блоки разделяй пустой строкой. Продающе, но честно.",
    "specs — короткие технические пункты; tags — поисковые слова покупателя.",
    "compat: если деталь подходит к конкретным авто и это можно обоснованно определить по типу детали, бренду, артикулу или тексту — заполни марки (и по возможности модели и диапазон годов). Не выдумывай несуществующую совместимость. Если товар действительно универсальный (масло, дворники, аксессуары, расходники) — оставь compat пустым.",
    title ? `Продавец указал название: «${title}».` : "Название продавец не указал.",
    ocrText
      ? `Текст, распознанный на фото (OCR, может быть с ошибками): «${ocrText}».`
      : "OCR-текста нет — ориентируйся на изображение."
  ].join("\n");
}

async function generateProductCardGemini(context) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (typeof fetch !== "function") throw new Error("Global fetch is unavailable. Use Node.js 18+.");

  const { mimeType, data } = parseDataUrl(context.image);
  if (!data) throw new Error("No image data");

  const model =
    process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS) || 30000);
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(context) },
              { inlineData: { mimeType, data } }
            ]
          }
        ],
        generationConfig: { temperature: 0.2, topP: 0.9, responseMimeType: "application/json" }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error?.message || `Gemini vision failed with ${response.status}`);
    }

    const text = (payload.candidates || [])
      .flatMap((c) => (c.content?.parts || []).map((p) => p.text || ""))
      .join("\n")
      .trim();

    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

// ── Mock / fallback ──────────────────────────────────────────────────────────
function guessCategory(text, categories) {
  const t = String(text || "").toLowerCase();
  const rules = [
    { name: "Шины", re: /шина|покрышк|tire|tyre|r1[3-9]|r2[0-2]|летн|зимн|michelin|nokian/ },
    { name: "Масла", re: /масл|oil|[05]w-?\d|10w|синтет|sae|mobil|castrol|shell/ },
    { name: "АКБ", re: /аккумул|акб|battery|\d{2,3}\s?ah|ампер|\bач\b|mutlu|varta|bosch s/ },
    { name: "Аксессуары", re: /коврик|чехол|держател|ароматизатор|accessor|щётк|щетк/ },
    { name: "Запчасти", re: /фильтр|колодк|свеч|ремень|насос|стартер|амортизатор|part|диск/ }
  ];
  for (const r of rules) if (r.re.test(t) && categories.includes(r.name)) return r.name;
  return "";
}

const CAR_BRANDS = [
  "Toyota", "Lexus", "BMW", "Mercedes", "Audi", "Volkswagen", "VW", "Honda", "Nissan",
  "Hyundai", "Kia", "Mazda", "Ford", "Chevrolet", "Opel", "Renault", "Mitsubishi",
  "Subaru", "Lada", "ВАЗ", "Skoda", "Peugeot", "Daewoo", "Suzuki"
];

function guessCarBrands(text) {
  const t = String(text || "");
  const found = CAR_BRANDS.filter((b) => new RegExp(`\\b${b}\\b`, "i").test(t));
  // VW → Volkswagen, убираем дубликаты
  return Array.from(new Set(found.map((b) => (b === "VW" ? "Volkswagen" : b)))).slice(0, 4);
}

function mockProductCard({ title, ocrText, categories = [] }) {
  const blob = [title, ocrText].filter(Boolean).join(" ").trim();
  const firstLine = String(ocrText || title || "").split(/[\n.;]/)[0].trim().slice(0, 60);
  // Код модели: должен содержать и букву, и цифру (чтобы не путать с диапазоном годов "2010-2018")
  const skuMatch = String(ocrText || "").match(/\b(?=[A-Z0-9/-]*[A-Z])(?=[A-Z0-9/-]*\d)[A-Z0-9]{2,}[-/][A-Z0-9-]{2,}\b/);
  const carBrands = guessCarBrands(blob);
  return {
    title: title || firstLine || "Новый товар",
    category: guessCategory(blob, categories),
    brand: "",
    sku: skuMatch ? skuMatch[0] : "",
    description: blob
      ? `Товар по фото: ${firstLine || title}. Проверьте и дополните описание перед сохранением.`
      : "",
    specs: [],
    tags: blob
      ? Array.from(new Set(blob.toLowerCase().split(/\s+/).filter((w) => w.length > 3))).slice(0, 6)
      : [],
    compat: { brands: carBrands, models: [], yearFrom: "", yearTo: "" }
  };
}

function normalizeCard(card = {}, categories = []) {
  const rawCat = String(card.category || "").trim();
  const validCat = rawCat
    ? categories.find((name) => String(name).toLowerCase() === rawCat.toLowerCase()) || ""
    : "";
  const arr = (v) =>
    Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean).slice(0, 12) : [];
  const year = (v) => String(v || "").replace(/[^\d]/g, "").slice(0, 4);
  const compatIn = card.compat && typeof card.compat === "object" ? card.compat : {};
  return {
    title: String(card.title || "").trim(),
    category: validCat,
    brand: String(card.brand || "").trim(),
    sku: String(card.sku || "").trim(),
    description: String(card.description || "").trim(),
    specs: arr(card.specs),
    tags: arr(card.tags),
    compat: {
      brands: arr(compatIn.brands),
      models: arr(compatIn.models),
      yearFrom: year(compatIn.yearFrom),
      yearTo: year(compatIn.yearTo)
    }
  };
}

async function generateProductCard(context = {}) {
  const categories = Array.isArray(context.categories) ? context.categories : [];

  if (getGeminiKey()) {
    try {
      const card = normalizeCard(await generateProductCardGemini(context), categories);
      return card;
    } catch (err) {
      const card = normalizeCard(mockProductCard(context), categories);
      card._fallback = true;
      card._error = err && err.message ? err.message : String(err);
      return card;
    }
  }

  const card = normalizeCard(mockProductCard(context), categories);
  card._mock = true;
  return card;
}

module.exports = { generateProductCard };
