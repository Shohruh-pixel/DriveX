"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// VIN-декодер для подбора запчастей: VIN → { brand, model, year }.
// Основной движок — Gemini (если есть ключ). Без ключа / при ошибке —
// базовая офлайн-расшифровка (год по 10-му символу, бренд по WMI).
// ─────────────────────────────────────────────────────────────────────────────

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return "";
  if (key.includes("your_") || key.includes("replace_this")) return "";
  return key;
}

function cleanVin(vin) {
  return String(vin || "")
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, "") // VIN не содержит I, O, Q
    .slice(0, 17);
}

// Год по 10-му символу VIN. Цикл из 30 кодов повторяется каждые 30 лет.
const VIN_YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";
function decodeYearFromVin(vin) {
  if (vin.length < 10) return "";
  const idx = VIN_YEAR_CODES.indexOf(vin[9]);
  if (idx < 0) return "";
  const currentYear = new Date().getFullYear();
  let year = 2010 + idx;
  if (year > currentYear + 1) year = 1980 + idx; // предыдущий цикл
  return String(year);
}

// Бренд по WMI (первые 1-3 символа). Частичная таблица для популярных в ТJ марок.
const WMI_BRANDS = {
  JT: "Toyota", "2T": "Toyota", "4T": "Toyota", "5T": "Toyota", JTD: "Toyota",
  JH: "Honda", "1H": "Honda", "2H": "Honda", "5J": "Honda",
  JN: "Nissan", "1N": "Nissan", "3N": "Nissan", "5N": "Nissan",
  JM: "Mazda", "4F": "Mazda",
  JF: "Subaru", "4S": "Subaru",
  JS: "Suzuki",
  JA: "Mitsubishi", JMB: "Mitsubishi", "4A": "Mitsubishi", "6M": "Mitsubishi",
  WBA: "BMW", WBS: "BMW", WBY: "BMW", "4US": "BMW", "5UX": "BMW",
  WDB: "Mercedes", WDD: "Mercedes", WDC: "Mercedes", WDF: "Mercedes", "4JG": "Mercedes",
  WAU: "Audi", WA1: "Audi", TRU: "Audi",
  WVW: "Volkswagen", WVG: "Volkswagen", "1VW": "Volkswagen", "3VW": "Volkswagen",
  KMH: "Hyundai", KMF: "Hyundai", KMJ: "Hyundai", "5NP": "Hyundai",
  KNA: "Kia", KND: "Kia", KNE: "Kia", "3KP": "Kia",
  W0L: "Opel", W0V: "Opel",
  XW8: "Volkswagen", XTA: "Lada", XTT: "UAZ",
  KLA: "Daewoo", KL: "Daewoo",
  "1G": "Chevrolet", "KL1": "Chevrolet"
};

function decodeBrandFromVin(vin) {
  if (vin.length < 3) return "";
  return (
    WMI_BRANDS[vin.slice(0, 3)] ||
    WMI_BRANDS[vin.slice(0, 2)] ||
    WMI_BRANDS[vin.slice(0, 1)] ||
    ""
  );
}

function decodeVinOffline(vin) {
  return {
    vin,
    brand: decodeBrandFromVin(vin),
    model: "",
    year: decodeYearFromVin(vin)
  };
}

async function decodeVinGemini(vin) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (typeof fetch !== "function") throw new Error("Global fetch is unavailable. Use Node.js 18+.");

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS) || 20000);

  try {
    const prompt = [
      "Decode this vehicle VIN. Return ONLY valid JSON, no markdown:",
      JSON.stringify({ brand: "", model: "", year: "", country: "" }),
      "Use the manufacturer (WMI), model year code and descriptor section.",
      "brand = make in latin (e.g. Toyota, BMW). model = model name if derivable, else empty.",
      "year = 4-digit model year. If a field is unknown, use empty string. Do not invent.",
      `VIN: ${vin}`
    ].join("\n");

    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error?.message || `Gemini VIN failed with ${response.status}`);
    }
    const text = (payload.candidates || [])
      .flatMap((c) => (c.content?.parts || []).map((p) => p.text || ""))
      .join("\n")
      .trim();
    const parsed = JSON.parse(text);
    return {
      vin,
      brand: String(parsed.brand || "").trim(),
      model: String(parsed.model || "").trim(),
      year: String(parsed.year || "").replace(/[^\d]/g, "").slice(0, 4)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function decodeVin(rawVin) {
  const vin = cleanVin(rawVin);
  if (vin.length < 11) {
    return { vin, brand: "", model: "", year: "", valid: false, _error: "VIN слишком короткий" };
  }

  if (getGeminiKey()) {
    try {
      const g = await decodeVinGemini(vin);
      // Подстрахуемся офлайн-расшифровкой по полям, которые Gemini не дал
      const off = decodeVinOffline(vin);
      return {
        vin,
        brand: g.brand || off.brand,
        model: g.model,
        year: g.year || off.year,
        valid: Boolean(g.brand || g.year || off.brand || off.year),
        source: "gemini"
      };
    } catch (err) {
      const off = decodeVinOffline(vin);
      return { ...off, valid: Boolean(off.brand || off.year), _fallback: true, _error: err && err.message };
    }
  }

  const off = decodeVinOffline(vin);
  return { ...off, valid: Boolean(off.brand || off.year), _mock: true };
}

module.exports = { decodeVin };
