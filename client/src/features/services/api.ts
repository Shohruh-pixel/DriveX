import { fetchServiceCenters } from "@features/partner-crm/api";
export { fetchServiceCenters };

export const SERVICE_CATEGORIES = [
  { id: "all",         label: "Все",         emoji: "🏪" },
  { id: "СТО",         label: "СТО",         emoji: "🔧" },
  { id: "Шиномонтаж",  label: "Шиномонтаж",  emoji: "⭕" },
  { id: "Автомойка",   label: "Автомойка",   emoji: "💧" },
  { id: "Детейлинг",   label: "Детейлинг",   emoji: "✨" },
  { id: "Диагностика", label: "Диагностика", emoji: "🔍" },
  { id: "Эвакуатор",   label: "Эвакуатор",  emoji: "🚛" },
];
