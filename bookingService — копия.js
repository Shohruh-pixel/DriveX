(() => {
  const KEY = "serviceBookings";

  function read() {
    if (typeof window === "undefined" || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function write(list) {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  function genId() {
    return `booking-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function createBooking(data) {
    const list = read();
    const booking = {
      id: data.id || genId(),
      userId: data.userId || "",
      partnerId: data.partnerId || "",
      carId: data.carId || "",
      serviceName: data.serviceName || "Сервис",
      date: data.date || new Date().toISOString().slice(0, 10),
      time: data.time || "10:00",
      price: Number(data.price) || 0,
      status: data.status || "pending",
      commission: Number(data.commission) || Math.round((Number(data.price) || 0) * 0.05),
      createdAt: data.createdAt || new Date().toISOString(),
      rating: data.rating || null,
      comment: data.comment || ""
    };
    write([booking, ...list]);
    return booking;
  }

  function updateBookingStatus(id, status) {
    const list = read();
    const next = [];
    let updated = null;
    for (const b of list) {
      if (b.id === id) {
        updated = { ...b, status };
        next.push(updated);
      } else {
        next.push(b);
      }
    }
    if (updated) write(next);
    return updated;
  }

  function saveReview(id, rating, comment) {
    const list = read();
    const next = [];
    let updated = null;
    for (const b of list) {
      if (b.id === id) {
        updated = { ...b, rating, comment };
        next.push(updated);
      } else next.push(b);
    }
    if (updated) write(next);
    return updated;
  }

  function getBookings() {
    return read();
  }

  function getByPartner(partnerId) {
    return read().filter((b) => b.partnerId === partnerId);
  }

  function getByUser(userId) {
    return read().filter((b) => b.userId === userId);
  }

  function analytics() {
    const list = read();
    const totalBookings = list.length;
    const totalRevenue = list.reduce((s, b) => s + (Number(b.price) || 0), 0);
    const totalCommission = list.reduce((s, b) => s + (Number(b.commission) || 0), 0);
    return { totalBookings, totalRevenue, totalCommission };
  }

  window.DrivexBookingService = {
    createBooking,
    updateBookingStatus,
    saveReview,
    getBookings,
    getByPartner,
    getByUser,
    analytics
  };
})();
