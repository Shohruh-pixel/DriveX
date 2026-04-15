"use strict";

const { normalizeText } = require("../ai/ai.classifier");

const services = [
  {
    id: "svc-diagnostics-pro",
    title: "DriveX Diagnostics Pro",
    city: "Khujand",
    district: "Центр",
    coordinates: { lat: 40.2826, lng: 69.6222 },
    specialties: ["diagnostics", "engine", "electrics", "starter"],
    rating: 4.8,
    priceLevel: "medium",
    isOpen: true,
    tags: ["диагностика", "электрика", "стартер", "акб"]
  },
  {
    id: "svc-hodovaya-plus",
    title: "Hodovaya Plus",
    city: "Khujand",
    district: "18 мкр",
    coordinates: { lat: 40.289, lng: 69.609 },
    specialties: ["suspension", "steering", "brakes"],
    rating: 4.7,
    priceLevel: "medium",
    isOpen: true,
    tags: ["ходовая", "подвеска", "амортизатор", "сайлентблок", "тормоза"]
  },
  {
    id: "svc-oil-fast",
    title: "Oil Fast Service",
    city: "Khujand",
    district: "Исмоили Сомони",
    coordinates: { lat: 40.2841, lng: 69.631 },
    specialties: ["oil", "filters", "maintenance"],
    rating: 4.6,
    priceLevel: "low",
    isOpen: true,
    tags: ["масло", "фильтр", "то", "обслуживание"]
  },
  {
    id: "svc-tire-city",
    title: "Tire City",
    city: "Khujand",
    district: "Шелкокомбинат",
    coordinates: { lat: 40.276, lng: 69.644 },
    specialties: ["tires", "alignment", "wheels"],
    rating: 4.5,
    priceLevel: "low",
    isOpen: false,
    tags: ["шины", "шиномонтаж", "развал", "сход-развал"]
  },
  {
    id: "svc-brake-safe",
    title: "Brake Safe",
    city: "Khujand",
    district: "Панчшанбе",
    coordinates: { lat: 40.286, lng: 69.627 },
    specialties: ["brakes", "safety", "diagnostics"],
    rating: 4.9,
    priceLevel: "medium",
    isOpen: true,
    tags: ["тормоза", "колодки", "диски", "abs", "безопасность"]
  }
];

function scoreService(service, query, location) {
  const text = normalizeText(query);
  const serviceText = normalizeText([
    service.title,
    service.city,
    service.district,
    ...(service.specialties || []),
    ...(service.tags || [])
  ].join(" "));

  let score = 0;
  for (const token of text.split(" ").filter(Boolean)) {
    if (token.length > 2 && serviceText.includes(token)) score += 2;
  }

  if (location?.city && normalizeText(service.city) === normalizeText(location.city)) score += 3;
  if (service.isOpen) score += 1;
  score += service.rating / 10;

  return score;
}

function searchServices(query = "", location = {}, tags = []) {
  const tagQuery = [...tags, query].join(" ");
  return services
    .map((service) => ({ ...service, score: scoreService(service, tagQuery, location) }))
    .filter((service) => service.score > 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

module.exports = {
  searchServices,
  services
};
