// app/screens/service-crm-2.js — Service CRM часть 2
// Содержит: Settings, ServiceLayout, ServiceNotFoundScreen
(() => {
  'use strict';
  const DX = window.DX;
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;
  function useToast() { return (window.DX.useToast||function(){return{push:function(){}};})(); }
  const navigateToHash = function(path) { window.DX.navigateToHash && window.DX.navigateToHash(path); };
  const SimplePage = function(p) { var F=(window.DX.screens||{}).SimplePage||window.DX.SimplePage; return F?F(p):(p.children||null); };
  const ServiceCrmLayout = function(p) { var F=(window.DX.screens||{}).ServiceCrmLayout; return F?F(p):(p.children||null); };
  const formatTjsPrice = function(n) { return window.DX.formatTjsPrice?window.DX.formatTjsPrice(n):(String(n)+' сом.'); };
  const genId = function(p) { return window.DX.genId?window.DX.genId(p):(p+'-'+Date.now()); };
  function ServiceSettingsScreen({ currentUser, center, onSaveCenter }) {
    const toast = useToast();
    const [form, setForm] = useState(() => createServiceCenterFormState(center));
    const [submitting, setSubmitting] = useState(false);
    const centerSyncToken = useMemo(() => JSON.stringify(createServiceCenterFormState(center)), [center]);

    useEffect(() => {
      try {
        setForm(JSON.parse(centerSyncToken));
      } catch {
        setForm(createServiceCenterFormState(center));
      }
    }, [centerSyncToken]);

    const updateField = useCallback((key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleLogoPick = useCallback(
      async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareAvatarDataUrl(file, { size: 320, quality: 0.9 });
          if (!dataUrl) {
            toast.push("Логотип не удалось загрузить");
            return;
          }
          setForm((prev) => ({
            ...prev,
            logo: dataUrl
          }));
          toast.push("Логотип обновлён");
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Логотип слишком большой. Выберите фото поменьше"
              : "Файл не подходит"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast]
    );

    const handleCoverPick = useCallback(
      async (event) => {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;

        try {
          const dataUrl = await prepareDocumentDataUrl(file, { maxSize: 960, quality: 0.78 });
          if (!dataUrl) {
            toast.push("Главное фото не удалось загрузить");
            return;
          }
          updateField("coverImage", dataUrl);
          toast.push("Главное фото обновлено");
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Главное фото слишком большое. Выберите фото поменьше"
              : "Файл не подходит"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast, updateField]
    );

    const handleGalleryPick = useCallback(
      async (event) => {
        const input = event.target;
        const files = Array.from(input.files || []).slice(0, 6);
        if (!files.length) return;

        try {
          const prepared = await Promise.all(
            files.map((file) => prepareDocumentDataUrl(file, { maxSize: 960, quality: 0.8 }).catch(() => ""))
          );
          const nextPhotos = prepared.filter(Boolean);
          if (!nextPhotos.length) {
            toast.push("Фото работ не удалось загрузить");
            return;
          }

          setForm((prev) => ({
            ...prev,
            gallery: [...normalizeServiceGalleryList(prev.gallery), ...nextPhotos].filter(Boolean).slice(0, 6)
          }));
          toast.push(`Добавлено фото: ${nextPhotos.length}`);
        } catch (error) {
          toast.push(
            String(error && error.message) === "File too large"
              ? "Одно из фото слишком большое. Выберите фото поменьше"
              : "Файлы не подходят"
          );
        } finally {
          if (input) input.value = "";
        }
      },
      [toast]
    );

    const removeGalleryPhoto = useCallback((index) => {
      setForm((prev) => ({
        ...prev,
        gallery: normalizeServiceGalleryList(prev.gallery).filter((_, photoIndex) => photoIndex !== index)
      }));
    }, []);

    const handleSubmit = useCallback(
      async (event) => {
        event.preventDefault();
        if (!String(form.name || "").trim()) {
          toast.push("Введите название сервиса");
          return;
        }
        if (!String(form.serviceType || "").trim()) {
          toast.push("Выберите тип сервиса");
          return;
        }
        if (!String(form.city || "").trim()) {
          toast.push("Введите город");
          return;
        }

        try {
          setSubmitting(true);
          await onSaveCenter({
            ...form,
            boxesCount: Math.max(1, Math.floor(Number(form.boxesCount) || 1)),
            coverImage: normalizeServiceImageAsset(form.coverImage),
            gallery: normalizeServiceGalleryList(form.gallery),
            videoUrl: normalizeServiceVideoUrl(form.videoUrl),
            description: form.description || `${form.name || "Сервис"} — обновлённая карточка сервиса DRIVEX.`
          });
          navigateToHash("/service-crm/dashboard");
        } catch (error) {
          toast.push(error?.message || "Не удалось сохранить сервис");
        } finally {
          setSubmitting(false);
        }
      },
      [form, onSaveCenter, toast]
    );

    const previewCenter = {
      ...center,
      ...form,
      boxesCount: Math.max(1, Math.floor(Number(form.boxesCount) || 1))
    };
    const galleryPreview = normalizeServiceGalleryList(form.gallery);
    const coverPreview =
      form.coverImage ||
      galleryPreview[0] ||
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const videoPreviewUrl = normalizeServiceVideoUrl(form.videoUrl);

    return html`
      <${ServiceCrmLayout}
        title="Настройки сервиса"
        subtitle="Карточка сервиса, контакты и медиа, которые увидят клиенты в каталоге."
        activeItem="settings"
        currentUser=${currentUser}
        center=${center}
        primaryAction=${{ path: "/service-crm/dashboard", label: "Дашборд" }}
      >
        <form className="space-y-4" onSubmit=${handleSubmit}>
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Основная информация
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Это видят сотрудники сервиса внутри CRM
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Логотип
                <input type="file" accept="image/*" className="hidden" onChange=${handleLogoPick} />
              </label>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <${SellerLogo}
                store=${{
                  ...previewCenter,
                  accent: "var(--drivex-electric-blue)"
                }}
                size=${72}
                rounded="22px"
              />
              <div>
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${form.name || "Название сервиса"}
                </p>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  ${form.serviceType || "Тип сервиса"}${form.city ? ` • ${form.city}` : ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-5">
              <${SellerField} label="Название сервиса">
                <${SellerInput}
                  type="text"
                  value=${form.name}
                  onInput=${(e) => updateField("name", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Тип сервиса">
                  <${SellerSelect}
                    value=${form.serviceType}
                    onChange=${(e) => updateField("serviceType", e.target.value)}
                  >
                    <option value="">Выберите тип</option>
                    ${serviceCenterTypeOptions.map((option) => html`<option key=${option} value=${option}>${option}</option>`)}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Боксы">
                  <${SellerInput}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value=${form.boxesCount}
                    onInput=${(e) => updateField("boxesCount", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Город">
                  <${SellerInput}
                    type="text"
                    value=${form.city}
                    onInput=${(e) => updateField("city", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Часы работы">
                  <${SellerInput}
                    type="text"
                    value=${form.workingHours}
                    onInput=${(e) => updateField("workingHours", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Адрес">
                <${SellerInput}
                  type="text"
                  value=${form.address}
                  onInput=${(e) => updateField("address", e.target.value)}
                />
              </${SellerField}>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Ориентир">
                  <${SellerInput}
                    type="text"
                    value=${form.locationLabel}
                    onInput=${(e) => updateField("locationLabel", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Геолокация">
                  <${SellerInput}
                    type="text"
                    value=${form.geolocation}
                    onInput=${(e) => updateField("geolocation", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <${SellerField} label="Телефон сервиса">
                  <${SellerInput}
                    type="tel"
                    value=${form.phone}
                    onInput=${(e) => updateField("phone", e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Email">
                  <${SellerInput}
                    type="email"
                    value=${form.email}
                    onInput=${(e) => updateField("email", e.target.value)}
                  />
                </${SellerField}>
              </div>

              <${SellerField} label="Описание">
                <${SellerTextarea}
                  value=${form.description}
                  onInput=${(e) => updateField("description", e.target.value)}
                />
              </${SellerField}>
            </div>
          </div>

          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Медиа для клиентов
                </h2>
                <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                  Главное фото, реальные фото работ и видео появятся в карточке сервиса.
                </p>
              </div>
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Добавить фото работ
                <input type="file" accept="image/*" multiple className="hidden" onChange=${handleGalleryPick} />
              </label>
            </div>

            <div
              className="relative rounded-[28px] overflow-hidden h-56 mt-4"
              style=${{
                border: "1px solid rgba(6, 182, 212, 0.14)",
                background: "rgba(255, 255, 255, 0.04)"
              }}
            >
              <img src=${coverPreview} alt="Главное фото сервиса" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style=${{
                  background: "linear-gradient(180deg, rgba(8, 15, 26, 0.08) 0%, rgba(8, 15, 26, 0.82) 100%)"
                }}
              ></div>
              <div className="absolute left-4 right-4 bottom-4">
                <p className="text-[11px] uppercase tracking-[0.12em]" style=${{ color: "var(--drivex-neon-cyan)" }}>
                  Главное фото карточки
                </p>
                <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                  ${form.name || "Ваш сервис"}
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)" }}>
                  ${form.city || "Город"}${form.address ? ` • ${form.address}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-4">
              <label
                className="px-4 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                style=${{
                  background: "rgba(6, 182, 212, 0.16)",
                  color: "var(--drivex-neon-cyan)"
                }}
              >
                Изменить главное фото
                <input type="file" accept="image/*" className="hidden" onChange=${handleCoverPick} />
              </label>
              ${form.coverImage
                ? html`<button
                    type="button"
                    className="px-4 py-3 rounded-2xl text-sm font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-light-silver)"
                    }}
                    onClick=${() => updateField("coverImage", "")}
                  >
                    Убрать фото
                  </button>`
                : null}
            </div>

            <div className="mt-5">
              <${SellerField} label="Видео сервиса" note="Пока добавляем ссылкой">
                <${SellerInput}
                  type="url"
                  placeholder="https://youtube.com/..."
                  value=${form.videoUrl}
                  onInput=${(e) => updateField("videoUrl", e.target.value)}
                />
              </${SellerField}>
              <p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                Можно вставить ссылку на YouTube, Instagram, TikTok или Google Drive.
              </p>
              ${videoPreviewUrl
                ? html`<a
                    href=${videoPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-semibold"
                    style=${{ color: "var(--drivex-neon-cyan)" }}
                  >
                    <${Icon} name="play" size=${14} />
                    Открыть видео
                  </a>`
                : null}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style=${{ color: "var(--drivex-white)" }}>
                    Фото работ
                  </p>
                  <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Показываем клиентам зону сервиса, процессы и реальные кейсы.
                  </p>
                </div>
                <span className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                  ${galleryPreview.length}/6
                </span>
              </div>

              ${galleryPreview.length
                ? html`<div className="grid grid-cols-3 gap-3">
                    ${galleryPreview.map((photo, index) => html`
                      <div
                        key=${`service-gallery-photo-${index}`}
                        className="relative h-28 overflow-hidden rounded-[22px]"
                        style=${{ border: "1px solid rgba(6, 182, 212, 0.14)" }}
                      >
                        <img src=${photo} alt=${`Фото работы ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                          style=${{
                            background: "rgba(8, 15, 26, 0.78)",
                            color: "var(--drivex-white)"
                          }}
                          onClick=${() => removeGalleryPhoto(index)}
                        >
                          ×
                        </button>
                      </div>
                    `)}
                  </div>`
                : html`<div
                    className="rounded-[24px] p-5"
                    style=${{
                      background: "rgba(255, 255, 255, 0.035)",
                      border: "1px dashed rgba(148, 163, 184, 0.22)"
                    }}
                  >
                    <p className="text-sm" style=${{ color: "var(--drivex-light-silver)" }}>
                      Пока нет фото работ. Добавьте несколько кадров, и они появятся в карточке сервиса вместо demo-галереи.
                    </p>
                  </div>`}
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold dx-btn" disabled=${submitting}>
            ${submitting ? "Сохраняем сервис..." : "Сохранить настройки"}
          </button>
        </form>
      </${ServiceCrmLayout}>
    `;
  }

  function ServiceNotFoundScreen({ currentUser, center }) {
    return html`
      <${ServiceCrmLayout}
        title="Страница не найдена"
        subtitle="Проверьте route Service CRM или вернитесь в основные разделы сервиса."
        activeItem="dashboard"
        currentUser=${currentUser}
        center=${center}
      >
        <div className="glass-card-light rounded-3xl p-6">
          <a href="#/service-crm/dashboard" className="inline-flex px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
            В дашборд сервиса
          </a>
        </div>
      </${ServiceCrmLayout}>
    `;
  }


  DX.screens = DX.screens || {};
  DX.screens.ServiceSettingsScreen = ServiceSettingsScreen;
  DX.screens.ServiceNotFoundScreen = ServiceNotFoundScreen;
})();

