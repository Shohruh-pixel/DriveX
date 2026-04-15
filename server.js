"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
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

  serveStatic(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.info(`DriveX server running on http://localhost:${port}`);
  console.info(`AI_MODE=${process.env.AI_MODE || "mock"}`);
  console.info(`OPENAI_API_KEY=${process.env.OPENAI_API_KEY ? "configured" : "missing"}`);
  console.info(`GEMINI_API_KEY=${process.env.GEMINI_API_KEY ? "configured" : "missing"}`);
  console.info(`AI_PROVIDER=${process.env.AI_PROVIDER || "auto"}`);
});
