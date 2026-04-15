(() => {
  function compute(history = []) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const safeHistory = Array.isArray(history) ? history : [];
    const totalSpent = safeHistory.reduce((sum, r) => sum + (Number(r.price) || 0), 0);
    const monthlySpent = safeHistory.reduce((sum, r) => {
      const d = r.date ? new Date(r.date) : null;
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        return sum + (Number(r.price) || 0);
      }
      return sum;
    }, 0);
    const yearlySpent = safeHistory.reduce((sum, r) => {
      const d = r.date ? new Date(r.date) : null;
      if (d && d.getFullYear() === year) {
        return sum + (Number(r.price) || 0);
      }
      return sum;
    }, 0);

    const avgServiceCost = safeHistory.length ? Math.round(totalSpent / safeHistory.length) : 0;

    const mostExpensiveService = safeHistory.reduce(
      (max, r) => {
        const price = Number(r.price) || 0;
        if (price > (max.price || 0)) return { serviceName: r.serviceName || "Сервис", price };
        return max;
      },
      { serviceName: null, price: 0 }
    );

    const threshold = Math.max(15000, avgServiceCost * 2 || 0);
    const monthlyAboveAverage = monthlySpent > threshold;

    return { totalSpent, monthlySpent, yearlySpent, avgServiceCost, mostExpensiveService, monthlyAboveAverage };
  }

  window.DrivexAnalyticsEngine = { compute };
})();
