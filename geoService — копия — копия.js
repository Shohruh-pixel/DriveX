(() => {
  const mockServices = [
    { id: "geo-1", name: "СТО Премиум", distance: 1.2, rating: 4.8, price: "₽₽₽" },
    { id: "geo-2", name: "Шиномонтаж 24/7", distance: 0.9, rating: 4.7, price: "₽₽" },
    { id: "geo-3", name: "Диагностика+", distance: 2.4, rating: 4.9, price: "₽₽₽" },
    { id: "geo-4", name: "Экспресс масло", distance: 1.8, rating: 4.6, price: "₽₽" },
    { id: "geo-5", name: "Автоэлектрик", distance: 3.1, rating: 4.5, price: "₽₽" }
  ];

  function getTopNearbyServices() {
    return [...mockServices]
      .sort((a, b) => a.distance - b.distance || b.rating - a.rating)
      .slice(0, 3);
  }

  window.DrivexGeoService = { getTopNearbyServices };
})();
