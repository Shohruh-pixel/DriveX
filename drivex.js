(() => {
  const state = {
    cartCount: 3,
    fuelLevel: 65,
    notificationsCount: 3
  };

  const quickActions = [
    {
      icon: "wrench",
      label: "Ремонт",
      path: "/services",
      color: "var(--drivex-electric-blue)"
    },
    {
      icon: "car",
      label: "Мой гараж",
      path: "/garage",
      color: "var(--drivex-neon-cyan)"
    },
    {
      icon: "sos",
      label: "SOS помощь",
      path: "/emergency",
      color: "var(--drivex-danger)"
    },
    {
      icon: "bot",
      label: "AI помощник",
      path: "/ai-assistant",
      color: "var(--drivex-warning)"
    }
  ];

  const nearbyServices = [
    {
      id: 1,
      name: "АвтоСервис Премиум",
      type: "СТО",
      distance: "1.2 км",
      rating: 4.8,
      price: "₽₽₽",
      available: true
    },
    {
      id: 2,
      name: "ШиноМонтаж 24/7",
      type: "Шиномонтаж",
      distance: "0.8 км",
      rating: 4.9,
      price: "₽₽",
      available: true
    },
    {
      id: 3,
      name: "Мойка Люкс",
      type: "Автомойка",
      distance: "2.1 км",
      rating: 4.7,
      price: "₽₽",
      available: true
    }
  ];

  const reminders = [
    { task: "Замена масла", dueDate: "через 15 дней", urgent: false },
    { task: "Техосмотр", dueDate: "через 30 дней", urgent: false }
  ];

  const mapFilters = [
    { id: "all", label: "Все", icon: "layers" },
    { id: "fuel", label: "АЗС", icon: "fuel" },
    { id: "wash", label: "Мойки", icon: "wash" },
    { id: "service", label: "СТО", icon: "wrench" },
    { id: "tire", label: "Шины", icon: "tire" },
    { id: "parking", label: "Парковки", icon: "parking" }
  ];

  const mapPoints = [
    { id: 1, type: "fuel", name: "Роснефть", distance: "500 м", rating: 4.5 },
    { id: 2, type: "wash", name: "Мойка 24/7", distance: "1.2 км", rating: 4.8 },
    { id: 3, type: "service", name: "СТО Премиум", distance: "2.3 км", rating: 4.9 },
    { id: 4, type: "tire", name: "ШиноМонтаж", distance: "800 м", rating: 4.7 }
  ];

  const serviceCategories = [
    {
      id: "repair",
      name: "Ремонт авто",
      icon: "wrench",
      color: "var(--drivex-electric-blue)",
      count: "156 сервисов"
    },
    {
      id: "tire",
      name: "Шиномонтаж",
      icon: "tire",
      color: "var(--drivex-neon-cyan)",
      count: "89 сервисов"
    },
    {
      id: "wash",
      name: "Автомойка",
      icon: "wash",
      color: "#06b6d4",
      count: "203 сервиса"
    },
    {
      id: "diagnostics",
      name: "Диагностика",
      icon: "scan",
      color: "#f59e0b",
      count: "78 сервисов"
    },
    {
      id: "towing",
      name: "Эвакуатор",
      icon: "truck",
      color: "#ef4444",
      count: "45 сервисов"
    },
    {
      id: "detailing",
      name: "Детейлинг",
      icon: "sparkles",
      color: "#8b5cf6",
      count: "34 сервиса"
    }
  ];

  const recommendedServices = [
    {
      id: 1,
      name: "АвтоМастер Премиум",
      category: "СТО",
      rating: 4.9,
      reviews: 234,
      distance: "1.2 км",
      price: "₽₽₽",
      image:
        "https://images.unsplash.com/photo-1727413434026-0f8314c037d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      available: true
    },
    {
      id: 2,
      name: "ШиноМонтаж 24/7",
      category: "Шиномонтаж",
      rating: 4.8,
      reviews: 167,
      distance: "800 м",
      price: "₽₽",
      image:
        "https://images.unsplash.com/photo-1673870861524-64d3d07141e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      available: true
    },
    {
      id: 3,
      name: "Мойка Люкс",
      category: "Автомойка",
      rating: 4.7,
      reviews: 445,
      distance: "2.1 км",
      price: "₽₽",
      image:
        "https://images.unsplash.com/photo-1589193910236-3d9d9f3f4042?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      available: false
    }
  ];

  const marketCategories = [
    { id: "tires", name: "Шины", icon: "🛞" },
    { id: "oil", name: "Масла", icon: "🛢️" },
    { id: "battery", name: "АКБ", icon: "🔋" },
    { id: "parts", name: "Запчасти", icon: "⚙️" },
    { id: "accessories", name: "Аксессуары", icon: "✨" },
    { id: "tools", name: "Инструмент", icon: "🔧" }
  ];

  const products = [
    {
      id: 1,
      name: "Michelin Pilot Sport 4",
      category: "Шины",
      price: 15990,
      oldPrice: 18990,
      rating: 4.9,
      reviews: 156,
      image:
        "https://images.unsplash.com/photo-1583669133836-cd63ad24c04a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      inStock: true,
      delivery: "Завтра",
      badge: "Хит продаж"
    },
    {
      id: 2,
      name: "Shell Helix Ultra 5W-40",
      category: "Моторное масло",
      price: 2890,
      oldPrice: null,
      rating: 4.8,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1567016958860-87d898933af1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      inStock: true,
      delivery: "Сегодня",
      badge: null
    },
    {
      id: 3,
      name: "Bosch S5 95Ah",
      category: "Аккумулятор",
      price: 12490,
      oldPrice: 14990,
      rating: 4.9,
      reviews: 234,
      image:
        "https://images.unsplash.com/photo-1677595676320-f82eea08c2aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      inStock: true,
      delivery: "Завтра",
      badge: "Скидка -17%"
    },
    {
      id: 4,
      name: "Комплект тормозных колодок",
      category: "Запчасти",
      price: 4590,
      oldPrice: null,
      rating: 4.7,
      reviews: 67,
      image:
        "https://images.unsplash.com/photo-1593776534629-6b0213f0e05f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      inStock: true,
      delivery: "2–3 дня",
      badge: null
    }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("ru-RU").format(price);
  }

  function getPathFromHash() {
    const raw = (window.location.hash || "").replace(/^#/, "");
    const path = raw.split("?")[0].trim();
    if (!path) return "/";
    return path.startsWith("/") ? path : `/${path}`;
  }

  function setNavActive(navPath) {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const isActive = link.getAttribute("data-nav") === navPath;
      link.dataset.active = isActive ? "true" : "false";
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  function icon(name, size = 24) {
    const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
    switch (name) {
      case "home":
        return `<svg ${common}><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 10v10h14V10"></path></svg>`;
      case "map":
        return `<svg ${common}><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"></path><path d="M9 3v15"></path><path d="M15 6v15"></path></svg>`;
      case "wrench":
        return `<svg ${common}><path d="M14.7 6.3a5 5 0 0 1-6.4 6.4L4 17l3 3 4.3-4.3a5 5 0 0 1 6.4-6.4l-3 3 2 2 3-3Z"></path></svg>`;
      case "bag":
        return `<svg ${common}><path d="M6 7h12l-1 14H7L6 7Z"></path><path d="M9 7a3 3 0 0 1 6 0"></path></svg>`;
      case "user":
        return `<svg ${common}><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>`;
      case "bell":
        return `<svg ${common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path><path d="M13.7 21a2 2 0 0 1-3.4 0"></path></svg>`;
      case "fuel":
        return `<svg ${common}><path d="M3 3h10v18H3z"></path><path d="M13 7h2l3 3v10a2 2 0 0 1-2 2h-3"></path><path d="M6 7h4"></path></svg>`;
      case "car":
        return `<svg ${common}><path d="M3 14l1-4a4 4 0 0 1 4-3h8a4 4 0 0 1 4 3l1 4"></path><path d="M5 14v4"></path><path d="M19 14v4"></path><circle cx="7" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle></svg>`;
      case "sos":
        return `<svg ${common}><path d="M12 2 2 22h20L12 2Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
      case "bot":
        return `<svg ${common}><path d="M12 8V4"></path><rect x="5" y="8" width="14" height="12" rx="3"></rect><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M9 16h6"></path></svg>`;
      case "search":
        return `<svg ${common}><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>`;
      case "filter":
        return `<svg ${common}><path d="M4 6h16"></path><path d="M7 12h10"></path><path d="M10 18h4"></path></svg>`;
      case "layers":
        return `<svg ${common}><path d="M12 2 2 7l10 5 10-5-10-5Z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`;
      case "wash":
        return `<svg ${common}><path d="M7 3h10"></path><path d="M9 3v4"></path><path d="M15 3v4"></path><path d="M6 7h12l-1 14H7L6 7Z"></path></svg>`;
      case "tire":
        return `<svg ${common}><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 3v2"></path><path d="M12 19v2"></path><path d="M3 12h2"></path><path d="M19 12h2"></path></svg>`;
      case "parking":
        return `<svg ${common}><path d="M8 3h6a4 4 0 0 1 0 8H8z"></path><path d="M8 11v10"></path></svg>`;
      case "crosshair":
        return `<svg ${common}><circle cx="12" cy="12" r="7"></circle><path d="M12 3v2"></path><path d="M12 19v2"></path><path d="M3 12h2"></path><path d="M19 12h2"></path></svg>`;
      case "star":
        return `<svg ${common} fill="currentColor" stroke="none"><path d="M12 17.3 6.8 20l1-5.9L3 9.8l6-.7L12 3.6l3 5.5 6 .7-4.8 4.3 1 5.9z"></path></svg>`;
      case "chevron-left":
        return `<svg ${common}><path d="M15 18 9 12l6-6"></path></svg>`;
      case "truck":
        return `<svg ${common}><path d="M3 7h11v10H3z"></path><path d="M14 10h4l3 3v4h-7z"></path><circle cx="7" cy="17" r="2"></circle><circle cx="18" cy="17" r="2"></circle></svg>`;
      case "scan":
        return `<svg ${common}><path d="M4 7V4h3"></path><path d="M17 4h3v3"></path><path d="M20 17v3h-3"></path><path d="M7 20H4v-3"></path><path d="M7 12h10"></path></svg>`;
      case "sparkles":
        return `<svg ${common}><path d="M12 2l1.5 5L19 9l-5.5 2L12 16l-1.5-5L5 9l5.5-2L12 2Z"></path></svg>`;
      default:
        return `<svg ${common}><circle cx="12" cy="12" r="10"></circle></svg>`;
    }
  }

  function routeLink(path) {
    return `#${path}`;
  }

  function toast(message) {
    const host = document.getElementById("toast");
    if (!host) return;

    const id = `t${Date.now()}`;
    host.insertAdjacentHTML(
      "beforeend",
      `
      <div id="${id}" class="mx-3 mb-3 glass-card rounded-2xl p-4 neon-glow-cyan">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(6, 182, 212, 0.2); color: var(--drivex-neon-cyan)">
            ${icon("star", 18)}
          </div>
          <p class="text-sm" style="color: var(--drivex-white)">${escapeHtml(message)}</p>
        </div>
      </div>
    `.trim()
    );

    window.setTimeout(() => {
      const node = document.getElementById(id);
      if (node) node.remove();
    }, 2200);
  }

  function backHeader({ title, backPath }) {
    return `
      <div class="pt-12 pb-6 px-6" style="background: var(--drivex-graphite)">
        <div class="flex items-center gap-3 mb-6">
          <a href="${routeLink(
            backPath
          )}" class="p-2 rounded-xl glass-card-light" style="color: var(--drivex-neon-cyan)" aria-label="Назад">
            ${icon("chevron-left", 24)}
          </a>
          <h1 class="text-2xl font-bold" style="color: var(--drivex-white)">${escapeHtml(
            title
          )}</h1>
        </div>
      </div>
    `.trim();
  }

  function renderDashboard() {
    const notificationsButton = `
      <a href="${routeLink(
        "/notifications"
      )}" class="relative p-3 rounded-xl glass-card-light" aria-label="Уведомления">
        <span style="color: var(--drivex-white)">${icon("bell", 24)}</span>
        ${
          state.notificationsCount > 0
            ? `<span class="absolute top-2 right-2 w-2 h-2 rounded-full" style="background: var(--drivex-danger)"></span>`
            : ""
        }
      </a>
    `.trim();

    const fuelCard = `
      <div class="glass-card rounded-3xl p-6 neon-glow-blue">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-xl" style="background: var(--gradient-primary)">
              <span style="color: var(--drivex-white)">${icon("fuel", 24)}</span>
            </div>
            <div>
              <p class="text-sm" style="color: var(--drivex-silver)">Уровень топлива</p>
              <p class="text-2xl font-bold" style="color: var(--drivex-white)">${state.fuelLevel}%</p>
            </div>
          </div>
          <a href="${routeLink(
            "/map"
          )}" class="px-4 py-2 rounded-xl text-sm font-medium transition-all dx-btn">Заправки</a>
        </div>
        <div class="h-2 rounded-full overflow-hidden" style="background: rgba(148, 163, 184, 0.2)">
          <div class="h-full rounded-full" style="width: ${state.fuelLevel}%; background: var(--gradient-primary)"></div>
        </div>
      </div>
    `.trim();

    const quickActionsGrid = `
      <div class="px-6 py-6">
        <h2 class="text-xl font-bold mb-4" style="color: var(--drivex-white)">Быстрые действия</h2>
        <div class="grid grid-cols-2 gap-4">
          ${quickActions
            .map(
              (action) => `
                <a href="${routeLink(
                  action.path
                )}" class="glass-card-light rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105">
                  <div class="p-4 rounded-xl" style="background: ${action.color}20; color: ${action.color}">
                    ${icon(action.icon, 28)}
                  </div>
                  <span class="text-sm font-medium text-center" style="color: var(--drivex-white)">${escapeHtml(
                    action.label
                  )}</span>
                </a>
              `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();

    const nearbyList = `
      <div class="px-6 py-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold" style="color: var(--drivex-white)">Рядом с вами</h2>
          <a href="${routeLink(
            "/map"
          )}" class="text-sm font-medium" style="color: var(--drivex-neon-cyan)">Показать на карте</a>
        </div>

        <div class="space-y-3">
          ${nearbyServices
            .map(
              (service) => `
              <a href="${routeLink(
                `/service/${service.id}`
              )}" class="glass-card-light rounded-2xl p-4 flex items-center gap-4 transition-all hover:scale-[1.02]">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: var(--gradient-primary)">
                  <span style="color: var(--drivex-white)">${icon("wrench", 24)}</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold mb-1" style="color: var(--drivex-white)">${escapeHtml(
                    service.name
                  )}</h3>
                  <div class="flex items-center gap-3 text-xs">
                    <span style="color: var(--drivex-silver)">${escapeHtml(
                      service.type
                    )}</span>
                    <span class="flex items-center gap-1" style="color: var(--drivex-warning)">
                      ${icon("star", 12)} ${service.rating}
                    </span>
                    <span style="color: var(--drivex-silver)">${escapeHtml(
                      service.distance
                    )}</span>
                  </div>
                </div>
                <div class="px-3 py-1 rounded-lg text-xs font-medium" style="background: rgba(16, 185, 129, 0.2); color: var(--drivex-success)">
                  Открыто
                </div>
              </a>
            `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();

    const remindersList = `
      <div class="px-6 py-6 pb-24">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold" style="color: var(--drivex-white)">Напоминания</h2>
          <a href="${routeLink(
            "/smart-care"
          )}" class="text-sm font-medium" style="color: var(--drivex-neon-cyan)">Все задачи</a>
        </div>
        <div class="space-y-3">
          ${reminders
            .map(
              (reminder) => `
              <div class="glass-card-light rounded-2xl p-4 flex items-center gap-4">
                <div class="p-3 rounded-xl" style="background: rgba(14, 165, 233, 0.2)">
                  <span style="color: var(--drivex-electric-blue)">${icon(
                    "scan",
                    20
                  )}</span>
                </div>
                <div class="flex-1">
                  <h3 class="font-medium mb-1" style="color: var(--drivex-white)">${escapeHtml(
                    reminder.task
                  )}</h3>
                  <p class="text-sm" style="color: var(--drivex-silver)">${escapeHtml(
                    reminder.dueDate
                  )}</p>
                </div>
              </div>
            `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();

    return `
      <div class="min-h-screen" style="background: var(--drivex-black)">
        <div class="relative pt-12 pb-8 px-6 overflow-hidden" style="background: var(--gradient-dark)">
          <div class="absolute inset-0 opacity-20">
            <div class="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style="background: var(--drivex-electric-blue)"></div>
          </div>
          <div class="relative z-10">
            <div class="flex items-center justify-between mb-8">
              <div>
                <h1 class="text-3xl font-bold mb-1 text-glow-cyan" style="color: var(--drivex-white)">DRIVEX</h1>
                <p class="text-sm" style="color: var(--drivex-silver)">Добро пожаловать, Водитель</p>
              </div>
              ${notificationsButton}
            </div>
            ${fuelCard}
          </div>
        </div>

        ${quickActionsGrid}
        ${nearbyList}
        ${remindersList}
      </div>
    `.trim();
  }

  function renderMap() {
    const chips = mapFilters
      .map(
        (f) => `
        <button class="dx-chip flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm font-medium"
          data-filter="${escapeHtml(f.id)}"
          style="background: var(--glass-bg); color: var(--drivex-silver); border: 1px solid var(--glass-border)"
        >
          ${icon(f.icon, 16)} ${escapeHtml(f.label)}
        </button>
      `.trim()
      )
      .join("");

    const markers = mapPoints
      .map((p, idx) => {
        const left = 20 + idx * 20;
        const top = 30 + idx * 10;
        return `
          <div class="absolute" style="left: ${left}%; top: ${top}%">
            <div class="relative">
              <a href="${routeLink(
                `/service/${p.id}`
              )}" class="w-12 h-12 rounded-full flex items-center justify-center neon-glow-cyan cursor-pointer"
                style="background: var(--gradient-primary); color: var(--drivex-white)"
                aria-label="${escapeHtml(p.name)}"
              >
                ${icon(
                  p.type === "service"
                    ? "wrench"
                    : p.type === "wash"
                      ? "wash"
                      : p.type === "tire"
                        ? "tire"
                        : "fuel",
                  20
                )}
              </a>
              <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4" style="background: var(--drivex-neon-cyan)"></div>
            </div>
          </div>
        `.trim();
      })
      .join("");

    const bottomCards = mapPoints
      .map(
        (p) => `
        <a href="${routeLink(
          `/service/${p.id}`
        )}" class="glass-card rounded-2xl p-4 min-w-[280px] neon-glow-blue">
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: var(--gradient-primary); color: var(--drivex-white)">
              ${icon(
                p.type === "service"
                  ? "wrench"
                  : p.type === "wash"
                    ? "wash"
                    : p.type === "tire"
                      ? "tire"
                      : "fuel",
                20
              )}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold mb-1" style="color: var(--drivex-white)">${escapeHtml(
                p.name
              )}</h3>
              <div class="flex items-center gap-3 text-xs mb-2">
                <span class="flex items-center gap-1" style="color: var(--drivex-warning)">
                  ${icon("star", 12)} ${p.rating}
                </span>
                <span style="color: var(--drivex-silver)">${escapeHtml(
                  p.distance
                )}</span>
              </div>
              <button class="px-4 py-2 rounded-lg text-xs font-medium dx-btn" data-toast="Маршрут построен (демо)">
                Показать маршрут
              </button>
            </div>
          </div>
        </a>
      `.trim()
      )
      .join("");

    return `
      <div class="h-screen flex flex-col" style="background: var(--drivex-black)">
        <div class="relative z-20 p-4" style="background: var(--drivex-graphite)">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex-1 relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--drivex-silver)">${icon(
                "search",
                20
              )}</span>
              <input class="w-full pl-12 pr-4 py-3 rounded-xl glass-card-light text-sm outline-none dx-input" placeholder="Поиск сервисов на карте..." />
            </div>
            <button class="p-3 rounded-xl glass-card-light" style="color: var(--drivex-neon-cyan)" data-toast="Фильтры (демо)">
              ${icon("filter", 20)}
            </button>
          </div>

          <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar" data-map-filters>
            ${chips}
          </div>
        </div>

        <div class="flex-1 relative">
          <div class="absolute inset-0"
            style="
              background: linear-gradient(135deg, var(--drivex-graphite), var(--drivex-dark-gray));
              background-image:
                repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.05) 0px, transparent 1px, transparent 50px, rgba(148, 163, 184, 0.05) 51px),
                repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.05) 0px, transparent 1px, transparent 50px, rgba(148, 163, 184, 0.05) 51px);
            "
          >
            ${markers}
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div class="w-16 h-16 rounded-full flex items-center justify-center"
                style="background: rgba(14, 165, 233, 0.2); border: 3px solid var(--drivex-electric-blue)"
              >
                <div class="w-4 h-4 rounded-full" style="background: var(--drivex-electric-blue)"></div>
              </div>
            </div>
          </div>

          <button class="absolute right-4 top-4 p-4 rounded-xl glass-card neon-glow-blue z-10"
            style="color: var(--drivex-neon-cyan)"
            data-toast="Геолокация (демо)"
            aria-label="Моё местоположение"
          >
            ${icon("crosshair", 24)}
          </button>

          <div class="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              ${bottomCards}
            </div>
          </div>
        </div>
      </div>
    `.trim();
  }

  function renderServices() {
    const categories = `
      <div class="px-6 py-6">
        <h2 class="text-xl font-bold mb-4" style="color: var(--drivex-white)">Категории услуг</h2>
        <div class="grid grid-cols-2 gap-4">
          ${serviceCategories
            .map(
              (c) => `
                <a href="${routeLink(
                  `/category/${c.id}`
                )}" class="glass-card-light rounded-2xl p-5 flex flex-col gap-3 transition-all hover:scale-105">
                  <div class="w-14 h-14 rounded-xl flex items-center justify-center" style="background: ${c.color}20; color: ${c.color}">
                    ${icon(c.icon, 28)}
                  </div>
                  <div>
                    <h3 class="font-semibold mb-1" style="color: var(--drivex-white)">${escapeHtml(
                      c.name
                    )}</h3>
                    <p class="text-xs" style="color: var(--drivex-silver)">${escapeHtml(
                      c.count
                    )}</p>
                  </div>
                </a>
              `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();

    const recommended = `
      <div class="px-6 py-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold" style="color: var(--drivex-white)">Рекомендуем</h2>
          <a href="${routeLink(
            "/map"
          )}" class="text-sm font-medium" style="color: var(--drivex-neon-cyan)">На карте</a>
        </div>

        <div class="space-y-4">
          ${recommendedServices
            .map(
              (s) => `
              <a href="${routeLink(
                `/service/${s.id}`
              )}" class="glass-card-light rounded-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.02]">
                <div class="relative h-40 overflow-hidden">
                  <img src="${escapeHtml(s.image)}" alt="${escapeHtml(
                s.name
              )}" class="w-full h-full object-cover" />
                  <div class="absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-md"
                    style="background: ${
                      s.available ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)"
                    }; color: var(--drivex-white)"
                  >
                    ${s.available ? "Открыто" : "Закрыто"}
                  </div>
                </div>
                <div class="p-4">
                  <h3 class="font-bold text-lg mb-2" style="color: var(--drivex-white)">${escapeHtml(
                    s.name
                  )}</h3>
                  <div class="flex items-center gap-3 text-sm mb-3">
                    <span style="color: var(--drivex-silver)">${escapeHtml(
                      s.category
                    )}</span>
                    <span class="flex items-center gap-1" style="color: var(--drivex-warning)">
                      ${icon("star", 12)} ${s.rating}
                    </span>
                    <span style="color: var(--drivex-silver)">(${s.reviews})</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm" style="color: var(--drivex-silver)">${escapeHtml(
                      s.distance
                    )} • ${escapeHtml(s.price)}</span>
                    <button class="px-4 py-2 rounded-lg text-sm font-medium dx-btn" data-toast="Заявка отправлена (демо)">Записаться</button>
                  </div>
                </div>
              </a>
            `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();

    return `
      <div class="min-h-screen pb-24" style="background: var(--drivex-black)">
        <div class="pt-12 pb-6 px-6" style="background: var(--drivex-graphite)">
          <h1 class="text-3xl font-bold mb-6 text-glow-cyan" style="color: var(--drivex-white)">Автосервисы</h1>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--drivex-silver)">${icon(
              "search",
              20
            )}</span>
            <input class="w-full pl-12 pr-4 py-4 rounded-xl glass-card-light outline-none dx-input" placeholder="Поиск сервисов..." />
          </div>
        </div>

        ${categories}
        ${recommended}
      </div>
    `.trim();
  }

  function renderMarket() {
    const categoriesRow = `
      <div class="px-6 py-6">
        <div class="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          ${marketCategories
            .map(
              (c) => `
              <button class="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl glass-card-light whitespace-nowrap transition-all hover:scale-105" data-toast="Категория: ${escapeHtml(
                c.name
              )}">
                <span class="text-2xl">${escapeHtml(c.icon)}</span>
                <span class="text-xs font-medium" style="color: var(--drivex-white)">${escapeHtml(
                  c.name
                )}</span>
              </button>
            `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();

    const promo = `
      <div class="px-6 py-4">
        <div class="rounded-2xl p-6 relative overflow-hidden" style="background: var(--gradient-primary)">
          <div class="relative z-10">
            <h2 class="text-2xl font-bold mb-2" style="color: var(--drivex-white)">Весенняя распродажа</h2>
            <p class="text-sm mb-4" style="color: rgba(248, 250, 252, 0.85)">Скидки на масла, фильтры и расходники до 30%</p>
            <button class="px-4 py-2 rounded-xl text-sm font-medium" style="background: rgba(26, 26, 36, 0.35); color: var(--drivex-white)" data-toast="Промо-акция (демо)">
              Смотреть предложения
            </button>
          </div>
          <div class="absolute inset-0 opacity-20">
            <div class="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style="transform: translate(25%, -25%); background: rgba(248, 250, 252, 0.6)"></div>
          </div>
        </div>
      </div>
    `.trim();

    const grid = `
      <div class="px-6 py-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold" style="color: var(--drivex-white)">Популярные товары</h2>
          <button class="text-sm font-medium" style="color: var(--drivex-neon-cyan)" data-toast="Показать все (демо)">Все</button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          ${products
            .map((p) => {
              const badgeBg = p.badge?.includes("Скидка")
                ? "var(--drivex-danger)"
                : "var(--drivex-warning)";
              return `
                <a href="${routeLink(
                  `/product/${p.id}`
                )}" class="glass-card-light rounded-2xl overflow-hidden flex flex-col transition-all hover:scale-105">
                  <div class="relative">
                    <img src="${escapeHtml(p.image)}" alt="${escapeHtml(
                p.name
              )}" class="w-full h-40 object-cover" />
                    ${
                      p.badge
                        ? `<div class="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md" style="background: ${badgeBg}; color: var(--drivex-white)">${escapeHtml(
                            p.badge
                          )}</div>`
                        : ""
                    }
                  </div>
                  <div class="p-3 flex-1 flex flex-col">
                    <p class="text-xs mb-1" style="color: var(--drivex-silver)">${escapeHtml(
                      p.category
                    )}</p>
                    <h3 class="font-semibold text-sm mb-2 line-clamp-2 flex-1" style="color: var(--drivex-white)">${escapeHtml(
                      p.name
                    )}</h3>
                    <div class="flex items-center gap-1 text-xs mb-2">
                      <span style="color: var(--drivex-warning)">${icon(
                        "star",
                        12
                      )}</span>
                      <span style="color: var(--drivex-warning)">${p.rating}</span>
                      <span style="color: var(--drivex-silver)">(${p.reviews})</span>
                    </div>
                    <div class="mb-3">
                      <div class="flex items-baseline gap-2">
                        <span class="font-bold text-lg" style="color: var(--drivex-white)">${formatPrice(
                          p.price
                        )} ₽</span>
                        ${
                          p.oldPrice
                            ? `<span class="text-xs line-through" style="color: var(--drivex-silver)">${formatPrice(
                                p.oldPrice
                              )} ₽</span>`
                            : ""
                        }
                      </div>
                    </div>
                    <button class="px-3 py-2 rounded-xl text-xs font-bold dx-btn" data-add-to-cart="${
                      p.id
                    }">
                      В корзину
                    </button>
                  </div>
                </a>
              `.trim();
            })
            .join("")}
        </div>
      </div>
    `.trim();

    return `
      <div class="min-h-screen pb-24" style="background: var(--drivex-black)">
        <div class="pt-12 pb-6 px-6" style="background: var(--drivex-graphite)">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-3xl font-bold text-glow-cyan" style="color: var(--drivex-white)">Маркетплейс</h1>
            <a href="${routeLink(
              "/cart"
            )}" class="relative p-3 rounded-xl glass-card-light" aria-label="Корзина">
              <span style="color: var(--drivex-white)">${icon("bag", 24)}</span>
              ${
                state.cartCount > 0
                  ? `<span class="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style="background: var(--drivex-danger); color: var(--drivex-white)">${state.cartCount}</span>`
                  : ""
              }
            </a>
          </div>
          <div class="flex gap-3">
            <div class="flex-1 relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2" style="color: var(--drivex-silver)">${icon(
                "search",
                20
              )}</span>
              <input class="w-full pl-12 pr-4 py-4 rounded-xl glass-card-light outline-none dx-input" placeholder="Поиск товаров..." />
            </div>
            <button class="p-4 rounded-xl glass-card-light" style="color: var(--drivex-neon-cyan)" data-toast="Фильтры (демо)">
              ${icon("filter", 20)}
            </button>
          </div>
        </div>

        ${categoriesRow}
        ${promo}
        ${grid}
      </div>
    `.trim();
  }

  function renderProfile() {
    const stats = [
      { label: "Авто", value: "3", icon: "car" },
      { label: "Задач", value: String(reminders.length), icon: "scan" },
      { label: "Мест", value: "3", icon: "map" }
    ];

    const sections = [
      {
        title: "Мой автопарк",
        items: [
          { icon: "car", label: "Мои автомобили", path: "/garage", badge: "3" },
          { icon: "scan", label: "Умный уход", path: "/smart-care", badge: null }
        ]
      },
      {
        title: "Заказы и услуги",
        items: [
          { icon: "bag", label: "История заказов", path: "/orders", badge: null },
          { icon: "map", label: "История поездок", path: "/trips", badge: null },
          {
            icon: "map",
            label: "Сохранённые места",
            path: "/saved-locations",
            badge: "3"
          }
        ]
      },
      {
        title: "Настройки",
        items: [
          {
            icon: "bell",
            label: "Уведомления",
            path: "/notifications",
            badge: String(state.notificationsCount)
          },
          {
            icon: "user",
            label: "Профиль и безопасность",
            path: "/settings",
            badge: null
          },
          { icon: "wrench", label: "Помощь и поддержка", path: "/help", badge: null }
        ]
      }
    ];

    return `
      <div class="min-h-screen pb-24" style="background: var(--drivex-black)">
        <div class="relative pt-12 pb-8 px-6 overflow-hidden" style="background: var(--gradient-dark)">
          <div class="absolute inset-0 opacity-20">
            <div class="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl" style="background: var(--drivex-neon-cyan)"></div>
          </div>

          <div class="relative z-10">
            <div class="glass-card rounded-3xl p-6 neon-glow-cyan">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center" style="background: var(--gradient-primary); color: var(--drivex-white)">
                  ${icon("user", 40)}
                </div>
                <div class="flex-1">
                  <h2 class="text-2xl font-bold mb-1" style="color: var(--drivex-white)">Махкамов Шохрух</h2>
                  <p class="text-sm" style="color: var(--drivex-silver)">+992 92 712 5989</p>
                </div>
                <a href="${routeLink(
                  "/settings"
                )}" class="p-2 rounded-xl" style="color: var(--drivex-neon-cyan)" aria-label="Настройки">
                  ${icon("filter", 24)}
                </a>
              </div>

              <div class="grid grid-cols-3 gap-3">
                ${stats
                  .map(
                    (s) => `
                    <div class="glass-card-light rounded-xl p-3 text-center">
                      <div class="mx-auto mb-2" style="color: var(--drivex-neon-cyan)">${icon(
                        s.icon,
                        20
                      )}</div>
                      <p class="text-xl font-bold mb-1" style="color: var(--drivex-white)">${escapeHtml(
                        s.value
                      )}</p>
                      <p class="text-xs" style="color: var(--drivex-silver)">${escapeHtml(
                        s.label
                      )}</p>
                    </div>
                  `.trim()
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-6">
          ${sections
            .map(
              (section) => `
              <div class="mb-6">
                <h3 class="text-sm font-semibold mb-3 px-2" style="color: var(--drivex-silver)">${escapeHtml(
                  section.title
                )}</h3>
                <div class="glass-card-light rounded-2xl overflow-hidden">
                  ${section.items
                    .map((item, idx) => {
                      const divider =
                        idx < section.items.length - 1
                          ? `border-bottom: 1px solid var(--glass-border)`
                          : "";
                      return `
                        <a href="${routeLink(
                          item.path
                        )}" class="flex items-center gap-4 p-4 transition-all hover:bg-opacity-80" style="${divider}">
                          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(14, 165, 233, 0.2); color: var(--drivex-electric-blue)">
                            ${icon(item.icon, 20)}
                          </div>
                          <span class="flex-1" style="color: var(--drivex-white)">${escapeHtml(
                            item.label
                          )}</span>
                          ${
                            item.badge
                              ? `<span class="px-2 py-1 rounded-lg text-xs font-bold" style="background: rgba(239, 68, 68, 0.2); color: var(--drivex-danger)">${escapeHtml(
                                  item.badge
                                )}</span>`
                              : ""
                          }
                        </a>
                      `.trim();
                    })
                    .join("")}
                </div>
              </div>
            `.trim()
            )
            .join("")}
        </div>
      </div>
    `.trim();
  }

  function renderSimplePage({ title, backPath, bodyHtml }) {
    return `
      <div class="min-h-screen pb-24" style="background: var(--drivex-black)">
        ${backHeader({ title, backPath })}
        ${bodyHtml || ""}
      </div>
    `.trim();
  }

  function renderPlaceholder({ title, backPath = "/" }) {
    return renderSimplePage({
      title,
      backPath,
      bodyHtml: `
        <div class="px-6 py-6">
          <div class="glass-card-light rounded-2xl p-5">
            <p class="text-sm" style="color: var(--drivex-white)">Экран в разработке. Это демо-прототип.</p>
          </div>
        </div>
      `.trim()
    });
  }

  function renderServiceDetail(serviceId) {
    const service =
      recommendedServices.find((s) => s.id === serviceId) ||
      nearbyServices.find((s) => s.id === serviceId);

    if (!service) {
      return renderSimplePage({
        title: "Сервис не найден",
        backPath: "/map",
        bodyHtml:
          '<div class="px-6 py-6"><div class="glass-card-light rounded-2xl p-5" style="color: var(--drivex-white)">Попробуйте открыть другой сервис.</div></div>'
      });
    }

    const name = service.name;
    const subtitleParts = [];
    if ("category" in service) subtitleParts.push(service.category);
    if ("type" in service) subtitleParts.push(service.type);
    const subtitle = subtitleParts.filter(Boolean).join(" • ");

    const distance = "distance" in service ? service.distance : "";
    const rating = "rating" in service ? service.rating : "";

    const image =
      "image" in service
        ? service.image
        : "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

    return renderSimplePage({
      title: name,
      backPath: "/map",
      bodyHtml: `
        <div class="px-6 py-6">
          <div class="glass-card-light rounded-2xl overflow-hidden">
            <div class="relative h-48 overflow-hidden">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(
        name
      )}" class="w-full h-full object-cover" />
              <div class="absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-md" style="background: rgba(26, 26, 36, 0.45); color: var(--drivex-white)">
                ${escapeHtml(subtitle || "Автосервис")}
              </div>
            </div>
            <div class="p-5">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="text-sm" style="color: var(--drivex-silver)">${escapeHtml(
                    distance
                  )}</p>
                  <p class="text-sm" style="color: var(--drivex-warning)">${icon(
                    "star",
                    12
                  )} ${rating}</p>
                </div>
                <button class="px-4 py-2 rounded-xl text-sm font-medium dx-btn" data-toast="Бронирование (демо)">
                  Записаться
                </button>
              </div>
              <div class="glass-card rounded-2xl p-4">
                <p class="text-sm" style="color: var(--drivex-light-silver)">
                  Здесь будет описание сервиса, услуги, цены и отзывы. Сейчас это демо-страница, повторяющая стиль figma.site.
                </p>
              </div>
            </div>
          </div>
        </div>
      `.trim()
    });
  }

  function renderProductDetail(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return renderSimplePage({
        title: "Товар не найден",
        backPath: "/market",
        bodyHtml:
          '<div class="px-6 py-6"><div class="glass-card-light rounded-2xl p-5" style="color: var(--drivex-white)">Попробуйте открыть другой товар.</div></div>'
      });
    }

    return renderSimplePage({
      title: product.name,
      backPath: "/market",
      bodyHtml: `
        <div class="px-6 py-6">
          <div class="glass-card-light rounded-2xl overflow-hidden">
            <div class="relative h-56 overflow-hidden">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(
        product.name
      )}" class="w-full h-full object-cover" />
              ${
                product.badge
                  ? `<div class="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-md" style="background: ${
                      product.badge.includes("Скидка")
                        ? "var(--drivex-danger)"
                        : "var(--drivex-warning)"
                    }; color: var(--drivex-white)">${escapeHtml(
                      product.badge
                    )}</div>`
                  : ""
              }
            </div>
            <div class="p-5">
              <p class="text-sm mb-2" style="color: var(--drivex-silver)">${escapeHtml(
                product.category
              )}</p>
              <div class="flex items-baseline gap-2 mb-3">
                <span class="font-bold text-2xl" style="color: var(--drivex-white)">${formatPrice(
                  product.price
                )} ₽</span>
                ${
                  product.oldPrice
                    ? `<span class="text-sm line-through" style="color: var(--drivex-silver)">${formatPrice(
                        product.oldPrice
                      )} ₽</span>`
                    : ""
                }
              </div>
              <div class="flex items-center gap-2 text-sm mb-4" style="color: var(--drivex-warning)">
                ${icon("star", 14)} ${product.rating} <span style="color: var(--drivex-silver)">(${product.reviews})</span>
              </div>

              <div class="glass-card rounded-2xl p-4 mb-4">
                <p class="text-sm" style="color: var(--drivex-light-silver)">
                  Доставка: <span style="color: var(--drivex-white)">${escapeHtml(
                    product.delivery
                  )}</span><br/>
                  В наличии: <span style="color: var(--drivex-white)">${
                    product.inStock ? "Да" : "Нет"
                  }</span>
                </p>
              </div>

              <button class="w-full px-4 py-3 rounded-2xl text-sm font-bold dx-btn" data-add-to-cart="${
                product.id
              }">
                Добавить в корзину
              </button>
            </div>
          </div>
        </div>
      `.trim()
    });
  }

  function resolveRoute(path) {
    const normalized = path.replace(/\/+$/, "") || "/";

    const matchers = [
      { re: /^\/$/, nav: "/", render: () => renderDashboard() },
      { re: /^\/map$/, nav: "/map", render: () => renderMap() },
      { re: /^\/services$/, nav: "/services", render: () => renderServices() },
      { re: /^\/market$/, nav: "/market", render: () => renderMarket() },
      { re: /^\/profile$/, nav: "/profile", render: () => renderProfile() },

      {
        re: /^\/service\/(\d+)$/,
        nav: null,
        render: (m) => renderServiceDetail(Number(m[1]))
      },
      {
        re: /^\/product\/(\d+)$/,
        nav: null,
        render: (m) => renderProductDetail(Number(m[1]))
      },

      {
        re: /^\/notifications$/,
        nav: null,
        render: () => renderPlaceholder({ title: "Уведомления", backPath: "/" })
      },
      {
        re: /^\/garage$/,
        nav: null,
        render: () => renderPlaceholder({ title: "Мой гараж", backPath: "/profile" })
      },
      {
        re: /^\/smart-care$/,
        nav: null,
        render: () => renderPlaceholder({ title: "Умный уход", backPath: "/profile" })
      },
      {
        re: /^\/ai-assistant$/,
        nav: null,
        render: () => renderPlaceholder({ title: "AI помощник", backPath: "/" })
      },
      {
        re: /^\/emergency$/,
        nav: null,
        render: () => renderPlaceholder({ title: "SOS помощь", backPath: "/" })
      },
      {
        re: /^\/cart$/,
        nav: null,
        render: () => renderPlaceholder({ title: "Корзина", backPath: "/market" })
      },
      {
        re: /^\/orders$/,
        nav: null,
        render: () =>
          renderPlaceholder({ title: "История заказов", backPath: "/profile" })
      },
      {
        re: /^\/trips$/,
        nav: null,
        render: () =>
          renderPlaceholder({ title: "История поездок", backPath: "/profile" })
      },
      {
        re: /^\/saved-locations$/,
        nav: null,
        render: () =>
          renderPlaceholder({ title: "Сохранённые места", backPath: "/profile" })
      },
      {
        re: /^\/settings$/,
        nav: null,
        render: () => renderPlaceholder({ title: "Настройки", backPath: "/profile" })
      },
      {
        re: /^\/help$/,
        nav: null,
        render: () => renderPlaceholder({ title: "Помощь", backPath: "/profile" })
      },
      {
        re: /^\/category\/([\w-]+)$/,
        nav: "/services",
        render: (m) =>
          renderSimplePage({
            title: `Категория: ${m[1]}`,
            backPath: "/services",
            bodyHtml: `
              <div class="px-6 py-6">
                <div class="glass-card-light rounded-2xl p-5">
                  <p class="text-sm" style="color: var(--drivex-white)">Фильтр категории: <b>${escapeHtml(
                    m[1]
                  )}</b> (демо)</p>
                </div>
              </div>
            `.trim()
          })
      }
    ];

    for (const item of matchers) {
      const m = normalized.match(item.re);
      if (m) return { nav: item.nav, html: item.render(m) };
    }

    return {
      nav: null,
      html: renderSimplePage({
        title: "404",
        backPath: "/",
        bodyHtml: `
          <div class="px-6 py-6">
            <div class="glass-card-light rounded-2xl p-5">
              <p class="text-sm" style="color: var(--drivex-white)">Страница не найдена: <code style="color: var(--drivex-neon-cyan)">${escapeHtml(
                normalized
              )}</code></p>
            </div>
          </div>
        `.trim()
      })
    };
  }

  function injectNavIcons() {
    document.querySelectorAll(".nav-icon").forEach((node) => {
      const iconName = node.getAttribute("data-icon") || "star";
      node.innerHTML = icon(iconName, 24);
    });
  }

  function wireInteractions() {
    document.querySelectorAll("[data-toast]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toast(btn.getAttribute("data-toast"));
      });
    });

    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.cartCount += 1;
        toast("Добавлено в корзину");
        render();
      });
    });

    const filtersHost = document.querySelector("[data-map-filters]");
    if (filtersHost) {
      const buttons = Array.from(filtersHost.querySelectorAll("[data-filter]"));
      if (buttons.length) {
        const setActive = (id) => {
          buttons.forEach((b) => {
            const active = b.getAttribute("data-filter") === id;
            b.style.background = active ? "var(--gradient-primary)" : "var(--glass-bg)";
            b.style.color = active ? "var(--drivex-white)" : "var(--drivex-silver)";
            b.style.border = `1px solid ${active ? "transparent" : "var(--glass-border)"}`;
          });
        };
        setActive("all");
        buttons.forEach((b) =>
          b.addEventListener("click", () => {
            setActive(b.getAttribute("data-filter") || "all");
          })
        );
      }
    }
  }

  function render() {
    const main = document.getElementById("main");
    if (!main) return;

    const path = getPathFromHash();
    const { nav, html } = resolveRoute(path);

    main.innerHTML = html;
    setNavActive(nav || (path === "/" ? "/" : path));
    injectNavIcons();
    wireInteractions();
  }

  if (!window.location.hash) {
    window.location.hash = "#/";
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("DOMContentLoaded", () => {
    injectNavIcons();
    render();
  });
})();
