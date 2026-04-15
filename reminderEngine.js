(() => {
  const SIXTY_DAYS_MS = 1000 * 60 * 60 * 24 * 60;
  const FIVE_DAYS_MS = 1000 * 60 * 60 * 24 * 5;

  function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function getReminders({ history = [], inspection, mileage = 0, today = new Date() } = {}) {
    const now = today instanceof Date ? today : new Date(today);
    const reminders = [];
    const sorted = Array.isArray(history)
      ? [...history].sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0))
      : [];

    const lastOil = sorted.find((r) => /масл/i.test(r.serviceName || ""));
    if (lastOil && Number.isFinite(Number(lastOil.mileage))) {
      const nextAt = Number(lastOil.mileage) + 8000;
      if (Number(mileage) >= nextAt) {
        reminders.push({
          id: `rem-oil-${lastOil.id}`,
          title: "Пора менять масло",
          reason: `С пробега ${nextAt.toLocaleString("ru-RU")} км`,
          priority: "high",
          serviceName: "Замена масла"
        });
      }
    }

    if (inspection?.validUntil) {
      const inspectionDate = toDate(inspection.validUntil);
      if (inspectionDate && inspectionDate.getTime() - now.getTime() <= FIVE_DAYS_MS) {
        reminders.push({
          id: "rem-inspection",
          title: "Техосмотр скоро закончится",
          reason: `До ${inspection.validUntil}`,
          priority: "medium",
          serviceName: "Техосмотр"
        });
      }
    }

    const lastServiceDate = toDate(sorted[0]?.date);
    if (!lastServiceDate || now.getTime() - lastServiceDate.getTime() > SIXTY_DAYS_MS) {
      reminders.push({
        id: "rem-inactive",
        title: "Рекомендуем пройти диагностику",
        reason: "Не было визитов 60 дней",
        priority: "medium",
        serviceName: "Диагностика"
      });
    }

    return reminders;
  }

  window.DrivexReminderEngine = { getReminders };
})();
