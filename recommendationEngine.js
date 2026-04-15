(() => {
  const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
  const SIXTY_DAYS_MS = 1000 * 60 * 60 * 24 * 60;

  function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function normalizeHistory(history = []) {
    return Array.isArray(history) ? history.filter(Boolean) : [];
  }

  function avgMileageDelta(history) {
    const withMileage = history
      .filter((r) => Number.isFinite(Number(r.mileage)))
      .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0));
    if (withMileage.length < 2) return null;
    const deltas = [];
    for (let i = 1; i < withMileage.length; i++) {
      const curr = Number(withMileage[i - 1].mileage);
      const prev = Number(withMileage[i].mileage);
      if (curr > prev) deltas.push(curr - prev);
    }
    if (!deltas.length) return null;
    return deltas.reduce((s, v) => s + v, 0) / deltas.length;
  }

  function mostUsedCategory(history) {
    const counts = history.reduce((acc, r) => {
      const key = (r.category || "").toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    let top = null;
    Object.entries(counts).forEach(([cat, count]) => {
      if (!top || count > top.count) top = { cat, count };
    });
    return top;
  }

  function getRecommendations(history, activeCarId, options = {}) {
    const currentMileage = Number(options.mileage) || 0;
    const safeHistory = normalizeHistory(history)
      .filter((r) => (activeCarId ? r.carId === activeCarId : true))
      .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0));

    const now = Date.now();
    const recs = [];

    const overdue = safeHistory.filter(
      (r) => Number.isFinite(Number(r.nextServiceAt)) && Number(r.mileage) >= Number(r.nextServiceAt)
    );
    overdue.forEach((r) =>
      recs.push({
        id: `rec-overdue-${r.id}`,
        carId: activeCarId || r.carId,
        title: r.serviceName || "Сервис",
        reason: "Обслуживание просрочено",
        priority: "high"
      })
    );

    const avgDelta = avgMileageDelta(safeHistory);
    const lastRecord = safeHistory[0];
    if (avgDelta && lastRecord && Number.isFinite(Number(lastRecord.mileage))) {
      const gap = currentMileage - Number(lastRecord.mileage);
      if (gap > avgDelta * 1.2) {
        recs.push({
          id: `rec-mileage-${lastRecord.id}`,
          carId: activeCarId || lastRecord.carId,
          title: "Плановое обслуживание",
          reason: `Пробег между визитами выше среднего (${Math.round(gap)} км)`,
          priority: "high"
        });
      }
    }

    const categoryTrend = mostUsedCategory(safeHistory);
    if (categoryTrend && categoryTrend.count >= 2) {
      recs.push({
        id: `rec-category-${categoryTrend.cat}`,
        carId: activeCarId || safeHistory[0]?.carId || "",
        title: "Подбор сервиса",
        reason: `Часто обращаетесь: ${categoryTrend.cat}`,
        priority: "medium"
      });
    }

    const lastServiceDate = toDate(safeHistory[0]?.date);
    if (!lastServiceDate || now - lastServiceDate.getTime() > SIXTY_DAYS_MS) {
      recs.push({
        id: `rec-inspect-${activeCarId || "any"}`,
        carId: activeCarId || "",
        title: "Общий осмотр",
        reason: "Не было визитов 60 дней — рекомендуем диагностику",
        priority: "medium"
      });
    }

    const lastTire = safeHistory.find((r) => /шином|шины|резин/i.test(r.serviceName || ""));
    if (lastTire) {
      const targetDate = new Date((toDate(lastTire.date)?.getTime() || now) + SIX_MONTHS_MS);
      recs.push({
        id: `rec-tire-${lastTire.id}`,
        carId: activeCarId || lastTire.carId,
        title: "Шиномонтаж",
        reason: `Запланируйте через 6 месяцев (${targetDate.toISOString().slice(0, 10)})`,
        priority: "low"
      });
    }

    return recs;
  }

  window.DrivexRecommendationEngine = {
    getRecommendations
  };
})();
