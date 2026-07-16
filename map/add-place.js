(function () {
  "use strict";

  const STORAGE_KEY = "drivex.pendingPlaces.v1";
  const MAX_IMAGE_EDGE = 1280;
  const IMAGE_QUALITY = 0.72;
  const MAX_DATA_URL_LENGTH = 850000;
  const API_ENDPOINT =
    window.location && window.location.protocol === "file:"
      ? "http://localhost:8080/api/places"
      : "/api/places";

  const categories = [
    { id: "gas", label: "АЗС" },
    { id: "service", label: "Сервис" },
    { id: "wash", label: "Автомойка" },
    { id: "parts", label: "Магазин" },
    { id: "diagnostics", label: "Диагностика" },
    { id: "tire", label: "Шиномонтаж" },
    { id: "tow", label: "Эвакуатор" },
    { id: "detailing", label: "Детейлинг" },
    { id: "electric", label: "Автоэлектрик" },
    { id: "charge", label: "Зарядка EV" },
    { id: "parking", label: "Парковка" },
    { id: "other", label: "Другое" }
  ];

  // Чёткие stroke-SVG иконки категорий (раньше — буквы F/S/W/M, выглядело
  // как черновик). Используются и в шаге выбора, и в маркерах на карте.
  const CATEGORY_SVG = {
    gas: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"></path><path d="M3 21h14"></path><path d="M15 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0v-6.6L19.5 8"></path><path d="M8 7h4v4H8z"></path>',
    service: '<path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6V21h3.4l5.7-5.7a4.5 4.5 0 0 0 5.6-6L14.5 12l-2.5-2.5 2.7-3.2Z"></path>',
    wash: '<path d="M12 3c3.4 4.1 6 7.3 6 10.4a6 6 0 0 1-12 0C6 10.3 8.6 7.1 12 3Z"></path><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"></path>',
    parts: '<path d="M6 7h12l1.2 13H4.8L6 7Z"></path><path d="M9 10V6a3 3 0 0 1 6 0v4"></path>',
    diagnostics: '<path d="M4 7V4h3"></path><path d="M17 4h3v3"></path><path d="M20 17v3h-3"></path><path d="M7 20H4v-3"></path><path d="M7 12h3l1.5-3 3 6 1.5-3h1"></path>',
    tire: '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path>',
    tow: '<path d="M3 7h9v9H3z"></path><path d="M12 10h3.5l3 3v3h-6.5"></path><circle cx="6.5" cy="17.5" r="1.8"></circle><circle cx="16" cy="17.5" r="1.8"></circle>',
    detailing: '<path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"></path><path d="m18.5 15 .9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z"></path>',
    electric: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"></path>',
    charge: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"></path><path d="M3 21h14"></path><path d="M11 7 8.5 11.5h3L9 16"></path><path d="M15 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0v-6.6L19.5 8"></path>',
    parking: '<rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M9.5 16.5v-9h3.4a2.8 2.8 0 0 1 0 5.6H9.5"></path>',
    other: '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8M8 12h8"></path>'
  };

  function categoryIcon(categoryId, size = 20) {
    const path = CATEGORY_SVG[categoryId] || CATEGORY_SVG.other;
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  let state = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function readPendingPlaces() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writePendingPlaces(places) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
      return true;
    } catch {
      return false;
    }
  }

  function toList(value) {
    return String(value || "")
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function getCategory(categoryId) {
    return categories.find((item) => item.id === categoryId) || categories[categories.length - 1];
  }

  function renderPhoto(src, alt) {
    if (!src) return "";
    return `
      <div class="dx-add-photo-wrap">
        <img src="${src}" alt="${escapeHtml(alt)}" onerror="this.parentElement.classList.add('is-broken'); this.remove();" />
      </div>
    `;
  }

  function generateId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `place-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function createIcon(place) {
    const category = getCategory(place.category || place.type);
    const publishedClass = place.status === "published" ? " is-published" : "";
    return state.leaflet.divIcon({
      className: "dx-add-marker-shell",
      html: `
        <button class="dx-add-marker${publishedClass}" type="button" aria-label="${escapeHtml(place.name)}">
          <span>${categoryIcon(category.id, 17)}</span>
        </button>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  function init(options = {}) {
    if (!options.root || !options.map || !options.leaflet) return null;

    state = {
      root: options.root,
      map: options.map,
      leaflet: options.leaflet,
      showToast: typeof options.showToast === "function" ? options.showToast : function () {},
      onPlaceSubmitted: typeof options.onPlaceSubmitted === "function" ? options.onPlaceSubmitted : function () {},
      onPlaceSelected: typeof options.onPlaceSelected === "function" ? options.onPlaceSelected : null,
      onSharedPlacesLoaded: typeof options.onSharedPlacesLoaded === "function" ? options.onSharedPlacesLoaded : null,
      markerLayer: options.leaflet.layerGroup().addTo(options.map),
      renderedIds: new Set(),
      selectedCategory: null,
      selectedLocation: null,
      currentStep: "idle",
      photos: [],
      logo: "",
      ownerMode: false,
      errors: {},
      values: {}
    };

    state.root.insertAdjacentHTML("beforeend", `
      <button class="dx-add-place-fab" type="button" data-add-place-action="open" aria-label="Добавить место" title="Добавить место">
        <span>+</span>
      </button>
      <div class="dx-add-place-pin" aria-hidden="true">
        <span></span>
      </div>
      <section class="dx-add-place-sheet" aria-hidden="true">
        <div class="dx-add-place-drag"></div>
        <div class="dx-add-place-content"></div>
      </section>
    `);

    state.root.addEventListener("click", handleClick);
    state.root.addEventListener("change", handleChange);
    state.root.addEventListener("input", handleInput);
    renderStoredPendingMarkers();
    loadSharedPlaces();

    return {
      destroy() {
        state.root.removeEventListener("click", handleClick);
        state.root.removeEventListener("change", handleChange);
        state.root.removeEventListener("input", handleInput);
        state.markerLayer.clearLayers();
      },
      openAddPlaceModal,
      renderPendingMarker
    };
  }

  function openAddPlaceModal() {
    if (!state) return;
    state.selectedCategory = null;
    state.selectedLocation = null;
    state.photos = [];
    state.logo = "";
    state.ownerMode = false;
    state.errors = {};
    state.values = {};
    state.currentStep = "category";
    stopMapPinMode({ keepLocation: false });
    renderCategoryStep();
  }

  function closeAddPlaceModal() {
    if (!state) return;
    state.currentStep = "idle";
    stopMapPinMode({ keepLocation: true });
    const sheet = state.root.querySelector(".dx-add-place-sheet");
    if (sheet) {
      sheet.classList.remove("is-visible", "is-tall");
      sheet.setAttribute("aria-hidden", "true");
    }
  }

  function setSheet(html, tall = false) {
    const sheet = state.root.querySelector(".dx-add-place-sheet");
    const content = state.root.querySelector(".dx-add-place-content");
    if (!sheet || !content) return;
    content.innerHTML = html;
    sheet.classList.add("is-visible");
    sheet.classList.toggle("is-tall", tall);
    sheet.setAttribute("aria-hidden", "false");
  }

  function renderCategoryStep() {
    setSheet(`
      <header class="dx-add-place-head">
        <div>
          <p>Шаг 1 из 4</p>
          <h2>Что добавляем?</h2>
        </div>
        <button type="button" data-add-place-action="close" aria-label="Закрыть">×</button>
      </header>
      <div class="dx-add-category-grid">
        ${categories
          .map((category) => `
            <button class="dx-add-category-card" type="button" data-add-place-action="select-category" data-category="${category.id}">
              <span>${categoryIcon(category.id, 20)}</span>
              <strong>${escapeHtml(category.label)}</strong>
            </button>
          `)
          .join("")}
      </div>
    `, true);
  }

  function selectCategory(categoryId) {
    if (!state) return;
    state.selectedCategory = getCategory(categoryId);
    state.currentStep = "pin";
    startMapPinMode();
  }

  function startMapPinMode() {
    if (!state) return;
    closeSheetOnly();
    state.root.classList.add("is-add-pin-mode");
    state.showToast("Двигай карту, поставь pin на место и подтверди точку.");
    renderPinConfirmBar();
  }

  function closeSheetOnly() {
    const sheet = state.root.querySelector(".dx-add-place-sheet");
    if (sheet) {
      sheet.classList.remove("is-visible", "is-tall");
      sheet.setAttribute("aria-hidden", "true");
    }
  }

  function renderPinConfirmBar() {
    let bar = state.root.querySelector(".dx-add-pin-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "dx-add-pin-bar";
      state.root.appendChild(bar);
    }
    bar.innerHTML = `
      <div>
        <span>${escapeHtml(state.selectedCategory?.label || "Место")}</span>
        <strong>Выбери точку на карте</strong>
      </div>
      <button type="button" data-add-place-action="confirm-location">Подтвердить точку</button>
    `;
  }

  function stopMapPinMode(options = {}) {
    state.root.classList.remove("is-add-pin-mode");
    const bar = state.root.querySelector(".dx-add-pin-bar");
    if (bar) bar.remove();
    if (!options.keepLocation) state.selectedLocation = null;
  }

  function confirmMapLocation() {
    if (!state) return;
    const center = state.map.getCenter();
    state.selectedLocation = {
      lat: Number(center.lat.toFixed(6)),
      lng: Number(center.lng.toFixed(6))
    };
    stopMapPinMode({ keepLocation: true });
    state.currentStep = "form";
    renderAddPlaceForm();
  }

  function renderAddPlaceForm() {
    if (!state) return;
    const v = state.values || {};
    const e = state.errors || {};
    const category = state.selectedCategory || getCategory(v.category);
    setSheet(`
      <header class="dx-add-place-head">
        <div>
          <p>Шаг 2 из 4</p>
          <h2>Данные места</h2>
        </div>
        <button type="button" data-add-place-action="close" aria-label="Закрыть">×</button>
      </header>
      <form class="dx-add-form" novalidate>
        ${field("name", "Название места", v.name, e.name, "Например: СТО Бахтиёр")}
        <label>
          <span>Категория</span>
          <select name="category">
            ${categories.map((item) => `<option value="${item.id}" ${item.id === category.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>
        ${field("address", "Адрес", v.address, e.address, "Улица, микрорайон или ориентир")}
        ${field("contact", "Телефон / WhatsApp / Telegram", v.contact, e.contact, "+992 ... или @username")}
        ${field("workingHours", "Режим работы", v.workingHours, e.workingHours, "Например: 08:00-22:00")}
        <div class="dx-add-photo-block">
          <span>Фото</span>
          ${state.photos.length
            ? `<div class="dx-add-photo-grid">
                ${state.photos.map((src, index) => `
                  <div class="dx-add-photo-thumb">
                    <img src="${src}" alt="Фото ${index + 1}" />
                    <button type="button" data-add-place-action="remove-photo" data-index="${index}" aria-label="Убрать фото">×</button>
                  </div>
                `).join("")}
              </div>`
            : ""}
          ${state.photos.length < 3
            ? `<label class="dx-add-photo-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v12H4z"></path><circle cx="12" cy="13" r="3.4"></circle></svg>
                ${state.photos.length ? "Добавить ещё" : "Добавить фото"}
                <input name="photos" type="file" accept="image/*" multiple hidden />
              </label>`
            : ""}
          ${e.photos ? `<em>${escapeHtml(e.photos)}</em>` : ""}
        </div>
        <label>
          <span>Описание</span>
          <textarea name="description" rows="3" placeholder="Коротко: что здесь есть">${escapeHtml(v.description || "")}</textarea>
        </label>
        <label>
          <span>Список услуг</span>
          <textarea name="services" rows="3" placeholder="Замена масла, диагностика, шиномонтаж">${escapeHtml(v.services || "")}</textarea>
        </label>
        <label>
          <span>Цены</span>
          <input name="prices" value="${escapeHtml(v.prices || "")}" placeholder="Например: от 50 сомони" />
        </label>
        <div class="dx-add-switch-row">
          ${toggle("is247", "24/7", v.is247)}
          ${toggle("cardPayment", "Оплата картой", v.cardPayment)}
          ${toggle("mobileService", "Выездной сервис", v.mobileService)}
        </div>
        <div class="dx-add-owner-toggle">
          <button type="button" class="${state.ownerMode ? "" : "is-active"}" data-add-place-action="owner-mode" data-owner="false">Просто добавляю</button>
          <button type="button" class="${state.ownerMode ? "is-active" : ""}" data-add-place-action="owner-mode" data-owner="true">Я владелец</button>
        </div>
        ${state.ownerMode ? ownerFields(v) : ""}
        <div class="dx-add-form-actions">
          <button type="button" data-add-place-action="back-category">Назад</button>
          <button type="button" data-add-place-action="preview">Предпросмотр</button>
        </div>
      </form>
    `, true);
  }

  function field(name, label, value, error, placeholder) {
    return `
      <label>
        <span>${escapeHtml(label)}</span>
        <input name="${name}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder || "")}" />
        ${error ? `<em>${escapeHtml(error)}</em>` : ""}
      </label>
    `;
  }

  function toggle(name, label, checked) {
    return `
      <label class="dx-add-toggle">
        <input name="${name}" type="checkbox" ${checked ? "checked" : ""} />
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }

  function ownerFields(v) {
    return `
      <section class="dx-add-owner-fields">
        <h3>Для владельца бизнеса</h3>
        ${field("companyName", "Название компании", v.companyName, "", "Юридическое или брендовое название")}
        <label>
          <span>Логотип</span>
          <input name="logo" type="file" accept="image/*" />
          ${state.logo ? `<small>Логотип готов</small>` : ""}
        </label>
        <label>
          <span>Подробное описание</span>
          <textarea name="ownerDescription" rows="3">${escapeHtml(v.ownerDescription || "")}</textarea>
        </label>
        <label>
          <span>Услуги бизнеса</span>
          <textarea name="ownerServices" rows="3">${escapeHtml(v.ownerServices || "")}</textarea>
        </label>
        ${field("socialLinks", "Ссылки на соцсети", v.socialLinks, "", "Instagram, Telegram, сайт")}
      </section>
    `;
  }

  function collectFormValues() {
    const form = state.root.querySelector(".dx-add-form");
    if (!form) return state.values || {};
    const data = new FormData(form);
    state.values = {
      name: data.get("name") || "",
      category: data.get("category") || state.selectedCategory?.id || "other",
      address: data.get("address") || "",
      contact: data.get("contact") || "",
      workingHours: data.get("workingHours") || "",
      description: data.get("description") || "",
      services: data.get("services") || "",
      prices: data.get("prices") || "",
      is247: Boolean(data.get("is247")),
      cardPayment: Boolean(data.get("cardPayment")),
      mobileService: Boolean(data.get("mobileService")),
      companyName: data.get("companyName") || "",
      ownerDescription: data.get("ownerDescription") || "",
      ownerServices: data.get("ownerServices") || "",
      socialLinks: data.get("socialLinks") || ""
    };
    state.selectedCategory = getCategory(state.values.category);
    return state.values;
  }

  function validateAddPlaceForm() {
    if (!state) return {};
    const v = collectFormValues();
    const errors = {};
    if (!String(v.name).trim()) errors.name = "Напиши название места.";
    if (!state.selectedLocation) errors.location = "Сначала подтверди точку на карте.";
    if (!String(v.address).trim()) errors.address = "Укажи адрес или ориентир.";
    if (!String(v.contact).trim()) errors.contact = "Добавь телефон, WhatsApp или Telegram.";
    if (!String(v.workingHours).trim()) errors.workingHours = "Укажи режим работы.";
    if (!state.photos.length) errors.photos = "Добавь хотя бы одно фото.";
    state.errors = errors;
    return errors;
  }

  function previewNewPlace() {
    if (!state) return;
    const errors = validateAddPlaceForm();
    if (Object.keys(errors).length) {
      renderAddPlaceForm();
      state.showToast(errors.location || "Проверь обязательные поля.");
      return;
    }

    const place = buildPlaceObject();
    state.currentStep = "preview";
    setSheet(`
      <header class="dx-add-place-head">
        <div>
          <p>Шаг 3 из 4</p>
          <h2>Проверь карточку</h2>
        </div>
        <button type="button" data-add-place-action="close" aria-label="Закрыть">×</button>
      </header>
      <article class="dx-add-preview-card">
        ${renderPhoto(place.photos[0], place.name)}
        <div>
          <span class="dx-add-status">На проверке</span>
          <h3>${escapeHtml(place.name)}</h3>
          <p>${escapeHtml(getCategory(place.category).label)} · ${escapeHtml(place.address)}</p>
          <p>${escapeHtml(place.contact)} · ${escapeHtml(place.workingHours)}</p>
        </div>
        <div class="dx-add-preview-tags">
          ${place.services.slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
      </article>
      <div class="dx-add-form-actions">
        <button type="button" data-add-place-action="edit-form">Изменить</button>
        <button type="button" data-add-place-action="submit">Отправить</button>
      </div>
    `, true);
  }

  function buildPlaceObject() {
    const v = state.values;
    return {
      id: state.pendingId || generateId(),
      type: v.category,
      name: String(v.name).trim(),
      category: v.category,
      lat: state.selectedLocation.lat,
      lng: state.selectedLocation.lng,
      address: String(v.address).trim(),
      contact: String(v.contact).trim(),
      workingHours: String(v.workingHours).trim(),
      description: String(v.description || "").trim(),
      services: toList(v.services),
      prices: String(v.prices || "").trim(),
      photos: state.photos.slice(0, 3),
      isOwner: Boolean(state.ownerMode),
      owner: state.ownerMode
        ? {
            companyName: String(v.companyName || "").trim(),
            logo: state.logo || "",
            description: String(v.ownerDescription || "").trim(),
            services: toList(v.ownerServices),
            socialLinks: toList(v.socialLinks)
          }
        : null,
      features: {
        is247: Boolean(v.is247),
        cardPayment: Boolean(v.cardPayment),
        mobileService: Boolean(v.mobileService)
      },
      status: "published",
      verified: true,
      createdAt: new Date().toISOString()
    };
  }

  async function submitNewPlace() {
    if (!state) return;
    const place = buildPlaceObject();

    let savedPlace = place;
    let savedOnServer = false;
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(place)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Сервер не сохранил место.");
      savedPlace = payload.place || place;
      savedOnServer = true;
      removeLocalPlace(savedPlace.id);
    } catch {
      const pendingPlaces = readPendingPlaces();
      pendingPlaces.unshift(place);
      if (!writePendingPlaces(pendingPlaces)) {
        state.showToast("Не удалось сохранить. Уменьши размер фото и попробуй еще раз.");
        return;
      }
      state.showToast("Сервер недоступен. Сохранил локально и покажу на этом устройстве.");
    }

    renderPendingMarker(savedPlace);
    state.onPlaceSubmitted(savedPlace);
    // Честные статусы: published — опубликовано всем; pending на сервере —
    // видно всем с пометкой «На проверке»; иначе — только локально.
    const successTitle = savedPlace.status === "published"
      ? "Опубликовано"
      : savedOnServer
        ? "Отправлено на проверку"
        : "Сохранено локально";
    const successBody = savedPlace.status === "published"
      ? "Точка уже появилась на карте и доступна другим пользователям через общий сервер."
      : savedOnServer
        ? "Точка уже на карте с пометкой «На проверке» — после проверки модератором пометка исчезнет."
        : "Точка появилась у тебя на карте. Когда сервер будет доступен, можно отправить ее повторно.";
    if (savedPlace.status === "published") state.showToast("Место опубликовано и будет видно другим пользователям.");
    setSheet(`
      <header class="dx-add-place-head">
        <div>
          <p>Шаг 4 из 4</p>
          <h2>${successTitle}</h2>
        </div>
        <button type="button" data-add-place-action="close" aria-label="Закрыть">×</button>
      </header>
      <div class="dx-add-success">
        <span>✓</span>
        <h3>${escapeHtml(savedPlace.name)}</h3>
        <p>${successBody}</p>
        <button type="button" data-add-place-action="close">Готово</button>
      </div>
    `, false);
  }

  function renderStoredPendingMarkers() {
    readPendingPlaces().forEach(renderPendingMarker);
  }

  async function loadSharedPlaces() {
    try {
      const response = await fetch(API_ENDPOINT, { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const payload = await response.json();
      if (!Array.isArray(payload.places)) return;
      payload.places.forEach(renderPendingMarker);
      if (state.onSharedPlacesLoaded) state.onSharedPlacesLoaded(payload.places);
    } catch {
      // Local fallback markers are already rendered.
    }
  }

  function removeLocalPlace(placeId) {
    if (!placeId) return;
    const nextPlaces = readPendingPlaces().filter((place) => place.id !== placeId);
    writePendingPlaces(nextPlaces);
  }

  function renderPendingMarker(place) {
    if (!state || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
    if (state.renderedIds.has(place.id)) return;
    state.renderedIds.add(place.id);
    const marker = state.leaflet.marker([place.lat, place.lng], {
      icon: createIcon(place),
      keyboard: true,
      title: `${place.name} · ${place.status === "published" ? "Опубликовано" : "На проверке"}`
    });
    marker.on("click", () => {
      if (state.onPlaceSelected) {
        state.onPlaceSelected(place);
        return;
      }
      renderPendingPreview(place);
    });
    marker.addTo(state.markerLayer);
    window.setTimeout(() => {
      const element = marker.getElement();
      if (element) element.classList.add("is-mounted");
    }, 90);
  }

  function renderPendingPreview(place) {
    setSheet(`
      <header class="dx-add-place-head">
        <div>
          <p>Добавлено пользователем</p>
          <h2>${escapeHtml(place.name)}</h2>
        </div>
        <button type="button" data-add-place-action="close" aria-label="Закрыть">×</button>
      </header>
      <article class="dx-add-preview-card">
        ${renderPhoto(place.photos?.[0], place.name)}
        <div>
          <span class="dx-add-status">${place.status === "published" ? "Опубликовано" : "На проверке"}</span>
          <p>${escapeHtml(getCategory(place.category).label)} · ${escapeHtml(place.address)}</p>
          <p>${escapeHtml(place.contact)} · ${escapeHtml(place.workingHours)}</p>
        </div>
      </article>
    `, false);
  }

  function handleClick(event) {
    if (!state) return;
    const button = event.target.closest("[data-add-place-action]");
    if (!button) return;
    const action = button.getAttribute("data-add-place-action");

    if (action === "open") openAddPlaceModal();
    if (action === "close") closeAddPlaceModal();
    if (action === "select-category") selectCategory(button.getAttribute("data-category"));
    if (action === "confirm-location") confirmMapLocation();
    if (action === "back-category") renderCategoryStep();
    if (action === "owner-mode") {
      state.ownerMode = button.getAttribute("data-owner") === "true";
      collectFormValues();
      renderAddPlaceForm();
    }
    if (action === "remove-photo") {
      const index = Number(button.getAttribute("data-index"));
      if (Number.isFinite(index)) {
        collectFormValues();
        state.photos = state.photos.filter((_, i) => i !== index);
        renderAddPlaceForm();
      }
    }
    if (action === "preview") previewNewPlace();
    if (action === "edit-form") renderAddPlaceForm();
    if (action === "submit") submitNewPlace();
  }

  function handleInput(event) {
    if (!state || !event.target.closest(".dx-add-form")) return;
    collectFormValues();
  }

  function handleChange(event) {
    if (!state || !event.target.closest(".dx-add-form")) return;
    if (event.target.name === "photos") {
      readPhotoFiles(event.target.files);
      return;
    }
    if (event.target.name === "logo") {
      readLogoFile(event.target.files);
      return;
    }
    collectFormValues();
  }

  function readPhotoFiles(fileList) {
    const remaining = Math.max(0, 3 - state.photos.length);
    const files = Array.from(fileList || []).filter((file) => /^image\//.test(file.type)).slice(0, remaining);
    // Отмена диалога выбора больше НЕ сбрасывает уже добавленные фото —
    // новые снимки ДОПОЛНЯЮТ список (кнопка «Добавить ещё»), максимум 3.
    if (!files.length) return;

    state.showToast("Готовлю фото...");
    Promise.all(files.map(compressImageFile))
      .then((photos) => {
        collectFormValues();
        state.photos = [...state.photos, ...photos.filter(Boolean)].slice(0, 3);
        renderAddPlaceForm();
      })
      .catch(() => {
        state.showToast("Фото не удалось прочитать. Попробуй другое изображение.");
      });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
      if (file.size > 6000000) {
        state.showToast("Фото слишком большое. Лучше выбрать снимок до 6 MB.");
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  }

  async function compressImageFile(file) {
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl) return "";
    if (/^data:image\/(heic|heif);base64,/i.test(dataUrl)) {
      state.showToast("HEIC фото браузер не может сохранить для карты. Выбери JPG/PNG или сделай скрин фото.");
      return "";
    }

    const image = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#050812";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let compressed = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
    if (compressed.length > MAX_DATA_URL_LENGTH) compressed = canvas.toDataURL("image/jpeg", 0.58);
    if (compressed.length > MAX_DATA_URL_LENGTH) {
      state.showToast("Фото не удалось сжать достаточно. Выбери фото поменьше.");
      return "";
    }
    return compressed;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function readLogoFile(fileList) {
    const file = Array.from(fileList || []).find((item) => /^image\//.test(item.type));
    if (!file) {
      state.logo = "";
      return;
    }
    compressImageFile(file).then((logo) => {
      state.logo = logo;
      collectFormValues();
      renderAddPlaceForm();
    });
  }

  window.DrivexAddPlace = {
    init,
    openAddPlaceModal,
    selectCategory,
    startMapPinMode,
    confirmMapLocation,
    renderAddPlaceForm,
    validateAddPlaceForm,
    previewNewPlace,
    submitNewPlace,
    renderPendingMarker
  };
})();
