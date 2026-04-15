(() => {
  const KEY = "servicePartners";

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
    return `partner-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function getPartners() {
    return read();
  }

  function createPartner(partner) {
    const list = read();
    const next = {
      id: partner.id || genId(),
      name: partner.name || "Новый сервис",
      category: partner.category || "СТО",
      description: partner.description || "",
      address: partner.address || "",
      phone: partner.phone || "",
      location: partner.location || { lat: 0, lng: 0 },
      rating: Number(partner.rating) || 5,
      reviewCount: Number(partner.reviewCount) || 0,
      priceLevel: Number(partner.priceLevel) || 2,
      services: Array.isArray(partner.services) ? partner.services : [],
      ownerId: partner.ownerId || "",
      createdAt: partner.createdAt || new Date().toISOString()
    };
    write([next, ...list.filter((p) => p.id !== next.id)]);
    return next;
  }

  function updatePartner(id, patch) {
    const list = read();
    const updated = [];
    let target = null;
    for (const p of list) {
      if (p.id === id) {
        target = { ...p, ...patch };
        updated.push(target);
      } else {
        updated.push(p);
      }
    }
    if (target) write(updated);
    return target;
  }

  function addService(id, service) {
    const partner = getPartners().find((p) => p.id === id);
    if (!partner) return null;
    const services = Array.isArray(partner.services) ? partner.services : [];
    const enriched = {
      id: service.id || `svc-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      name: service.name || "Услуга",
      price: Number(service.price) || 0,
      duration: service.duration || "60 мин"
    };
    return updatePartner(id, { services: [enriched, ...services.filter((s) => s.id !== enriched.id)] });
  }

  function saveReview(id, ratingDelta, reviewIncrement = 1) {
    const partner = getPartners().find((p) => p.id === id);
    if (!partner) return null;
    const totalRating = partner.rating * partner.reviewCount + ratingDelta;
    const newCount = partner.reviewCount + reviewIncrement;
    const newRating = newCount ? Math.min(5, Math.max(1, totalRating / newCount)) : partner.rating;
    return updatePartner(id, { rating: Number(newRating.toFixed(2)), reviewCount: newCount });
  }

  window.DrivexPartnerService = {
    getPartners,
    createPartner,
    updatePartner,
    addService,
    saveReview
  };
})();
