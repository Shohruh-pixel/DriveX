"use strict";

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { handleAiRoute, handleAiHistoryRoute, handleProductCardRoute, handleVinRoute } = require("./src/ai/ai.router");

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
  // Атомарная запись: пишем во временный файл и переименовываем. rename атомарен
  // в пределах одной ФС, поэтому читатели никогда не видят пустой/частичный файл
  // (раньше параллельные POST'ы оставляли app-state.json обрезанным до 0 байт).
  const tmpPath = appStateFilePath + "." + process.pid + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmpPath, appStateFilePath);
}

// Последовательная очередь записи: handleAppStateRoute читает состояние после
// `await readJsonBody`, поэтому два параллельных POST'а могли прочитать одно и то
// же состояние и затереть изменения друг друга (lost update). Сериализуем секцию
// read-modify-write через цепочку промисов.
let appStateWriteChain = Promise.resolve();
function runExclusiveAppStateWrite(task) {
  const run = appStateWriteChain.then(task, task);
  // Не даём ошибке одной задачи порвать всю цепочку.
  appStateWriteChain = run.then(() => {}, () => {});
  return run;
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

// Идентичность продавца принадлежит seller-бэкенду (локальная БД / Supabase), а не
// общему app-state.json. Сервер игнорирует попытки записать эти ключи, чтобы
// устаревшие/непавильно залогиненные клиенты не загрязняли общее состояние
// (видимость товаров для покупателей идёт через drivex.market.catalog.v1).
const rejectedAppStateKeys = new Set([
  "drivex.seller.session.v1",
  "drivex.seller.profile.v1",
  "drivex.seller.store.v1",
  "drivex.seller.products.v1"
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

function mergeOrderChats(existingValue, nextValue) {
  const existing = existingValue && typeof existingValue === "object" && !Array.isArray(existingValue) ? existingValue : {};
  const incoming = nextValue && typeof nextValue === "object" && !Array.isArray(nextValue) ? nextValue : {};
  const merged = { ...existing };
  for (const [orderId, thread] of Object.entries(incoming)) {
    if (!thread) continue;
    const existingThread = merged[orderId];
    if (!existingThread) { merged[orderId] = thread; continue; }
    const existingMsgs = Array.isArray(existingThread.messages) ? existingThread.messages : [];
    const incomingMsgs = Array.isArray(thread.messages) ? thread.messages : [];
    const msgsById = new Map();
    for (const m of existingMsgs) { if (m && m.id) msgsById.set(m.id, m); }
    for (const m of incomingMsgs) { if (m && m.id) msgsById.set(m.id, m); }
    const messages = Array.from(msgsById.values()).sort((a, b) =>
      (a.sentAt || "") < (b.sentAt || "") ? -1 : 1
    );
    merged[orderId] = { ...existingThread, ...thread, messages };
  }
  return merged;
}

function mergeAppStateValue(key, existingEntry, nextValue) {
  if (key === "drivex.maintenance.v1" && nextValue && typeof nextValue === "object") {
    return mergeMaintenanceState(existingEntry && existingEntry.value, nextValue);
  }

  if (key === "drivex.order-chats.v1" && nextValue && typeof nextValue === "object" && !Array.isArray(nextValue)) {
    return mergeOrderChats(existingEntry && existingEntry.value, nextValue);
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

// ── Отзывы о товарах маркета ──────────────────────────────────────────────

const marketReviewsFilePath = path.join(dataDir, "market-reviews.json");

function readMarketReviews() {
  try {
    if (!fs.existsSync(marketReviewsFilePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(marketReviewsFilePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeMarketReviews(reviews) {
  ensureDataDir();
  fs.writeFileSync(marketReviewsFilePath, JSON.stringify(reviews, null, 2), "utf8");
}

function buildMarketReviewsSummary() {
  const summary = {};
  for (const review of readMarketReviews()) {
    if (!review || !review.productId) continue;
    const key = String(review.productId);
    const entry = summary[key] || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Math.max(1, Math.min(5, Number(review.rating) || 0));
    summary[key] = entry;
  }
  const result = {};
  for (const [key, entry] of Object.entries(summary)) {
    result[key] = { count: entry.count, rating: Math.round((entry.total / entry.count) * 10) / 10 };
  }
  return result;
}

function normalizeMarketReview(raw) {
  if (!raw || typeof raw !== "object") return null;
  const productId = cleanString(raw.productId || raw.product_id, 160);
  const rating = Math.floor(Number(raw.rating));
  if (!productId || !Number.isFinite(rating) || rating < 1 || rating > 5) return null;
  return {
    id: cleanString(raw.id, 80) || `review-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId,
    authorName: cleanString(raw.authorName || raw.author_name, 80) || "Покупатель DRIVEX",
    rating,
    comment: cleanString(raw.comment, 1200),
    verified: Boolean(raw.verified),
    createdAt: raw.createdAt && !Number.isNaN(Date.parse(raw.createdAt))
      ? new Date(raw.createdAt).toISOString()
      : new Date().toISOString()
  };
}

async function handleMarketReviewsRoute(req, res, url) {
  if (req.method === "GET") {
    if (url.searchParams.get("summary")) {
      sendJson(res, 200, { summary: buildMarketReviewsSummary() });
      return;
    }
    const productId = cleanString(url.searchParams.get("productId"), 160);
    const all = readMarketReviews();
    const reviews = productId ? all.filter((item) => item.productId === productId) : all;
    sendJson(res, 200, { reviews: reviews.slice(0, 100) });
    return;
  }
  if (req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const review = normalizeMarketReview(body.review || body);
      if (!review) { sendJson(res, 400, { error: "Нужны productId и оценка от 1 до 5" }); return; }
      const all = readMarketReviews();
      all.unshift(review);
      writeMarketReviews(all.slice(0, 5000));
      sendJson(res, 201, { review });
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || "Review save failed" });
    }
    return;
  }
  sendJson(res, 405, { error: "Method not allowed" });
}

// ── Реферальная программа «Пригласи друга» ────────────────────────────────────
const referralsFilePath = path.join(dataDir, "referrals.json");
const REFERRAL_REWARD = 1.5;

function readReferrals() {
  try {
    if (!fs.existsSync(referralsFilePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(referralsFilePath, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeReferrals(list) {
  ensureDataDir();
  fs.writeFileSync(referralsFilePath, JSON.stringify(list, null, 2), "utf8");
}

function normalizeReferralCodeServer(value) {
  const raw = cleanString(value, 40).toUpperCase();
  if (!raw) return "";
  return raw.startsWith("DRIVEX-") ? raw : "DRIVEX-" + raw.replace(/[^A-Z0-9]/g, "");
}

function codeFromInviteeId(inviteeId) {
  const cleaned = String(inviteeId || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return "DRIVEX-" + (cleaned || "2026");
}

function computeReferralStatsServer(all, code) {
  const mine = all.filter((r) => r.referrerCode === code);
  const rewarded = mine.filter((r) => r.status === "rewarded");
  return {
    code,
    invited: mine.length,
    rewardedCount: rewarded.length,
    earned: Math.round(rewarded.reduce((s, r) => s + (Number(r.reward) || REFERRAL_REWARD), 0) * 100) / 100,
    list: mine
  };
}

async function handleReferralsRoute(req, res, url) {
  if (req.method === "GET") {
    const code = normalizeReferralCodeServer(url.searchParams.get("code"));
    const all = readReferrals();
    sendJson(res, 200, { stats: computeReferralStatsServer(all, code) });
    return;
  }
  if (req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const action = cleanString(body.action, 20) || "register";
      const all = readReferrals();

      if (action === "register") {
        const referrerCode = normalizeReferralCodeServer(body.referrerCode);
        const inviteeId = cleanString(body.inviteeId, 120);
        if (!referrerCode || !inviteeId) { sendJson(res, 400, { error: "referrerCode и inviteeId обязательны" }); return; }
        // нельзя пригласить самого себя
        if (codeFromInviteeId(inviteeId) === referrerCode) { sendJson(res, 200, { ok: false, reason: "self" }); return; }
        // один приглашённый — одна запись (первый код побеждает)
        const existing = all.find((r) => r.inviteeId === inviteeId);
        if (existing) { sendJson(res, 200, { ok: true, referral: existing, existed: true }); return; }
        const record = {
          id: "ref-" + inviteeId,
          referrerCode,
          inviteeId,
          inviteeName: cleanString(body.inviteeName, 40),
          status: "registered",
          reward: 0,
          createdAt: new Date().toISOString(),
          rewardedAt: null
        };
        all.push(record);
        writeReferrals(all.slice(-20000));
        sendJson(res, 201, { ok: true, referral: record });
        return;
      }

      if (action === "reward") {
        const inviteeId = cleanString(body.inviteeId, 120);
        if (!inviteeId) { sendJson(res, 400, { error: "inviteeId обязателен" }); return; }
        const record = all.find((r) => r.inviteeId === inviteeId);
        if (!record) { sendJson(res, 200, { ok: false, reason: "not_referred" }); return; }
        if (record.status !== "rewarded") {
          record.status = "rewarded";
          record.reward = REFERRAL_REWARD;
          record.rewardedAt = new Date().toISOString();
          writeReferrals(all);
        }
        sendJson(res, 200, { ok: true, referral: record });
        return;
      }

      sendJson(res, 400, { error: "Неизвестное действие" });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Referral save failed" });
    }
    return;
  }
  sendJson(res, 405, { error: "Method not allowed" });
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

    // Зеркалим центр в Supabase service_centers (прод-хранилище каталога):
    // локальный реестр отвечает за этот инстанс, облако делает сервис видимым
    // всем клиентам через supabase-data.loadServiceCenters. Best-effort.
    // id в Supabase — uuid: строим детерминированный uuid из слага, чтобы
    // повторная регистрация обновляла ту же строку.
    const centerUuid = (() => {
      const hash = crypto.createHash("sha1").update(`drivex-service:${center.id}`).digest("hex");
      return [
        hash.slice(0, 8),
        hash.slice(8, 12),
        "5" + hash.slice(13, 16),
        ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
        hash.slice(20, 32)
      ].join("-");
    })();
    supabaseAdminRequest(
      "POST",
      "/rest/v1/service_centers?on_conflict=id",
      {
        id: centerUuid,
        name: center.name,
        category: center.serviceType,
        city: center.city,
        address: center.address,
        phones: center.phone ? [center.phone] : [],
        working_hours: center.workingHours,
        boxes_count: center.boxesCount,
        description: center.description,
        logo_url: center.logo || "",
        photos: Array.isArray(center.gallery) ? center.gallery.slice(0, 6) : [],
        rating: 0,
        reviews_count: 0,
        status: "active",
        updated_at: new Date().toISOString()
      },
      { Prefer: "resolution=merge-duplicates" }
    ).then((result) => {
      if (result && result.status >= 400) {
        console.warn("[service-centers] Supabase upsert:", result.status, JSON.stringify(result.data).slice(0, 160));
      }
    }).catch(() => {});

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
    const patch = {};

    if (body && typeof body.values === "object" && body.values && !Array.isArray(body.values)) {
      Object.assign(patch, body.values);
    } else if (body && typeof body.key === "string") {
      patch[body.key] = body.value ?? null;
    }

    // read-modify-write выполняется эксклюзивно, чтобы параллельные POST'ы не
    // затирали изменения друг друга. Состояние читаем ВНУТРИ замка (после await).
    const current = await runExclusiveAppStateWrite(() => {
      const state = readAppState();
      // Чистим устаревшие seller-identity ключи, если они просочились ранее.
      for (const rejected of rejectedAppStateKeys) {
        if (Object.prototype.hasOwnProperty.call(state, rejected)) delete state[rejected];
      }
      for (const [key, value] of Object.entries(patch)) {
        const safeKey = cleanString(key, 160);
        if (!safeKey) continue;
        if (rejectedAppStateKeys.has(safeKey)) continue; // seller-бэкенд владеет этим ключом
        if (value === null) {
          delete state[safeKey];
        } else {
          state[safeKey] = {
            value: mergeAppStateValue(safeKey, state[safeKey], value),
            updatedAt: new Date().toISOString()
          };
        }
      }
      writeAppState(state);
      return state;
    });

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

// Находит email продавца по номеру телефона (service-role), чтобы можно было
// войти в Seller CRM по телефону: продавцы регистрируются по email, телефон лежит
// в user_metadata.phone. Возвращаем только email (нужен для signInWithPassword).
async function handlePartnerEmailByPhone(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Method not allowed" }); return; }
  let body;
  try { body = await readJsonBody(req); } catch { sendJson(res, 400, { error: "Invalid JSON" }); return; }

  const phoneDigits = String(body.phone || "").replace(/\D/g, "");
  if (phoneDigits.length < 9) { sendJson(res, 400, { error: "Некорректный номер" }); return; }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    sendJson(res, 200, { email: null, configured: false });
    return;
  }

  const target = phoneDigits.slice(-9); // сравниваем по последним 9 цифрам (без кода страны)
  const listRes = await supabaseAdminRequest("GET", "/auth/v1/admin/users?per_page=200").catch(() => null);
  const users = (listRes && listRes.data && (listRes.data.users || listRes.data)) || [];
  let email = null;
  for (const u of (Array.isArray(users) ? users : [])) {
    const candidates = [u.phone, u.user_metadata && u.user_metadata.phone].filter(Boolean);
    const hit = candidates.some((p) => String(p).replace(/\D/g, "").slice(-9) === target);
    if (hit) { email = u.email || null; break; }
  }
  sendJson(res, 200, { email });
}

// Сброс пароля продавца по email ИЛИ телефону (service-role). Продавец вышел из
// аккаунта — клиентский updateUser недоступен, поэтому меняем пароль через admin API.
async function handlePartnerResetPassword(req, res) {
  if (req.method !== "POST") { sendJson(res, 405, { error: "Method not allowed" }); return; }
  let body;
  try { body = await readJsonBody(req); } catch { sendJson(res, 400, { error: "Invalid JSON" }); return; }

  const identifier = cleanString(body.identifier || body.email || body.phone || "", 160).trim();
  const newPassword = String(body.newPassword || "");
  if (!identifier) { sendJson(res, 400, { error: "Укажите email или телефон" }); return; }
  if (newPassword.length < 6) { sendJson(res, 400, { error: "Пароль не короче 6 символов" }); return; }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
    sendJson(res, 200, { ok: false, configured: false });
    return;
  }

  const listRes = await supabaseAdminRequest("GET", "/auth/v1/admin/users?per_page=200").catch(() => null);
  const users = (listRes && listRes.data && (listRes.data.users || listRes.data)) || [];
  const isEmail = identifier.indexOf("@") !== -1;
  const target = identifier.replace(/\D/g, "").slice(-9);
  let userId = null;
  for (const u of (Array.isArray(users) ? users : [])) {
    if (isEmail) {
      if (String(u.email || "").toLowerCase() === identifier.toLowerCase()) { userId = u.id; break; }
    } else {
      const candidates = [u.phone, u.user_metadata && u.user_metadata.phone].filter(Boolean);
      if (target && candidates.some((p) => String(p).replace(/\D/g, "").slice(-9) === target)) { userId = u.id; break; }
    }
  }
  if (!userId) { sendJson(res, 200, { ok: false, notFound: true }); return; }

  const upd = await supabaseAdminRequest("PUT", "/auth/v1/admin/users/" + userId, {
    password: newPassword,
    email_confirm: true
  }).catch(() => null);
  const ok = Boolean(upd && upd.status >= 200 && upd.status < 300);
  sendJson(res, 200, { ok, error: ok ? undefined : "Не удалось обновить пароль" });
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

// Низкоуровневый запрос к Supabase Admin API (GoTrue) с service-role ключом.
function supabaseAdminRequest(method, pathAndQuery, bodyObj, extraHeaders) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabaseUrl = process.env.SUPABASE_URL || "";
  if (!serviceRoleKey || !supabaseUrl) return Promise.resolve(null);

  return new Promise((resolve) => {
    let url;
    try { url = new URL(`${supabaseUrl}${pathAndQuery}`); }
    catch { resolve(null); return; }
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...(extraHeaders && typeof extraHeaders === "object" ? extraHeaders : {})
      }
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(Buffer.concat(chunks).toString() || "{}") }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on("error", () => resolve(null));
    // Таймаут: не висим вечно, если Supabase/сеть не отвечают
    req.setTimeout(10000, () => { try { req.destroy(); } catch (e) {} resolve(null); });
    if (payload) req.write(payload);
    req.end();
  });
}

// Создаёт/находит Supabase-пользователя по телефону и возвращает СТАБИЛЬНЫЙ uid
// + одноразовый токен, по которому клиент установит НАСТОЯЩУЮ сессию. Без реальной
// сессии RLS блокирует запись в user_app_state, и данные не синхронизируются между
// устройствами. Требует env SUPABASE_SERVICE_ROLE_KEY и SUPABASE_URL.
async function createOrSignInSupabaseUser(phone) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabaseUrl = process.env.SUPABASE_URL || "";
  if (!serviceRoleKey || !supabaseUrl) return null;

  // Детерминированный email → один и тот же телефон всегда даёт один и тот же uid.
  const digits = String(phone).replace(/\D/g, "");
  const email = `phone_${digits}@drivex.app`;

  // 1) Идемпотентно создаём пользователя. Если уже есть — GoTrue вернёт 422,
  //    это нормально; uid возьмём из generate_link ниже.
  await supabaseAdminRequest("POST", "/auth/v1/admin/users", {
    email,
    phone,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { phone, role: "buyer" }
  });

  // 2) Генерируем magic-link → одноразовый токен. Клиент обменяет его на сессию
  //    через supabase.auth.verifyOtp({ token_hash }). Поле hashed_token/email_otp
  //    лежит либо в properties (новый GoTrue), либо в корне ответа.
  const linkRes = await supabaseAdminRequest("POST", "/auth/v1/admin/generate_link", {
    type: "magiclink",
    email
  });
  if (!linkRes || !linkRes.data) return null;

  const root = linkRes.data;
  const props = root.properties || root;
  const userId = (root.user && root.user.id) || root.id || null;
  return {
    userId,
    email,
    tokenHash: props.hashed_token || "",
    emailOtp: props.email_otp || ""
  };
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

  if (url.pathname === "/api/ai/debug") {
    const { getProvider } = require("./src/ai/ai.llm");
    sendJson(res, 200, {
      provider: getProvider(),
      hasAnthropicKey: !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your_anthropic_api_key_here"),
      keyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.slice(0, 20) + "..." : "NOT SET",
      AI_PROVIDER: process.env.AI_PROVIDER || "NOT SET",
      AI_MODE: process.env.AI_MODE || "NOT SET"
    });
    return;
  }

  if (url.pathname === "/api/ai/test-claude") {
    const { askClaudeDriveX } = require("./src/ai/ai.claude");
    try {
      const result = await askClaudeDriveX({
        input: { userMessage: "Стучит в подвеске — что это?" },
        vehicle: { make: "Mercedes", model: "W210", year: 2001, mileage: 185000 }
      });
      sendJson(res, 200, { ok: true, result });
    } catch(err) {
      sendJson(res, 200, { ok: false, error: err.message, stack: err.stack?.split("\n").slice(0,5) });
    }
    return;
  }

  if (url.pathname === "/api/ai/assistant") {
    await handleAiRoute(req, res);
    return;
  }

  if (url.pathname === "/api/ai/product-card") {
    await handleProductCardRoute(req, res);
    return;
  }

  if (url.pathname === "/api/ai/vin") {
    await handleVinRoute(req, res);
    return;
  }

  // История чатов: /api/ai/chats и /api/ai/chats/:chatId
  if (url.pathname === "/api/ai/chats" || url.pathname.startsWith("/api/ai/chats/")) {
    const urlParts = url.pathname.split("/");
    await handleAiHistoryRoute(req, res, urlParts);
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

  if (url.pathname === "/api/market/reviews") {
    await handleMarketReviewsRoute(req, res, url);
    return;
  }

  if (url.pathname === "/api/referrals") {
    await handleReferralsRoute(req, res, url);
    return;
  }

  if (url.pathname === "/api/app-state") {
    await handleAppStateRoute(req, res);
    return;
  }

  if (url.pathname === "/api/partner/email-by-phone") {
    await handlePartnerEmailByPhone(req, res);
    return;
  }

  if (url.pathname === "/api/partner/reset-password") {
    await handlePartnerResetPassword(req, res);
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
