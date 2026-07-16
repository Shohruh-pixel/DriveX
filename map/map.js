(function () {
  "use strict";

  const DEFAULT_CENTER = [40.283, 69.622];
  const FALLBACK_USER_POSITION = [40.2826, 69.6242];
  const DEFAULT_ZOOM = 14;
  const FUEL_SEARCH_RADIUS_METERS = 12000;
  const CHARGING_SEARCH_RADIUS_METERS = 12000;

  // Сервисы на карте — ТОЛЬКО реальные из каталога DRIVEX (serviceDirectory
  // передаётся при mount). Раньше здесь были 4 захардкоженных фейковых СТО
  // с выдуманными рейтингами и тегами «Подходит для BMW».
  function parseGeolocation(value) {
    const match = String(value || "").match(/(-?\d+(?:\.\d+)?)[,;\s]+(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return [lat, lng];
  }

  function buildCatalogServices(serviceDirectory, center) {
    const list = serviceDirectory && Array.isArray(serviceDirectory.services)
      ? serviceDirectory.services
      : [];
    return list
      .map((item) => {
        const coords = parseGeolocation(item.geolocation || item.coords || "");
        if (!coords) return null;
        const km = distanceKm(center || DEFAULT_CENTER, coords);
        const reviews = Math.max(0, Math.round(Number(item.reviews) || 0));
        const priceNames = (Array.isArray(item.priceList) ? item.priceList : [])
          .map((row) => row && (row.name || row.title))
          .filter(Boolean);
        return {
          id: `catalog-${item.id}`,
          catalogId: item.id,
          name: item.name || "Сервис",
          lat: coords[0],
          lng: coords[1],
          rating: reviews > 0 ? item.rating : null,
          reviews,
          distance: formatDistanceLabel(km),
          type: "service",
          tags: [item.categoryLabel || item.type || "СТО", item.city || ""].filter(Boolean).slice(0, 2),
          open: item.available !== false,
          fast: false,
          eta: km < 2 ? "5 мин" : `${Math.max(6, Math.round(km * 3))} мин`,
          source: "catalog",
          address: item.address || item.locationLabel || "",
          phone: item.phone || "",
          workingHours: item.workingHours || "",
          services: priceNames
        };
      })
      .filter(Boolean);
  }

  const fallbackFuelStations = [
    {
      id: "fuel-fallback-1",
      name: "АЗС Худжанд",
      lat: 40.2884,
      lng: 69.6198,
      rating: "OSM",
      distance: "рядом",
      type: "gas",
      tags: ["Топливо", "OpenStreetMap"],
      open: true,
      fast: false,
      eta: "7 мин",
      source: "fallback"
    },
    {
      id: "fuel-fallback-2",
      name: "АЗС 24/7",
      lat: 40.2769,
      lng: 69.6312,
      rating: "OSM",
      distance: "рядом",
      type: "gas",
      tags: ["Бензин", "Дизель"],
      open: true,
      fast: false,
      eta: "9 мин",
      source: "fallback"
    },
    {
      id: "fuel-fallback-3",
      name: "Fuel Station",
      lat: 40.2912,
      lng: 69.6361,
      rating: "OSM",
      distance: "рядом",
      type: "gas",
      tags: ["АЗС", "OpenStreetMap"],
      open: true,
      fast: false,
      eta: "10 мин",
      source: "fallback"
    }
  ];

  const fallbackChargingStations = [
    {
      id: "charge-fallback-1",
      name: "EV Charge Khujand",
      lat: 40.2861,
      lng: 69.6269,
      rating: "OSM",
      distance: "рядом",
      type: "charge",
      tags: ["Зарядка EV", "OpenStreetMap"],
      open: true,
      fast: false,
      eta: "8 мин",
      source: "fallback",
      phone: "",
      connectors: ["Type 2"],
      capacity: ""
    }
  ];

  const curatedFuelStations = [
    { id: "curated-gpn-34", name: "Газпромнефть №34", network: "Газпромнефть", address: "ул. Сырдарьинская, 42", phone: "+992 44 600 6060", fuelTypes: ["92", "95", "G-92", "ДТ", "ГАЗ"], lat: 40.2872, lng: 69.6158, coordinateAccuracy: "адрес / ориентир" },
    { id: "curated-gpn-15", name: "Газпромнефть №15", network: "Газпромнефть", address: "18-й мкр, ул. Севастопольская", phone: "+992 44 600 6060", fuelTypes: ["92", "95", "G-92", "ДТ", "ГАЗ"], lat: 40.3019, lng: 69.6502, coordinateAccuracy: "район" },
    { id: "curated-gpn-33", name: "Газпромнефть №33", network: "Газпромнефть", address: "пр-т Ташкентский", phone: "+992 44 600 6060", fuelTypes: ["92", "95", "G-92", "ДТ", "ГАЗ"], lat: 40.2896, lng: 69.6414, coordinateAccuracy: "ориентир" },
    { id: "curated-gazoyl-1", name: "Газойл", network: "Gazoyl", address: "хиёбани Аминчон Шукухй, 1-й филиал", phone: "+992 50 500 0550", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.270958, lng: 69.637024, coordinateAccuracy: "адрес / ориентир" },
    { id: "curated-gazoyl-2", name: "Газойл", network: "Gazoyl", address: "ул. Гагарина, 2-й филиал", phone: "+992 50 500 0550", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2948, lng: 69.6281, coordinateAccuracy: "ориентир" },
    { id: "curated-statneft-12", name: "Статнефть", network: "Статнефть", address: "12-й микрорайон", phone: "", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2958, lng: 69.6409, coordinateAccuracy: "район" },
    { id: "curated-megaoil-34", name: "Мега Ойл", network: "Мега Ойл", address: "34-й микрорайон, бывшая «Ноно»", phone: "", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.3088, lng: 69.6602, coordinateAccuracy: "район" },
    { id: "curated-oriyo-north", name: "Ориё", network: "Oriyo", address: "ул. Северная", phone: "", fuelTypes: ["92", "95", "ГАЗ"], lat: 40.2992, lng: 69.6159, coordinateAccuracy: "ориентир" },
    { id: "curated-farah-lenin", name: "Фарах Ойл", network: "Фарах Ойл", address: "ул. Ленина, выезд на Гафуров", phone: "", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2921, lng: 69.6762, coordinateAccuracy: "ориентир" },

    { id: "curated-sugd-orom", name: "Сугднефть · Круг «Ором»", network: "Сугднефть", address: "г. Худжанд, развязка «Ором»", phone: "005 / +992 92 610 5000", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2924, lng: 69.5946, coordinateAccuracy: "ориентир" },
    { id: "curated-sugd-8", name: "Сугднефть · 8-й микрорайон", network: "Сугднефть", address: "8-й мкр, вдоль главной дороги", phone: "005 / +992 92 610 5000", fuelTypes: ["92", "95", "ДТ", "ГАЗ", "Электро"], lat: 40.2927, lng: 69.6378, coordinateAccuracy: "район", hasCharging: true },
    { id: "curated-sugd-20", name: "Сугднефть · 20-й микрорайон", network: "Сугднефть", address: "20-й мкр, район рынка", phone: "005 / +992 92 610 5000", fuelTypes: ["92", "95", "ДТ", "ГАЗ", "Электро"], lat: 40.3057, lng: 69.6512, coordinateAccuracy: "район", hasCharging: true },
    { id: "curated-sugd-gagarin", name: "Сугднефть · ул. Гагарина", network: "Сугднефть", address: "ул. Гагарина, 11", phone: "+992 92 610 5000", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2934, lng: 69.6293, coordinateAccuracy: "адрес / ориентир" },
    { id: "curated-sugd-undji", name: "Сугднефть · с. Унджи", network: "Сугднефть", address: "Б. Гафуровский р-н, с. Унджи", phone: "005", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.3175, lng: 69.6934, coordinateAccuracy: "населенный пункт" },

    { id: "curated-rohi-5", name: "Рохи Сомон №5", network: "Рохи Сомон Oil", address: "7-й микрорайон", phone: "+992 92 333 3111", fuelTypes: ["92", "95", "ДТ", "ГАЗ", "Электро"], lat: 40.2913, lng: 69.6339, coordinateAccuracy: "район", hasCharging: true },
    { id: "curated-rohi-6", name: "Рохи Сомон №6", network: "Рохи Сомон Oil", address: "12-й мкр, северо-запад дома №29", phone: "+992 92 333 3111", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2965, lng: 69.6416, coordinateAccuracy: "район" },
    { id: "curated-rohi-2", name: "Рохи Сомон №2", network: "Рохи Сомон Oil", address: "ул. Рахмона Набиева, район «Арал»", phone: "+992 92 333 3111", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2791, lng: 69.6112, coordinateAccuracy: "ориентир" },
    { id: "curated-rohi-7", name: "Рохи Сомон №7", network: "Рохи Сомон Oil", address: "ул. Ленина, 168, трасса Худжанд-Гафуров", phone: "+992 92 333 3111", fuelTypes: ["92", "95", "ДТ", "ГАЗ", "Электро"], lat: 40.2929, lng: 69.6753, coordinateAccuracy: "адрес / ориентир", hasCharging: true },

    { id: "curated-seganj-office", name: "Сеганч · Центральный офис / АЗС", network: "Сеганч", address: "ул. Сырдарья, 45, Промзона", phone: "+992 92 647 4747", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2864, lng: 69.6147, coordinateAccuracy: "адрес / ориентир" },
    { id: "curated-seganj-34", name: "Сеганч · 34-й микрорайон", network: "Сеганч", address: "34-й мкр, ул. Рохи Абрешим", phone: "+992 92 928 0000", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.3096, lng: 69.6591, coordinateAccuracy: "район" },
    { id: "curated-seganj-12", name: "Сеганч · 12-й микрорайон", network: "Сеганч", address: "12-й мкр, западный выезд", phone: "+992 92 928 0000", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.2962, lng: 69.6374, coordinateAccuracy: "район" },
    { id: "curated-seganj-embankment", name: "Сеганч · Набережная", network: "Сеганч", address: "ул. Камоли Худжанди, Север", phone: "", fuelTypes: ["92", "95", "ГАЗ"], lat: 40.2903, lng: 69.6202, coordinateAccuracy: "ориентир" },
    { id: "curated-seganj-rumon", name: "Сеганч · с. Румон", network: "Сеганч", address: "Б. Гафуровский р-н, с. Румон", phone: "", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.3276, lng: 69.7336, coordinateAccuracy: "населенный пункт" },
    { id: "curated-seganj-undji", name: "Сеганч · с. Унджи", network: "Сеганч", address: "Б. Гафуровский р-н, с. Унджи", phone: "", fuelTypes: ["92", "95", "ДТ", "ГАЗ"], lat: 40.3198, lng: 69.6918, coordinateAccuracy: "населенный пункт" }
  ];

  const markerMeta = {
    service: { label: "⚙", className: "recommended", text: "СТО" },
    user: { label: "+", className: "user", text: "Добавлено" }
  };

  const filters = [
    { id: "all", label: "Все", icon: "▱" },
    { id: "service", label: "СТО", icon: "⚙" },
    { id: "gas", label: "АЗС", icon: "F" },
    { id: "charge", label: "ЭЗС", icon: "⚡" },
    { id: "user", label: "Добавленные", icon: "+" }
  ];

  markerMeta.gas = { label: "F", className: "gas", text: "АЗС" };
  markerMeta.charge = { label: "⚡", className: "charge", text: "ЭЗС" };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // «Лучший» = ближайший РЕАЛЬНЫЙ сервис каталога к пользователю
  // (раньше всегда возвращался захардкоженный фейковый «АвтоМастер Premium»).
  function getBestService(list, fromPosition) {
    const catalog = list.filter((service) => service.type === "service");
    if (!catalog.length) return null;
    const origin = fromPosition || DEFAULT_CENTER;
    return catalog.reduce((best, current) => {
      if (!best) return current;
      const bestKm = distanceKm(origin, [best.lat, best.lng]);
      const currentKm = distanceKm(origin, [current.lat, current.lng]);
      return currentKm < bestKm ? current : best;
    }, null);
  }

  function toRadians(value) {
    return (Number(value) * Math.PI) / 180;
  }

  function distanceKm(from, to) {
    const radius = 6371;
    const dLat = toRadians(to[0] - from[0]);
    const dLng = toRadians(to[1] - from[1]);
    const lat1 = toRadians(from[0]);
    const lat2 = toRadians(to[0]);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistanceLabel(km) {
    if (!Number.isFinite(km)) return "рядом";
    if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 50) * 50)} м`;
    return `${km.toFixed(km < 10 ? 1 : 0)} км`;
  }

  function getOsmPhone(tags) {
    return tags.phone || tags["contact:phone"] || tags["contact:mobile"] || tags.mobile || "";
  }

  function getFuelTypes(tags) {
    const labels = {
      "fuel:diesel": "Дизель",
      "fuel:octane_80": "АИ-80",
      "fuel:octane_91": "АИ-91",
      "fuel:octane_92": "АИ-92",
      "fuel:octane_95": "АИ-95",
      "fuel:octane_98": "АИ-98",
      "fuel:lpg": "Газ LPG",
      "fuel:cng": "Метан CNG",
      "fuel:electricity": "EV"
    };
    return Object.entries(labels)
      .filter(([key]) => /^(yes|1|true)$/i.test(String(tags[key] || "")))
      .map(([, label]) => label);
  }

  function getChargingConnectors(tags) {
    const labels = {
      "socket:type2": "Type 2",
      "socket:chademo": "CHAdeMO",
      "socket:ccs": "CCS",
      "socket:tesla_supercharger": "Tesla",
      "socket:type1": "Type 1"
    };
    return Object.entries(labels)
      .filter(([key]) => Number(tags[key]) > 0 || /^(yes|1|true)$/i.test(String(tags[key] || "")))
      .map(([, label]) => label);
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-zа-я0-9]+/g, " ")
      .trim();
  }

  function buildCuratedFuelStation(item, center) {
    const km = distanceKm(center || DEFAULT_CENTER, [item.lat, item.lng]);
    return {
      ...item,
      rating: "DriveX",
      distance: formatDistanceLabel(km),
      type: "gas",
      tags: [item.network || "АЗС", item.hasCharging ? "Электро" : "DriveX verified"].slice(0, 2),
      open: true,
      fast: false,
      eta: km < 2 ? "5 мин" : `${Math.max(6, Math.round(km * 3))} мин`,
      source: "curated",
      curated: true,
      connectors: item.hasCharging ? ["EV"] : [],
      brand: item.network || "",
      operator: item.network || ""
    };
  }

  function isSameStation(a, b) {
    const aText = normalizeText(`${a.name} ${a.brand || ""} ${a.operator || ""} ${a.address || ""}`);
    const bText = normalizeText(`${b.name} ${b.brand || ""} ${b.operator || ""} ${b.address || ""}`);
    if (!aText || !bText) return false;
    const sameNetwork =
      (a.network && bText.includes(normalizeText(a.network))) ||
      (b.network && aText.includes(normalizeText(b.network)));
    const closeEnough = Number.isFinite(a.lat) && Number.isFinite(b.lat) && distanceKm([a.lat, a.lng], [b.lat, b.lng]) < 0.45;
    return closeEnough && (sameNetwork || aText.includes(bText) || bText.includes(aText));
  }

  function mergeFuelDirectory(osmStations, center) {
    const merged = (Array.isArray(osmStations) && osmStations.length ? osmStations : fallbackFuelStations).map((station) => {
      const curatedMatch = curatedFuelStations.find((item) => isSameStation(item, station));
      if (!curatedMatch) return station;
      return {
        ...station,
        name: curatedMatch.name,
        network: curatedMatch.network,
        address: curatedMatch.address,
        phone: curatedMatch.phone,
        fuelTypes: curatedMatch.fuelTypes,
        hasCharging: Boolean(curatedMatch.hasCharging),
        tags: [curatedMatch.network || station.tags?.[0] || "АЗС", curatedMatch.hasCharging ? "Электро" : "DriveX verified"],
        source: station.source === "osm" ? "osm+curated" : "curated",
        curated: true,
        coordinateAccuracy: curatedMatch.coordinateAccuracy || "OSM"
      };
    });

    curatedFuelStations.forEach((item) => {
      if (!merged.some((station) => isSameStation(item, station))) {
        merged.push(buildCuratedFuelStation(item, center));
      }
    });

    return merged;
  }

  function buildOverpassFuelQuery(center, radiusMeters) {
    const lat = Number(center[0]).toFixed(6);
    const lng = Number(center[1]).toFixed(6);
    const radius = Math.max(1000, Math.min(50000, Number(radiusMeters) || FUEL_SEARCH_RADIUS_METERS));
    return `
      [out:json][timeout:18];
      (
        node["amenity"="fuel"](around:${radius},${lat},${lng});
        way["amenity"="fuel"](around:${radius},${lat},${lng});
        relation["amenity"="fuel"](around:${radius},${lat},${lng});
      );
      out center tags;
    `;
  }

  function buildOverpassChargingQuery(center, radiusMeters) {
    const lat = Number(center[0]).toFixed(6);
    const lng = Number(center[1]).toFixed(6);
    const radius = Math.max(1000, Math.min(50000, Number(radiusMeters) || CHARGING_SEARCH_RADIUS_METERS));
    return `
      [out:json][timeout:18];
      (
        node["amenity"="charging_station"](around:${radius},${lat},${lng});
        way["amenity"="charging_station"](around:${radius},${lat},${lng});
        relation["amenity"="charging_station"](around:${radius},${lat},${lng});
      );
      out center tags;
    `;
  }

  function normalizeFuelElement(element, center, index) {
    const lat = Number(element.lat ?? element.center?.lat);
    const lng = Number(element.lon ?? element.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const tags = element.tags || {};
    const name = tags.name || tags.brand || tags.operator || "АЗС";
    const brandTag = tags.brand || tags.operator || "Топливо";
    const km = distanceKm(center, [lat, lng]);

    return {
      id: `fuel-osm-${element.type || "node"}-${element.id || index}`,
      osmId: element.id,
      name,
      lat,
      lng,
      rating: "OSM",
      distance: formatDistanceLabel(km),
      type: "gas",
      tags: [brandTag, "OpenStreetMap"].slice(0, 2),
      open: true,
      fast: false,
      eta: km < 2 ? "5 мин" : `${Math.max(6, Math.round(km * 3))} мин`,
      source: "osm",
      phone: getOsmPhone(tags),
      fuelTypes: getFuelTypes(tags),
      hasCharging: /^(yes|1|true)$/i.test(String(tags["fuel:electricity"] || "")) || tags["amenity"] === "charging_station",
      operator: tags.operator || "",
      brand: tags.brand || ""
    };
  }

  function normalizeChargingElement(element, center, index) {
    const lat = Number(element.lat ?? element.center?.lat);
    const lng = Number(element.lon ?? element.center?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const tags = element.tags || {};
    const name = tags.name || tags.operator || "Зарядная станция";
    const km = distanceKm(center, [lat, lng]);
    const connectors = getChargingConnectors(tags);

    return {
      id: `charge-osm-${element.type || "node"}-${element.id || index}`,
      osmId: element.id,
      name,
      lat,
      lng,
      rating: "OSM",
      distance: formatDistanceLabel(km),
      type: "charge",
      tags: [connectors[0] || "EV зарядка", tags.operator || "OpenStreetMap"].slice(0, 2),
      open: true,
      fast: false,
      eta: km < 2 ? "6 мин" : `${Math.max(7, Math.round(km * 3.2))} мин`,
      source: "osm",
      phone: getOsmPhone(tags),
      connectors,
      capacity: tags.capacity || "",
      operator: tags.operator || "",
      brand: tags.brand || ""
    };
  }

  async function fetchFuelStations(center) {
    const query = buildOverpassFuelQuery(center, FUEL_SEARCH_RADIUS_METERS);
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Overpass failed with ${response.status}`);
    const payload = await response.json();
    const seen = new Set();
    return (payload.elements || [])
      .map((element, index) => normalizeFuelElement(element, center, index))
      .filter(Boolean)
      .filter((station) => {
        const key = `${station.name.toLowerCase()}-${station.lat.toFixed(5)}-${station.lng.toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 80);
  }

  async function fetchChargingStations(center) {
    const query = buildOverpassChargingQuery(center, CHARGING_SEARCH_RADIUS_METERS);
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Overpass charging failed with ${response.status}`);
    const payload = await response.json();
    const seen = new Set();
    return (payload.elements || [])
      .map((element, index) => normalizeChargingElement(element, center, index))
      .filter(Boolean)
      .filter((station) => {
        const key = `${station.name.toLowerCase()}-${station.lat.toFixed(5)}-${station.lng.toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 60);
  }

  async function fetchDrivingRoute(start, end) {
    const fromLng = Number(start[1]).toFixed(6);
    const fromLat = Number(start[0]).toFixed(6);
    const toLng = Number(end[1]).toFixed(6);
    const toLat = Number(end[0]).toFixed(6);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=false`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`OSRM failed with ${response.status}`);
    const payload = await response.json();
    const route = payload.routes && payload.routes[0];
    const coordinates = route?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) throw new Error("OSRM returned empty route");
    return {
      points: coordinates.map((point) => [point[1], point[0]]),
      minutes: Math.max(1, Math.round((Number(route.duration) || 0) / 60))
    };
  }

  function createMarkerIcon(service, active) {
    const type = service.fast && service.type !== "recommended" ? "fast" : service.type;
    const meta = markerMeta[type] || markerMeta.recommended;
    const activeClass = active ? " is-active" : "";
    const markerInner =
      service.type === "gas"
        ? `<span class="dx-map-fuel-glyph" aria-hidden="true"><i></i><b></b></span>`
        : service.type === "charge"
          ? `<span class="dx-map-charge-glyph" aria-hidden="true"></span>`
        : `<span>${meta.label}</span>`;

    return window.L.divIcon({
      className: "dx-map-marker-shell",
      html: `
        <button class="dx-map-marker dx-map-marker-${meta.className}${activeClass}" type="button" aria-label="${escapeHtml(service.name)}">
          ${markerInner}
        </button>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  function normalizeUserPlace(place) {
    const lat = Number(place.lat);
    const lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      id: place.id,
      name: place.name || "Добавленное место",
      lat,
      lng,
      rating: place.status === "published" ? "DriveX" : "pending",
      distance: place.address || "добавлено пользователем",
      type: place.category === "gas" ? "gas" : place.category === "charge" ? "charge" : "user",
      category: place.category || place.type || "other",
      tags: [place.status === "published" ? "Опубликовано" : "На проверке", place.isOwner ? "Владелец" : "Пользователь"],
      open: true,
      fast: false,
      eta: "маршрут",
      source: "user",
      userPlace: true,
      status: place.status || "published",
      verified: place.verified === true,
      address: place.address || "",
      phone: place.contact || "",
      contact: place.contact || "",
      workingHours: place.workingHours || "",
      description: place.description || "",
      services: Array.isArray(place.services) ? place.services : [],
      prices: place.prices || "",
      photos: Array.isArray(place.photos) ? place.photos : [],
      features: place.features || {},
      isOwner: Boolean(place.isOwner)
    };
  }

  function renderShell(container) {
    container.innerHTML = `
      <section class="dx-map-screen">
        <div id="dx-leaflet-map" class="dx-leaflet-map" aria-hidden="true"></div>

        <div class="dx-map-top">
          <label class="dx-map-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Поиск по карте: сервис, АЗС, зарядка..." autocomplete="off" />
          </label>
          <div class="dx-map-filters" role="tablist" aria-label="Фильтры карты"></div>
          <article class="dx-map-ai-card">
            <div class="dx-map-ai-icon">✦</div>
            <div>
              <h2 data-map-summary-title>Ищем точки рядом...</h2>
              <p data-map-summary-sub>АЗС и зарядки — из открытых данных OSM</p>
            </div>
            <button type="button" data-action="show-best">Ближайший сервис</button>
          </article>
        </div>

        <div class="dx-map-user-pulse" aria-hidden="true">
          <span></span>
        </div>

        <div class="dx-map-side-controls">
          <button type="button" data-action="locate" aria-label="Мое местоположение">⌖</button>
          <button type="button" data-action="layers" aria-label="Слои карты">▰</button>
        </div>

        <div class="dx-map-route-time" aria-live="polite"></div>
        <button class="dx-map-best-button" type="button" data-action="best-route">✣ Найти лучший сервис</button>

        <article class="dx-map-bottom-sheet" aria-live="polite" aria-hidden="true">
          <div class="dx-map-sheet-handle"></div>
          <div class="dx-map-sheet-content"></div>
        </article>
      </section>
    `;
  }

  function renderFilters(root, activeFilter) {
    const wrap = root.querySelector(".dx-map-filters");
    if (!wrap) return;

    wrap.innerHTML = filters
      .map(
        (filter) => `
          <button
            class="dx-map-chip${filter.id === activeFilter ? " is-active" : ""}"
            type="button"
            role="tab"
            aria-selected="${filter.id === activeFilter ? "true" : "false"}"
            data-filter="${filter.id}"
          >
            <span>${filter.icon}</span>${escapeHtml(filter.label)}
          </button>
        `
      )
      .join("");
  }

  function renderSheet(root, service, expanded) {
    const sheet = root.querySelector(".dx-map-bottom-sheet");
    const content = root.querySelector(".dx-map-sheet-content");
    if (!sheet || !content || !service) return;

    const tags = Array.isArray(service.tags) ? service.tags.slice(0, 2) : [];
    const isGasStation = service.type === "gas";
    const isChargeStation = service.type === "charge";
    const isUserPlace = service.userPlace === true || service.source === "user";
    const isCatalogService = service.type === "service" && service.source === "catalog";
    const hasPoiVisual = isGasStation || isChargeStation;
    const fuelTypes = Array.isArray(service.fuelTypes) && service.fuelTypes.length
      ? service.fuelTypes
      : isGasStation
        ? ["АИ-92", "АИ-95", "Дизель"]
        : [];
    const connectors = Array.isArray(service.connectors) && service.connectors.length
      ? service.connectors
      : isChargeStation
        ? ["Type 2"]
        : [];
    const phone = service.phone || service.contact || "";
    const phoneHref = phone ? phone.replace(/[^\d+]/g, "") : "";
    const sourceLabel = service.source === "curated"
      ? "DriveX verified"
      : service.source === "osm+curated"
        ? "OSM + DriveX verified"
        : service.source === "osm"
          ? "OpenStreetMap"
          : "резервная база";
    const addressText = service.address || "не указан";
    const coordinateText = service.coordinateAccuracy ? ` · координаты: ${service.coordinateAccuracy}` : "";
    const badgeText = isGasStation
      ? "АЗС из открытых данных"
      : isChargeStation
        ? "Электрозарядка из открытых данных"
        : isUserPlace
          ? service.status === "published" ? "Добавлено пользователем" : "На проверке"
          : isCatalogService
            ? "Сервис DRIVEX"
            : "Точка на карте";
    const statusText = isUserPlace
      ? `Данные: DriveX · ${service.status === "published" ? "опубликовано" : "на проверке"}`
      : isGasStation || isChargeStation
      ? `Данные: ${sourceLabel} · проверь актуальность на месте`
      : service.open
        ? `Открыто${service.workingHours ? ` · ${service.workingHours}` : " сейчас"}`
        : `Закрыто${service.workingHours ? ` · ${service.workingHours}` : ""}`;
    // Честный рейтинг: у АЗС/ЭЗС — источник данных, у сервисов — только
    // реальные отзывы (раньше выводилось «OSM OSM» и выдуманные ★4.8).
    const ratingLabel = isGasStation || isChargeStation
      ? escapeHtml(String(service.rating || "OSM"))
      : Number(service.reviews) > 0
        ? `★ ${escapeHtml(String(service.rating))} (${service.reviews})`
        : "Новый";

    sheet.setAttribute("aria-hidden", "false");
    sheet.classList.add("is-visible");
    sheet.classList.toggle("is-expanded", Boolean(expanded));
    content.innerHTML = `
      <div class="dx-map-sheet-actions">
        <button class="dx-map-sheet-back" type="button" data-action="close-sheet" aria-label="Назад">‹</button>
        <button class="dx-map-sheet-close" type="button" data-action="close-sheet" aria-label="Закрыть">×</button>
      </div>
      ${hasPoiVisual
        ? `<div class="dx-map-sheet-photo">
            <div class="dx-map-station-visual${isChargeStation ? " is-charge" : ""}" role="img" aria-label="${escapeHtml(service.name)}">
              <span class="dx-map-station-canopy"></span>
              <span class="dx-map-station-pump"></span>
              <span class="dx-map-station-road"></span>
            </div>
            <span>${isChargeStation ? "ЭЗС" : escapeHtml(service.tags?.[0] || "АЗС")}</span>
          </div>`
        : ""}
      <div class="dx-map-sheet-main">
        <div>
          <p class="dx-map-sheet-badge">${badgeText}</p>
          <h3>${escapeHtml(service.name)}</h3>
          <div class="dx-map-sheet-meta">
            <span>${ratingLabel}</span>
            <span>${escapeHtml(service.distance || "рядом")}</span>
            <span>${escapeHtml(service.eta || "маршрут")}</span>
          </div>
        </div>
        <button class="dx-map-save" type="button" aria-label="Сохранить">⌑</button>
      </div>
      <div class="dx-map-sheet-tags">
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
      ${isUserPlace || isCatalogService
        ? `<div class="dx-map-info-grid">
            <div>
              <strong>Телефон</strong>
              ${phone ? `<a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(phone)}</a>` : `<span>не указан</span>`}
            </div>
            <div>
              <strong>Режим</strong>
              <span>${escapeHtml(service.workingHours || "не указан")}</span>
            </div>
            <div>
              <strong>Адрес</strong>
              <span>${escapeHtml(addressText)}</span>
            </div>
            <div>
              <strong>Услуги</strong>
              <span>${escapeHtml((service.services || []).slice(0, 3).join(" · ") || service.description || "не указаны")}</span>
            </div>
          </div>`
        : ""}
      ${isGasStation
        ? `<div class="dx-map-info-grid">
            <div>
              <strong>Телефон</strong>
              ${phone ? `<a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(phone)}</a>` : `<span>не указан в OSM</span>`}
            </div>
            <div>
              <strong>Топливо</strong>
              <span>${fuelTypes.map(escapeHtml).join(" · ")}</span>
            </div>
            <div>
              <strong>Зарядка EV</strong>
              <span>${service.hasCharging ? "есть" : "не указана"}</span>
            </div>
            <div>
              <strong>Адрес</strong>
              <span>${escapeHtml(addressText)}</span>
            </div>
          </div>`
        : ""}
      ${isChargeStation
        ? `<div class="dx-map-info-grid">
            <div>
              <strong>Телефон</strong>
              ${phone ? `<a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(phone)}</a>` : `<span>не указан в OSM</span>`}
            </div>
            <div>
              <strong>Разъемы</strong>
              <span>${connectors.map(escapeHtml).join(" · ")}</span>
            </div>
            <div>
              <strong>Посты</strong>
              <span>${escapeHtml(service.capacity || "не указано")}</span>
            </div>
            <div>
              <strong>Адрес</strong>
              <span>${escapeHtml(addressText)}</span>
            </div>
          </div>`
        : ""}
      <p class="dx-map-sheet-status">${statusText}${coordinateText}</p>
      ${isCatalogService
        ? `<div class="dx-map-sheet-cta-row">
            <button class="dx-map-drive-button" type="button" data-action="drive" data-service-id="${escapeHtml(service.id)}">Поехать · ${escapeHtml(service.eta || "маршрут")}</button>
            <button class="dx-map-drive-button is-book" type="button" data-action="open-service" data-catalog-id="${escapeHtml(service.catalogId)}">Записаться</button>
          </div>`
        : `<button class="dx-map-drive-button" type="button" data-action="drive" data-service-id="${escapeHtml(service.id)}">Поехать · ${escapeHtml(service.eta || "маршрут")}</button>`}
    `;
  }

  function mount(options = {}) {
    const container = document.getElementById(options.containerId || "map-container");
    if (!container) return null;

    renderShell(container);

    const root = container.querySelector(".dx-map-screen");
    const mapNode = container.querySelector("#dx-leaflet-map");
    const leaflet = window.L;
    let activeFilter = "all";
    let activeServiceId = null;
    let routeLine = null;
    let routeBuilt = false;
    let sheetExpanded = false;
    let startY = 0;
    let userPosition = FALLBACK_USER_POSITION;
    let geoWatchId = null;
    let accuracyCircle = null;
    let hasRealUserPosition = false;
    let geoWatchFlyUsed = false;
    let destroyed = false;
    let fuelStations = [];
    let chargingStations = [];
    const catalogServices = buildCatalogServices(options.serviceDirectory, DEFAULT_CENTER);
    const carName = String(options.carName || "").trim();
    let mapItems = [...catalogServices];
    let fuelLoadedForKey = "";
    let chargingLoadedForKey = "";
    let routeRequestId = 0;
    let addPlaceController = null;
    let searchQuery = "";
    let satelliteLayer = null;
    let satelliteOn = false;

    if (!leaflet || !mapNode) {
      root.innerHTML = `
        <div class="dx-map-fallback">
          <h2>Карта временно недоступна</h2>
          <p>Leaflet не загрузился. Проверь подключение к интернету и обнови страницу.</p>
        </div>
      `;
      return { destroy() {} };
    }

    const map = leaflet.map(mapNode, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true
    });

    const tileLayer = leaflet
      .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        crossOrigin: true
      })
      .addTo(map);

    tileLayer.on("tileerror", () => {
      root.classList.add("has-tile-error");
      showMapToast("Карта загружается нестабильно. Точки сервисов работают.");
    });

    tileLayer.on("load", () => {
      root.classList.remove("has-tile-error");
    });

    leaflet.control.zoom({ position: "bottomright" }).addTo(map);

    const userMarker = leaflet.circleMarker(userPosition, {
      radius: 8,
      fillColor: "#0ea5e9",
      fillOpacity: 1,
      color: "#dbeafe",
      weight: 3,
      opacity: 0.95
    }).addTo(map);

    accuracyCircle = leaflet.circle(userPosition, {
      radius: 120,
      color: "#0ea5e9",
      opacity: 0.18,
      weight: 1,
      fillColor: "#0ea5e9",
      fillOpacity: 0.07
    }).addTo(map);

    const markerLayer = leaflet.layerGroup().addTo(map);
    const markerMap = new Map();

    function matchesSearch(service) {
      if (!searchQuery) return true;
      const haystack = normalizeText(
        `${service.name} ${(service.tags || []).join(" ")} ${service.address || ""} ${service.category || ""} ${(service.services || []).join(" ")}`
      );
      return haystack.includes(searchQuery);
    }

    function passesFilter(service) {
      if (!matchesSearch(service)) return false;
      if (activeFilter === "all") return true;
      if (activeFilter === "service") return service.type === "service" || (service.userPlace && ["service", "wash", "diagnostics", "tire", "detailing", "electric", "towing"].includes(service.category));
      if (activeFilter === "charge") return service.type === "charge" || service.hasCharging === true;
      if (activeFilter === "gas") return service.type === "gas";
      if (activeFilter === "user") return service.userPlace === true;
      return service.type === activeFilter;
    }

    function updateSummaryCard() {
      const title = root.querySelector("[data-map-summary-title]");
      const sub = root.querySelector("[data-map-summary-sub]");
      if (!title || !sub) return;
      const parts = [];
      if (catalogServices.length) parts.push(`${catalogServices.length} СТО`);
      if (fuelStations.length) parts.push(`${fuelStations.length} АЗС`);
      if (chargingStations.length) parts.push(`${chargingStations.length} зарядок`);
      title.textContent = parts.length ? `Рядом: ${parts.join(" · ")}` : "Ищем точки рядом...";
      sub.textContent = carName
        ? `Твоя машина: ${carName} · АЗС и зарядки — данные OSM`
        : "АЗС и зарядки — из открытых данных OSM";
    }

    function setMarkerStates() {
      markerMap.forEach((marker, id) => {
        const service = mapItems.find((item) => item.id === id);
        if (!service) return;
        const element = marker.getElement();
        if (!element) return;
        const visible = passesFilter(service);
        const inactiveByBest = routeBuilt && activeServiceId && id !== activeServiceId;
        element.classList.toggle("is-hidden", !visible);
        element.classList.toggle("is-dimmed", inactiveByBest);
      });
    }

    function refreshMarkerIcons() {
      markerMap.forEach((marker, id) => {
        const service = mapItems.find((item) => item.id === id);
        if (service) marker.setIcon(createMarkerIcon(service, id === activeServiceId));
      });
      window.setTimeout(setMarkerStates, 0);
    }

    function selectService(service, optionsForSelect = {}) {
      if (!service) return;
      activeServiceId = service.id;
      sheetExpanded = Boolean(optionsForSelect.expand);
      routeBuilt = Boolean(optionsForSelect.dimOthers) || routeBuilt;
      refreshMarkerIcons();
      renderSheet(root, service, sheetExpanded);
      map.flyTo([service.lat, service.lng], optionsForSelect.zoom || 15, {
        animate: true,
        duration: optionsForSelect.duration || 0.9,
        easeLinearity: 0.2
      });
    }

    function renderMarkers() {
      markerLayer.clearLayers();
      markerMap.clear();

      mapItems.forEach((service, index) => {
        const marker = leaflet.marker([service.lat, service.lng], {
          icon: createMarkerIcon(service, service.id === activeServiceId),
          keyboard: true,
          title: service.name
        });

        marker.on("click", () => {
          routeBuilt = false;
          selectService(service, { zoom: 15, duration: 0.72 });
        });

        marker.addTo(markerLayer);
        markerMap.set(service.id, marker);
        // Каскад появления ограничен первыми ~12 маркерами: при 70+ точках
        // (реальные АЗС из OSM) полный каскад 90+index*80 растягивался на
        // 6 секунд и выглядел как «карта постоянно мигает».
        window.setTimeout(() => {
          const element = marker.getElement();
          if (element) element.classList.add("is-mounted");
        }, 60 + Math.min(index, 12) * 45);
      });

      setMarkerStates();
    }

    function applyFuelStations(nextFuelStations, centerForFuel = DEFAULT_CENTER) {
      fuelStations = mergeFuelDirectory(nextFuelStations, centerForFuel);
      mapItems = [...catalogServices, ...fuelStations, ...chargingStations];
      renderMarkers();
      updateSummaryCard();
      if (activeFilter === "gas") {
        showMapToast(`Найдено АЗС: ${fuelStations.length}`);
      }
    }

    function applyChargingStations(nextChargingStations) {
      chargingStations = Array.isArray(nextChargingStations) && nextChargingStations.length ? nextChargingStations : fallbackChargingStations;
      mapItems = [...catalogServices, ...fuelStations, ...chargingStations];
      renderMarkers();
      updateSummaryCard();
      if (activeFilter === "charge") {
        showMapToast(`Найдено ЭЗС: ${chargingStations.length}`);
      }
    }

    function upsertUserPlaces(places, optionsForUserPlaces = {}) {
      const normalizedPlaces = (Array.isArray(places) ? places : [places])
        .map(normalizeUserPlace)
        .filter(Boolean);
      if (!normalizedPlaces.length) return;

      normalizedPlaces.forEach((place) => {
        mapItems = mapItems.filter((item) => item.id !== place.id);
        mapItems.push(place);
      });
      renderMarkers();
      if (optionsForUserPlaces.select) {
        const selected = normalizedPlaces[0];
        selectService(selected, { zoom: 16, duration: 0.75 });
      }
    }

    async function loadFuelStations(center, optionsForFuel = {}) {
      const key = `${Number(center[0]).toFixed(3)},${Number(center[1]).toFixed(3)}`;
      if (!optionsForFuel.force && fuelLoadedForKey === key) return;
      fuelLoadedForKey = key;

      try {
        const stations = await fetchFuelStations(center);
        if (destroyed) return;
        applyFuelStations(stations, center);
      } catch {
        if (destroyed) return;
        applyFuelStations(fallbackFuelStations, center);
        showMapToast("АЗС временно показаны из резервной базы.");
      }
    }

    async function loadChargingStations(center, optionsForCharge = {}) {
      const key = `${Number(center[0]).toFixed(3)},${Number(center[1]).toFixed(3)}`;
      if (!optionsForCharge.force && chargingLoadedForKey === key) return;
      chargingLoadedForKey = key;

      try {
        const stations = await fetchChargingStations(center);
        if (destroyed) return;
        applyChargingStations(stations);
      } catch {
        if (destroyed) return;
        applyChargingStations(fallbackChargingStations);
        showMapToast("ЭЗС временно показаны из резервной базы.");
      }
    }

    async function drawRoute(service) {
      if (!service) return;
      if (!hasRealUserPosition) {
        showMapToast("Сначала нажми геолокацию и разреши доступ, чтобы построить маршрут от тебя.");
        locateUser({ zoom: 17, duration: 0.95, watch: true, flyFirst: true });
        return;
      }
      const requestId = ++routeRequestId;
      const destination = [service.lat, service.lng];
      let routePoints = [userPosition, getRouteMidpoint(userPosition, destination), destination];
      let routeMinutes = null;

      try {
        const drivingRoute = await fetchDrivingRoute(userPosition, destination);
        if (destroyed || requestId !== routeRequestId) return;
        routePoints = drivingRoute.points;
        routeMinutes = drivingRoute.minutes;
      } catch {
        if (destroyed || requestId !== routeRequestId) return;
        showMapToast("Маршрут по дорогам временно недоступен, показал прямое направление.");
      }

      if (routeLine) map.removeLayer(routeLine);
      routeLine = leaflet
        .polyline(routePoints, {
          className: "dx-map-route-line",
          color: "#0ea5e9",
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round"
        })
        .addTo(map);
      root.querySelector(".dx-map-route-time").textContent = routeMinutes ? `${routeMinutes} мин` : service.eta || "5 мин";
      root.querySelector(".dx-map-route-time").classList.add("is-visible");
      map.fitBounds(leaflet.latLngBounds(routePoints).pad(0.2), {
        animate: true,
        duration: 0.85
      });
    }

    function getRouteMidpoint(start, end) {
      const lat = (Number(start[0]) + Number(end[0])) / 2;
      const lng = (Number(start[1]) + Number(end[1])) / 2;
      return [lat + 0.0008, lng - 0.0007];
    }

    function setUserPosition(position, optionsForPosition = {}) {
      if (destroyed) return;
      const coords = Array.isArray(position) ? position : null;
      if (!coords || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) return;
      userPosition = coords;
      hasRealUserPosition = optionsForPosition.real === true || hasRealUserPosition;
      userMarker.setLatLng(userPosition);
      if (accuracyCircle) {
        accuracyCircle.setLatLng(userPosition);
        accuracyCircle.setRadius(Math.max(35, Math.min(3000, Number(optionsForPosition.accuracy) || 120)));
      }

      const pulse = root.querySelector(".dx-map-user-pulse");
      if (pulse && map._loaded && map.getPane("mapPane")) {
        try {
          const point = map.latLngToContainerPoint(userPosition);
          pulse.style.left = `${point.x}px`;
          pulse.style.top = `${point.y}px`;
        } catch {
          // Leaflet can briefly miss pane position during initial mobile layout.
        }
      }

      if (optionsForPosition.fly !== false) {
        map.flyTo(userPosition, optionsForPosition.zoom || 15, {
          animate: true,
          duration: optionsForPosition.duration || 0.85
        });
      }
    }

    function refreshUserPulsePosition() {
      if (destroyed || !map._loaded) return;
      setUserPosition(userPosition, { fly: false });
    }

    function handleGeoPosition(position, optionsForLocate = {}) {
      const latitude = position.coords?.latitude;
      const longitude = position.coords?.longitude;
      const accuracy = Number(position.coords?.accuracy) || 0;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        showMapToast("Телефон не вернул точные координаты.");
        return;
      }

      setUserPosition([latitude, longitude], {
        ...optionsForLocate,
        real: true,
        accuracy
      });
      loadFuelStations([latitude, longitude]);
      loadChargingStations([latitude, longitude]);

      const accuracyLabel = accuracy ? ` · точность ${Math.round(accuracy)} м` : "";
      showMapToast(`Местоположение обновлено${accuracyLabel}`);
    }

    function locateUser(optionsForLocate = {}) {
      if (!navigator.geolocation) {
        if (!hasRealUserPosition) setUserPosition(FALLBACK_USER_POSITION, { ...optionsForLocate, fly: false });
        showMapToast("Геолокация недоступна на этом устройстве.");
        return;
      }

      if (!window.isSecureContext && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
        showMapToast("Для точной геолокации на телефоне открой карту через HTTPS.");
      }

      if (optionsForLocate.watch && geoWatchId === null) {
        geoWatchFlyUsed = false;
        geoWatchId = navigator.geolocation.watchPosition(
          (position) => {
            const shouldFly = optionsForLocate.flyFirst === true && !geoWatchFlyUsed;
            geoWatchFlyUsed = geoWatchFlyUsed || shouldFly;
            handleGeoPosition(position, { ...optionsForLocate, fly: shouldFly });
          },
          () => showMapToast("Разреши доступ к геолокации в настройках браузера."),
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      }

      navigator.geolocation.getCurrentPosition(
        (position) => handleGeoPosition(position, optionsForLocate),
        () => {
          if (!hasRealUserPosition) setUserPosition(FALLBACK_USER_POSITION, { ...optionsForLocate, fly: false });
          showMapToast("Разреши доступ к геолокации, чтобы показать точное место.");
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }

    function showMapToast(message) {
      const toast = root.querySelector(".dx-map-toast") || document.createElement("div");
      toast.className = "dx-map-toast is-visible";
      toast.textContent = message;
      if (!toast.parentNode) root.appendChild(toast);
      window.clearTimeout(showMapToast.timer);
      showMapToast.timer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 2400);
    }

    function chooseBest({ withRoute } = {}) {
      const best = activeServiceId
        ? mapItems.find((item) => item.id === activeServiceId)
        : getBestService(mapItems, userPosition);
      if (!best) {
        showMapToast("Подключённых сервисов рядом пока нет — посмотрите АЗС и зарядки");
        return;
      }
      routeBuilt = true;
      selectService(best, { dimOthers: true, zoom: 16, duration: 1.15 });
      if (withRoute) drawRoute(best);
    }

    function routeToService(service) {
      if (!service) return;
      routeBuilt = true;
      selectService(service, { dimOthers: true, zoom: 16, duration: 1.05 });
      drawRoute(service);
    }

    function closeSheet() {
      const sheet = root.querySelector(".dx-map-bottom-sheet");
      if (!sheet) return;
      sheet.classList.remove("is-visible", "is-expanded");
      sheet.setAttribute("aria-hidden", "true");
      sheetExpanded = false;
      if (!routeBuilt) {
        activeServiceId = null;
        refreshMarkerIcons();
      }
    }

    renderFilters(root, activeFilter);
    renderMarkers();
    loadFuelStations(DEFAULT_CENTER);
    loadChargingStations(DEFAULT_CENTER);
    if (window.DrivexAddPlace && typeof window.DrivexAddPlace.init === "function") {
      addPlaceController = window.DrivexAddPlace.init({
        root,
        map,
        leaflet,
        showToast: showMapToast,
        onPlaceSelected: (place) => {
          const normalized = normalizeUserPlace(place);
          if (normalized) {
            upsertUserPlaces([normalized]);
            selectService(normalized, { zoom: 16, duration: 0.75 });
          }
        },
        onSharedPlacesLoaded: (places) => {
          upsertUserPlaces(places);
        },
        onPlaceSubmitted: (place) => {
          upsertUserPlaces([place], { select: true });
          activeFilter = "all";
          renderFilters(root, activeFilter);
          setMarkerStates();
        }
      });
    }
    window.setTimeout(() => {
      if (!destroyed) map.invalidateSize();
    }, 120);
    map.whenReady(() => {
      if (destroyed) return;
      refreshUserPulsePosition();
      window.setTimeout(() => locateUser({ fly: false, watch: true }), 450);
    });
    map.on("move zoom zoomend moveend", refreshUserPulsePosition);

    root.addEventListener("click", (event) => {
      const filterButton = event.target.closest("[data-filter]");
      const actionButton = event.target.closest("[data-action]");

      if (filterButton) {
        activeFilter = filterButton.getAttribute("data-filter") || "all";
        routeBuilt = false;
        renderFilters(root, activeFilter);
        setMarkerStates();
        return;
      }

      if (!actionButton) return;
      const action = actionButton.getAttribute("data-action");
      if (action === "show-best") chooseBest({ withRoute: false });
      if (action === "best-route") chooseBest({ withRoute: true });
      if (action === "close-sheet") closeSheet();
      if (action === "drive") {
        const serviceId = actionButton.getAttribute("data-service-id");
        const selectedService = mapItems.find((item) => String(item.id) === String(serviceId)) || mapItems.find((item) => item.id === activeServiceId);
        routeToService(selectedService);
      }
      if (action === "open-service") {
        // Переход на страницу сервиса в приложении — запись, прайс, мастера.
        const catalogId = actionButton.getAttribute("data-catalog-id");
        if (catalogId) window.location.hash = `#/service/${catalogId}`;
      }
      if (action === "layers") {
        // Переключение схема ↔ спутник (Esri World Imagery, бесплатный слой).
        satelliteOn = !satelliteOn;
        if (satelliteOn) {
          if (!satelliteLayer) {
            satelliteLayer = leaflet.tileLayer(
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              { maxZoom: 19 }
            );
          }
          satelliteLayer.addTo(map);
          showMapToast("Спутниковый слой включён");
        } else if (satelliteLayer) {
          map.removeLayer(satelliteLayer);
          showMapToast("Обычная схема карты");
        }
        actionButton.classList.toggle("is-active", satelliteOn);
      }
      if (action === "locate") locateUser({ zoom: 17, duration: 0.95, watch: true, flyFirst: true });
    });

    // Живой поиск: фильтрует маркеры по названию/тегам/адресу/услугам,
    // Enter — перелёт к первому совпадению (раньше поле было мёртвым).
    const searchInput = root.querySelector(".dx-map-search input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = normalizeText(searchInput.value);
        setMarkerStates();
      });
      searchInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        const firstMatch = mapItems.find((item) => passesFilter(item));
        if (firstMatch) {
          routeBuilt = false;
          selectService(firstMatch, { zoom: 16, duration: 0.85 });
          searchInput.blur();
        } else {
          showMapToast("Ничего не найдено — попробуйте другое название");
        }
      });
    }

    const sheet = root.querySelector(".dx-map-bottom-sheet");
    sheet.addEventListener("touchstart", (event) => {
      startY = event.touches?.[0]?.clientY || 0;
    }, { passive: true });

    sheet.addEventListener("touchend", (event) => {
      const endY = event.changedTouches?.[0]?.clientY || 0;
      const delta = endY - startY;
      if (Math.abs(delta) < 32) return;
      if (delta < 0 && activeServiceId) {
        sheetExpanded = true;
        const service = mapItems.find((item) => item.id === activeServiceId);
        renderSheet(root, service, true);
      } else if (delta > 0) {
        closeSheet();
      }
    }, { passive: true });

    return {
      destroy() {
        destroyed = true;
        if (routeLine) map.removeLayer(routeLine);
        if (satelliteLayer && satelliteOn) map.removeLayer(satelliteLayer);
        if (addPlaceController && typeof addPlaceController.destroy === "function") addPlaceController.destroy();
        if (geoWatchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(geoWatchId);
        map.removeLayer(userMarker);
        if (accuracyCircle) map.removeLayer(accuracyCircle);
        map.off("move zoom zoomend moveend", refreshUserPulsePosition);
        map.remove();
        container.innerHTML = "";
      }
    };
  }

  window.DrivexMapScreen = {
    mount
  };
})();
