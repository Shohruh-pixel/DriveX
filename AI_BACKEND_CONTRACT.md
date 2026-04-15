# DriveX AI Assistant Backend Contract

Frontend adapter expects a protected backend endpoint:

```http
POST /api/ai/assistant
Content-Type: application/json
```

Request body:

```json
{
  "message": "машина не заводится утром",
  "scenario": "diagnostic",
  "vehicle": {
    "make": "BMW",
    "model": "X5",
    "year": 2020,
    "mileage": 54200,
    "fuelType": ""
  },
  "location": {
    "city": "Худжанд",
    "district": "",
    "coordinates": null
  },
  "locale": "ru-RU",
  "serviceHistorySummary": "2026-03-10: Замена масла",
  "prompt": {
    "system": "Prompt template from frontend adapter",
    "user": {}
  }
}
```

Expected response:

```json
{
  "title": "Проблема с запуском",
  "summary": "По описанию это может быть связано с системой запуска или питанием.",
  "causes": ["слабый аккумулятор", "свечи зажигания", "стартер"],
  "actions": ["проверить заряд аккумулятора", "не перегружать стартер", "сделать диагностику"],
  "urgency": "medium",
  "recommendation": "Показать ближайшие сервисы по диагностике",
  "cta": [
    { "type": "find_service", "label": "Найти сервис" },
    { "type": "map", "label": "Показать на карте" },
    { "type": "save", "label": "Сохранить" }
  ]
}
```

Notes:

- API keys must stay server-side only.
- The server should return structured JSON. If it returns plain text, frontend mapper will try to parse it and then fallback safely.
- Valid scenarios: `diagnostic`, `explain_service`, `maintenance`, `find_service`.
- Valid urgency values: `low`, `medium`, `high`.
- For dangerous symptoms like brakes, overheating, burning smell, or heavy smoke, return `urgency: "high"`.
