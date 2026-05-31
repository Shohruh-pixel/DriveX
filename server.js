"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { handleAiRoute } = require("./src/ai/ai.router");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const placesFilePath = path.join(dataDir, "places.json");
const serviceCentersFilePath = path.join(dataDir, "service-centers.json");
const appStateFilePath = path.join(dataDir, "app-state.json");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(rootDir, ".env"));

const port = Number(process.env.PORT) || 8080;
const MAX_PLACE_BODY_BYTES = 6_000_000;
const MAX_PHOTO_DATA_URL_CHARS = 900_000;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(rootDir, `.${clean}`);
  const relative = path.relative(rootDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache"
  });
  res.end(JSON.stringify(payload));
}

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readPlaces() {
  try {
    if (!fs.existsSync(placesFilePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(placesFilePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePlaces(places) {
  ensureDataDir();
  fs.writeFileSync(placesFilePath, JSON.stringify(places, null, 2), "utf8");
}

function readServiceCenters() {
  try {
    if (!fs.existsSync(serviceCentersFilePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(serviceCentersFilePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeServiceCenters(centers) {
  ensureDataDir();
  fs.writeFileSync(serviceCentersFilePath, JSON.stringify(centers, null, 2), "utf8");
}

function readAppState() {
  try {
    if (!fs.existsSync(appStateFilePath)) return {};
    const parsed = JSON.parse(fs.readFileSync(appStateFilePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeAppState(state) {
  ensureDataDir();
  fs.writeFileSync(appStateFilePath, JSON.stringify(state, null, 2), "utf8");
}

const mergeByIdAppStateKeys = new Set([
  "drivex.service.clients.v1",
  "drivex.service.orders.v1",
  "drivex.service.inventory.v1",
  "drivex.service.finance.v1",
  "drivex.service.appointments.v1",
  "drivex.service.requests.v1",
  "drivex.buyer.orders.v1",
  "drivex.seller.orders.v1",
  "drivex.seller.notifications.v1"
]);

function mergeArrayById(existingValue, nextValue) {
  const existing = Array.isArray(existingValue) ? existingValue : [];
  const incoming = Array.isArray(nextValue) ? nextValue : [];
  if (!incoming.length && existing.length) return existing;

  const merged = new Map();
  for (const item of existing) {
    if (!item || typeof item !== "object") continue;
    const id = cleanString(item.id || item.sourceOrderId || "", 160);
    if (!id) continue;
    merged.set(id, item);
  }

  for (const item of incoming) {
    if (!item || typeof item !== "object") continue;
    const id = cleanString(item.id || item.sourceOrderId || "", 160);
    if (!id) continue;
    merged.set(id, { ...(merged.get(id) || {}), ...item });
  }

  return Array.from(merged.values());
}

function mergeAppStateValue(key, existingEntry, nextValue) {
  if (key === "drivex.maintenance.v1" && nextValue && typeof nextValue === "object") {
    return mergeMaintenanceState(existingEntry && existingEntry.value, nextValue);
  }

  if (mergeByIdAppStateKeys.has(key) && Array.isArray(nextValue)) {
    return mergeArrayById(existingEntry && existingEntry.value, nextValue);
  }

  return nextValue;
}

function mergeMaintenanceRecords(existingRecords, nextRecords) {
  return mergeArrayById(existingRecords, nextRecords);
}

function mergeMaintenanceState(existingValue, nextValue) {
  const existing = existingValue && typeof existingValue === "object" ? existingValue : {};
  const incoming = nextValue && typeof nextValue === "object" ? nextValue : {};
  const existingCars = existing.cars && typeof existing.cars === "object" ? existing.cars : {};
  const incomingCars = incoming.cars && typeof incoming.cars === "object" ? incoming.cars : {};
  const cars = { ...existingCars };

  for (const [carId, incomingCarState] of Object.entries(incomingCars)) {
    const safeCarId = cleanString(carId, 160);
    if (!safeCarId || !incomingCarState || typeof incomingCarState !== "object") continue;
    const existingCarState = cars[safeCarId] && typeof cars[safeCarId] === "object" ? cars[safeCarId] : {};
    cars[safeCarId] = {
      ...existingCarState,
      ...incomingCarState,
      records: mergeMaintenanceRecords(existingCarState.records, incomingCarState.records),
      inspection: {
        ...(existingCarState.inspection && typeof existingCarState.inspection === "object" ? existingCarState.inspection : {}),
        ...(incomingCarState.inspection && typeof incomingCarState.inspection === "object" ? incomingCarState.inspection : {})
      }
    };
  }

  return {
    ...existing,
    ...incoming,
    cars
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_PLACE_BODY_BYTES) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

function cleanString(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanStringArray(value, maxItems = 24, maxLength = 160) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function cleanPhotoArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string" && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(item))
    .filter((item) => item.length <= MAX_PHOTO_DATA_URL_CHARS)
    .slice(0, 3);
}

function cleanImage(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(raw) && raw.length <= MAX_PHOTO_DATA_URL_CHARS) return raw;
  return "";
}

function slugifyServerText(value, fallback = "service") {
  const raw = cleanString(value, 140)
    .toLowerCase()
    .replace(/ё/g, "e")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return raw || fallback;
}

function normalizePlace(input) {
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const error = new Error("Координаты места обязательны.");
    error.statusCode = 400;
    throw error;
  }

  const name = cleanString(input.name, 120);
  const contact = cleanString(input.contact, 120);
  const address = cleanString(input.address, 240);
  const workingHours = cleanString(input.workingHours, 120);

  if (!name || !contact || !address || !workingHours) {
    const error = new Error("Название, адрес, контакт и режим работы обязательны.");
    error.statusCode = 400;
    throw error;
  }

  const category = cleanString(input.category || input.type || "other", 40);
  const createdAt = input.createdAt && !Number.isNaN(Date.parse(input.createdAt))
    ? new Date(input.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: cleanString(input.id, 80) || `place-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: category,
    name,
    category,
    lat,
    lng,
    address,
    contact,
    workingHours,
    description: cleanString(input.description, 1200),
    services: cleanStringArray(input.services),
    prices: cleanString(input.prices, 240),
    photos: cleanPhotoArray(input.photos),
    isOwner: Boolean(input.isOwner),
    owner: input.isOwner
      ? {
          companyName: cleanString(input.owner?.companyName, 160),
          logo: cleanPhotoArray([input.owner?.logo])[0] || "",
          description: cleanString(input.owner?.description, 1600),
          services: cleanStringArray(input.owner?.services),
          socialLinks: cleanStringArray(input.owner?.socialLinks, 12, 220)
        }
      : null,
    features: {
      is247: Boolean(input.features?.is247),
      cardPayment: Boolean(input.features?.cardPayment),
      mobileService: Boolean(input.features?.mobileService)
    },
    status: "published",
    verified: true,
    createdAt,
    updatedAt: new Date().toISOString(),
    source: "user"
  };
}

async function handlePlacesRoute(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { places: readPlaces() });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const place = normalizePlace(body);
    const places = readPlaces();
    const withoutDuplicate = places.filter((item) => item.id !== place.id);
    withoutDuplicate.unshift(place);
    writePlaces(withoutDuplicate.slice(0, 500));
    sendJson(res, 201, { place });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Place save failed" });
  }
}

function normalizeServiceCenter(input) {
  const source = input?.center && typeof input.center === "object" ? input.center : input || {};
  const name = cleanString(source.name, 140);
  const serviceType = cleanString(source.serviceType || source.type || source.category, 80);
  const city = cleanString(source.city || "Худжанд", 80);
  const address = cleanString(source.address, 240);

  if (!name || !serviceType || !address) {
    const error = new Error("Название, тип и адрес сервиса обязательны.");
    error.statusCode = 400;
    throw error;
  }

  const id = cleanString(source.id, 120) || `service-${slugifyServerText(`${name}-${city}`, Date.now())}`;
  const createdAt = source.createdAt && !Number.isNaN(Date.parse(source.createdAt))
    ? new Date(source.createdAt).toISOString()
    : new Date().toISOString();

  return {
    id: slugifyServerText(id, `service-${Date.now()}`),
    name,
    serviceType,
    city,
    address,
    locationLabel: cleanString(source.locationLabel || source.location_label, 180),
    geolocation: cleanString(source.geolocation, 80),
    phone: cleanString(source.phone, 80),
    email: cleanString(source.email, 120),
    boxesCount: Math.max(1, Math.floor(Number(source.boxesCount ?? source.boxes_count) || 1)),
    workingHours: cleanString(source.workingHours || source.working_hours || "08:00 — 19:00", 120),
    description: cleanString(source.description, 1600),
    logo: cleanImage(source.logo),
    coverImage: cleanImage(source.coverImage || source.heroImage || source.image),
    gallery: cleanPhotoArray(source.gallery || source.photos || source.workPhotos),
    videoUrl: cleanString(source.videoUrl || source.video_url || source.video, 300),
    registrationCompleted: true,
    status: cleanString(source.status || "active", 40),
    verified: true,
    source: "service-crm",
    createdAt,
    updatedAt: new Date().toISOString()
  };
}

async function handleServiceCentersRoute(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { centers: readServiceCenters() });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const center = normalizeServiceCenter(body);
    const centers = readServiceCenters();
    const withoutDuplicate = centers.filter((item) => item.id !== center.id);
    withoutDuplicate.unshift(center);
    writeServiceCenters(withoutDuplicate.slice(0, 300));
    sendJson(res, 201, { center });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "Service center save failed" });
  }
}

async function handleAppStateRoute(req, res) {
  if (req.method === "GET") {
    sendJson(res, 200, { state: readAppState() });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const current = readAppState();
    const patch = {};

    if (body && typeof body.values === "object" && body.values && !Array.isArray(body.values)) {
      Object.assign(patch, body.values);
    } else if (body && typeof body.key === "string") {
      patch[body.key] = body.value ?? null;
    }

    for (const [key, value] of Object.entries(patch)) {
      const safeKey = cleanString(key, 160);
      if (!safeKey) continue;
      if (value === null) {
        delete current[safeKey];
      } else {
        current[safeKey] = {
          value: mergeAppStateValue(safeKey, current[safeKey], value),
          updatedAt: new Date().toISOString()
        };
      }
    }

    writeAppState(current);
    sendJson(res, 200, { state: current });
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || "App state save failed" });
  }
}

function serveStatic(req, res) {
  const filePath = safeStaticPath(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    const target = !statError && stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    fs.readFile(target, (readError, data) => {
      if (readError) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      });
      res.end(data);
    });
  });
}

// ─────────────────────────────────────────────────────
// Telegram Bot OTP  (Phone → Telegram → OTP → Login)
// Настройка:
//   TELEGRAM_BOT_TOKEN=<токен от @BotFather>
//   OTP_SECRET=<любая случайная строка>
// Webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yoursite.com/api/otp/telegram-webhook
// ─────────────────────────────────────────────────────

// otpStore: Map<phone, { code, expiresAt, used, telegramUserId? }>
const otpStore = new Map();
// phoneToTelegram: Map<phone, telegramUserId> — после того как пользователь написал боту
const phoneToTelegram = new Map();

// Telegram токен: только из .env (TELEGRAM_BOT_TOKEN=...)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_NAME = process.env.TELEGRAM_BOT_NAME || "DriiiveX_Bot";
const OTP_SECRET = process.env.OTP_SECRET || "drivex-otp-secret";
const OTP_DEV_MODE = !TELEGRAM_BOT_TOKEN; // в dev-режиме возвращаем код напрямую

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpKey(phone) {
  return phone.replace(/\D/g, "");
}

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) return false;
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
    const options = {
      hostname: "api.telegram.org",
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.write(body);
    req.end();
  });
}

async function handleOtpSend(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Method not allowed" }); return; }
  let body;
  try { body = await readJsonBody(req); } catch { sendJson(res, 400, { error: "Invalid JSON" }); return; }

  const phone = cleanString(body.phone || "", 20).replace(/\s/g, "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) { sendJson(res, 400, { error: "Неверный номер телефона" }); return; }

  const code = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const key = otpKey(phone);
  otpStore.set(key, { code, expiresAt, used: false });

  const telegramUserId = phoneToTelegram.get(key);
  let sent = false;
  if (telegramUserId) {
    sent = await sendTelegramMessage(
      telegramUserId,
      `🔐 <b>DRIVEX</b>\n\nВаш код входа: <code>${code}</code>\n\nДействует 10 минут. Никому не передавайте.`
    );
  }

  if (OTP_DEV_MODE) {
    // В dev-режиме код виден в ответе и в консоли сервера
    console.info(`[OTP] dev-mode phone=${phone} code=${code}`);
    sendJson(res, 200, { ok: true, testCode: code, dev: true, message: "DEV: код в ответе (для разработки)" });
    return;
  }

  if (!sent) {
    sendJson(res, 200, {
      ok: true,
      needTelegram: true,
      botName: TELEGRAM_BOT_NAME,
      message: `Напишите боту @${TELEGRAM_BOT_NAME} свой номер: ${phone} — он пришлёт код.`
    });
    return;
  }

  sendJson(res, 200, { ok: true, message: "Код отправлен в Telegram" });
}

async function handleOtpVerify(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Method not allowed" }); return; }
  let body;
  try { body = await readJsonBody(req); } catch { sendJson(res, 400, { error: "Invalid JSON" }); return; }

  const phone = cleanString(body.phone || "", 20);
  const code = cleanString(body.code || "", 10);
  const key = otpKey(phone);
  const record = otpStore.get(key);

  if (!record) { sendJson(res, 400, { error: "Код не найден или истёк. Запросите новый." }); return; }
  if (record.used) { sendJson(res, 400, { error: "Код уже использован" }); return; }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    sendJson(res, 400, { error: "Код истёк. Запросите новый." });
    return;
  }
  if (record.code !== code) { sendJson(res, 400, { error: "Неверный код" }); return; }

  record.used = true;
  otpStore.set(key, record);

  // Опционально: если настроен Supabase service-role — создаём/возвращаем пользователя
  const supabaseSession = await createOrSignInSupabaseUser(phone).catch(() => null);
  sendJson(res, 200, {
    ok: true,
    phone,
    ...(supabaseSession || {})
  });
}

async function createOrSignInSupabaseUser(phone) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabaseUrl = process.env.SUPABASE_URL || "";
  if (!serviceRoleKey || !supabaseUrl) return null;

  // Используем Supabase Admin API для создания/получения пользователя
  const adminRes = await new Promise((resolve) => {
    const body = JSON.stringify({ phone, phone_confirm: true });
    const url = new URL(`${supabaseUrl}/auth/v1/admin/users`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      }
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });

  if (!adminRes) return null;
  // Возвращаем userId (session токены выдаются через отдельный sign-in)
  return { userId: adminRes.data?.id || adminRes.data?.user?.id };
}

// Обработка сообщений от Telegram бота
// Когда пользователь пишет боту свой номер — бот запоминает его telegram_id
async function handleTelegramWebhook(req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
  let body;
  try { body = await readJsonBody(req); } catch { res.writeHead(400); res.end(); return; }

  const message = body.message;
  if (!message) { sendJson(res, 200, { ok: true }); return; }

  const chatId = message.chat?.id;
  const text = (message.text || "").trim();
  const digits = text.replace(/\D/g, "");

  // Пользователь прислал номер телефона
  if (digits.length >= 9) {
    const key = otpKey(text);
    phoneToTelegram.set(key, chatId);

    const record = otpStore.get(key);
    if (record && !record.used && Date.now() <= record.expiresAt) {
      await sendTelegramMessage(
        chatId,
        `🔐 <b>DRIVEX</b>\n\nВаш код входа: <code>${record.code}</code>\n\nДействует до истечения 10 минут.`
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "✅ Номер привязан!\n\nКогда запросите код в приложении — пришлю его сюда."
      );
    }
  } else if (text === "/start" || text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      "👋 Привет!\n\nЯ бот <b>DRIVEX</b>.\n\nОтправьте мне свой номер телефона в формате <code>+992XXXXXXXXX</code>, чтобы привязать его и получать коды входа."
    );
  }

  sendJson(res, 200, { ok: true });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/ai/assistant") {
    await handleAiRoute(req, res);
    return;
  }

  if (url.pathname === "/api/places") {
    await handlePlacesRoute(req, res);
    return;
  }

  if (url.pathname === "/api/service-centers") {
    await handleServiceCentersRoute(req, res);
    return;
  }

  if (url.pathname === "/api/app-state") {
    await handleAppStateRoute(req, res);
    return;
  }

  if (url.pathname === "/api/otp/send") {
    await handleOtpSend(req, res);
    return;
  }

  if (url.pathname === "/api/otp/verify") {
    await handleOtpVerify(req, res);
    return;
  }

  if (url.pathname === "/api/otp/telegram-webhook") {
    await handleTelegramWebhook(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.info(`DriveX server running on http://localhost:${port}`);
  console.info(`AI_MODE=${process.env.AI_MODE || "mock"}`);
  console.info(`OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? "configured" : "missing"}`);
  console.info(`GEMINI_API_KEY=${process.env.GEMINI_API_KEY ? "configured" : "missing"}`);
  console.info(`AI_PROVIDER=${process.env.AI_PROVIDER || "auto"}`);
});
