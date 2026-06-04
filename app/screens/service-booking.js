// service-booking.js
(() => {
  'use strict';
  const DX = window.DX;
  // AppContext helpers для доступа к state когда не в замыкании app.js
  const useAppCtx = (window.DX && window.DX.useAppCtx) ? window.DX.useAppCtx : function() { return window.DX && window.DX._appState ? window.DX._appState : {}; };
  const getCtx = function() { return (window.DX && window.DX._appState) || {}; };
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;

  function ServiceBookingScreen({
    serviceId,
    serviceDirectory,
    profile,
    activeCarId,
    onSelectCar,
    currentCenter,
    appointments,
    onSubmitBooking
  }) {
    const toast = useToast();
    const runtimeServices =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const service = runtimeServices.find((item) => String(item.id) === String(serviceId)) || null;
    const safeProfile = profile && typeof profile === "object" ? profile : createDefaultBuyerProfile();
    const fallbackCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const currentCatalogService = createCatalogServiceFromCenter(currentCenter, {
      appointments
    });
    const isCrmBacked =
      Boolean(service?.isRegisteredCenter) &&
      Boolean(currentCatalogService) &&
      String(currentCatalogService.id) === String(service?.id);
    const safeCenter = isCrmBacked ? normalizeServiceCenter(currentCenter) : null;
    const appointmentPool = isCrmBacked
      ? normalizeServiceAppointmentsList(appointments, safeCenter?.id).filter((item) => !isDemoServiceAppointment(item))
      : [];
    const defaultDate = getFutureLocalISODate(1);
    const [clientName, setClientName] = useState(() => safeProfile.name || "");
    const [clientPhone, setClientPhone] = useState(() => safeProfile.phone || "");
    const [carId, setCarId] = useState(() => fallbackCar?.id || (garageCars[0]?.id || ""));
    const [day, setDay] = useState(defaultDate);
    const [workLabel, setWorkLabel] = useState(() => service?.type || service?.category || "Диагностика");
    const [note, setNote] = useState("");
    const [submittedRequest, setSubmittedRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inlineError, setInlineError] = useState("");
    const selectedCar = findGarageCar(carId) || fallbackCar || garageCars[0] || null;
    const availableSlotOptions = buildServiceBookingSlotOptions({
      service,
      center: safeCenter,
      appointments: appointmentPool,
      day
    }).filter((slot) => slot.available);
    const [time, setTime] = useState(() => availableSlotOptions[0]?.value || "10:00");

    useEffect(() => {
      const nextCar = findGarageCar(activeCarId) || garageCars[0] || null;
      setClientName(safeProfile.name || "");
      setClientPhone(safeProfile.phone || "");
      setCarId(nextCar?.id || (garageCars[0]?.id || ""));
      setDay(getFutureLocalISODate(1));
      setWorkLabel(service?.type || service?.category || "Диагностика");
      setNote("");
      setSubmittedRequest(null);
      setInlineError("");
    }, [activeCarId, safeProfile.name, safeProfile.phone, service?.id, service?.type, service?.category]);

    useEffect(() => {
      if (!availableSlotOptions.length) {
        setTime("");
        return;
      }

      if (!availableSlotOptions.some((slot) => slot.value === time)) {
        setTime(availableSlotOptions[0].value);
      }
    }, [availableSlotOptions, time]);

    if (!service) {
      return html`
        <${SimplePage} title="Запись не найдена" backPath="/services">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Сервис не найден. Попробуйте открыть запись из каталога заново.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const handleSubmit = async (event) => {
      event.preventDefault();

      if (!clientName.trim() || !clientPhone.trim()) {
        setInlineError("Укажите имя и телефон для записи.");
        return;
      }

      if (!workLabel.trim()) {
        setInlineError("Напишите, что нужно сделать по машине.");
        return;
      }

      if (!day || !parseISODate(day)) {
        setInlineError("Выберите дату записи.");
        return;
      }

      if (!time) {
        setInlineError("На этот день нет свободных слотов. Выберите другую дату.");
        return;
      }

      setInlineError("");
      setIsSubmitting(true);

      try {
        const request = await onSubmitBooking?.({
          serviceId: String(service.id),
          serviceName: service.name,
          city: service.city,
          address: service.address || service.locationLabel,
          phone: service.phone,
          day,
          time,
          clientName,
          clientPhone,
          carId: selectedCar?.id || "",
          carLabel: [
            selectedCar?.name,
            selectedCar?.plate
          ].filter(Boolean).join(" • "),
          workLabel,
          note
        });

        if (request?.carId && onSelectCar) {
          onSelectCar(request.carId);
        }
        navigateToHash("/maintenance");
      } catch (error) {
        const message = error?.message || "Не удалось отправить запись";
        setInlineError(message);
        toast.push(message);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (submittedRequest) {
      return html`
        <${SimplePage} title="Запись принята" backPath=${`/service/${service.id}`}>
          <div className="px-6 py-6 space-y-4">
            <div className="glass-card-light rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style=${{
                    background: "rgba(16, 185, 129, 0.18)",
                    color: "var(--drivex-success)"
                  }}
                >
                  <${Icon} name="check" size=${26} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                    ${service.name}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Сервис принял запись на ${formatRuDate(submittedRequest.day)} в ${submittedRequest.time}.
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                    ${submittedRequest.clientName}${submittedRequest.carLabel ? ` • ${submittedRequest.carLabel}` : ""}
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-4 mt-5">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  ${submittedRequest.workLabel}
                </p>
                ${submittedRequest.note
                  ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                      ${submittedRequest.note}
                    </p>`
                  : null}
              </div>

              <div className="glass-card rounded-3xl p-4 mt-4">
                <p className="text-xs font-semibold tracking-[0.16em]" style=${{ color: "var(--drivex-silver)" }}>
                  СТАТУС РЕМОНТА
                </p>
                <div className="mt-4">
                  <${ServiceRequestStatusTimeline} status=${submittedRequest.status} />
                </div>
              </div>

              <div className="mt-5 flex gap-3 flex-wrap">
                <a href=${`#/service/${service.id}`} className="px-5 py-3 rounded-2xl text-sm font-semibold dx-btn">
                  К сервису
                </a>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl text-sm font-semibold"
                  style=${{
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "var(--drivex-white)"
                  }}
                  onClick=${() => setSubmittedRequest(null)}
                >
                  Изменить запись
                </button>
              </div>
            </div>

            ${isCrmBacked
              ? html`<div className="glass-card rounded-3xl p-5">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Эта запись уже появилась у сервиса в CRM: в расписании и в списке ремонтов.
                  </p>
                </div>`
              : null}
          </div>
        </${SimplePage}>
      `;
    }

    return html`
      <${SimplePage} title="Запись в сервис" backPath=${`/service/${service.id}`}>
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${service.name}
                </p>
                ${service.city || service.address
                  ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-neon-cyan)" }}>
                      ${[service.city, service.address || service.locationLabel].filter(Boolean).join(" • ")}
                    </p>`
                  : null}
              </div>
              ${service.phone
                ? html`<${ServicePhoneButton} phone=${service.phone} compact=${true} label="Позвонить в сервис" />`
                : null}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              ${[
                service.type || service.category,
                service.workingHours,
                service.distance
              ]
                .filter(Boolean)
                .map((chip) => html`
                  <span
                    key=${chip}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style=${{
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--drivex-silver)"
                    }}
                  >
                    ${chip}
                  </span>
                `)}
            </div>
          </div>

          <form className="space-y-4" onSubmit=${handleSubmit}>
            <div className="glass-card-light rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <${SellerField} label="Ваше имя">
                  <${SellerInput}
                    value=${clientName}
                    placeholder="Как к вам обращаться"
                    onInput=${(e) => setClientName(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Телефон">
                  <${SellerInput}
                    value=${clientPhone}
                    placeholder="+992 ..."
                    onInput=${(e) => setClientPhone(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Машина">
                  <${SellerSelect}
                    value=${carId}
                    onChange=${(e) => setCarId(e.target.value)}
                  >
                    ${garageCars.map((car) => html`
                      <option key=${car.id} value=${car.id}>
                        ${car.name}${car.plate ? ` • ${car.plate}` : ""}
                      </option>
                    `)}
                  </${SellerSelect}>
                </${SellerField}>
              </div>
            </div>

            <div className="glass-card-light rounded-3xl p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <${SellerField} label="Дата записи">
                  <${SellerInput}
                    type="date"
                    value=${day}
                    min=${toLocalISODate()}
                    onInput=${(e) => setDay(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField}
                  label="Время"
                  note=${availableSlotOptions.length ? `${availableSlotOptions.length} свободных слотов` : "Свободных слотов нет"}
                >
                  <${SellerSelect}
                    value=${time}
                    onChange=${(e) => setTime(e.target.value)}
                    disabled=${!availableSlotOptions.length}
                  >
                    ${availableSlotOptions.length
                      ? availableSlotOptions.map((slot) => html`
                          <option key=${slot.value} value=${slot.value}>
                            ${slot.label}
                          </option>
                        `)
                      : html`<option value="">Выберите другую дату</option>`}
                  </${SellerSelect}>
                </${SellerField}>
                <${SellerField} label="Что нужно сделать">
                  <${SellerInput}
                    value=${workLabel}
                    placeholder="Например: замена масла и диагностика"
                    onInput=${(e) => setWorkLabel(e.target.value)}
                  />
                </${SellerField}>
                <${SellerField} label="Комментарий" note="Необязательно">
                  <${SellerTextarea}
                    value=${note}
                    placeholder="Что важно учесть по машине или по времени"
                    onInput=${(e) => setNote(e.target.value)}
                  />
                </${SellerField}>
              </div>
            </div>

            ${inlineError
              ? html`<div className="glass-card rounded-3xl p-4" style=${{ color: "var(--drivex-warning)" }}>
                  ${inlineError}
                </div>`
              : null}

            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                    Подтверждение
                  </p>
                  <p className="text-lg font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${day && time ? `${formatRuDate(day)} • ${time}` : "Выберите дату и время"}
                  </p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)", lineHeight: 1.7 }}>
                    Сервис получит имя, телефон, машину и описание работ.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled=${isSubmitting || !availableSlotOptions.length}
                  className="px-6 py-3 rounded-full text-sm font-semibold"
                  style=${{
                    minWidth: "172px",
                    background: isSubmitting || !availableSlotOptions.length
                      ? "rgba(14, 165, 233, 0.22)"
                      : "linear-gradient(135deg, #1fb7f3 0%, #0ea5e9 100%)",
                    color: "var(--drivex-white)",
                    opacity: isSubmitting || !availableSlotOptions.length ? 0.72 : 1
                  }}
                >
                  ${isSubmitting ? "Отправляем..." : "Подтвердить запись"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </${SimplePage}>
    `;
  }

  function ServiceDetailScreen({ serviceId, serviceDirectory }) {
    const runtimeServices =
      serviceDirectory && Array.isArray(serviceDirectory.services)
        ? serviceDirectory.services
        : dedupeServicesById([...recommendedServices, ...nearbyServices]).map((item) => decorateServiceRecord(item));
    const service = runtimeServices.find((item) => String(item.id) === String(serviceId)) || null;
    const toast = useToast();
    const [isSaved, setIsSaved] = useState(false);

    if (!service) {
      return html`
        <${SimplePage} title="Сервис не найден" backPath="/services">
          <div className="px-6 py-6">
            <div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
              Попробуйте открыть другой сервис.
            </div>
          </div>
        </${SimplePage}>
      `;
    }

    const fallbackImage =
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";
    const heroImage = service.image || service.coverImage || fallbackImage;
    const serviceRenderKey = `${String(service.id || "service")}:${heroImage.length}:${heroImage.slice(-24)}`;
    const gallery = Array.from(new Set([heroImage, ...(Array.isArray(service.gallery) ? service.gallery.filter(Boolean) : [])]))
      .filter(Boolean)
      .slice(0, 6);
    const masters = Array.isArray(service.masters) ? service.masters.filter(Boolean).slice(0, 6) : [];
    const ratingValue = Number.isFinite(Number(service.smartRating || service.rating))
      ? Number(service.smartRating || service.rating).toFixed(1)
      : "4.8";
    const reviewCount = Math.max(0, Math.round(Number(service.reviews) || 0));
    const distanceLabel = String(service.distance || "1.2 км").trim();
    const travelMinutes = (() => {
      const normalized = distanceLabel.replace(",", ".").toLowerCase();
      if (normalized.includes("м") && !normalized.includes("км")) return 5;
      const numeric = parseFloat(normalized);
      if (!Number.isFinite(numeric) || numeric <= 0) return 5;
      return Math.max(5, Math.round(numeric * 4.2));
    })();
    const locationMeta = [service.type || service.category || "СТО", distanceLabel, service.city || "Худжанд"]
      .filter(Boolean)
      .join(" • ");
    const shortAddress = [service.city, service.address || service.locationLabel].filter(Boolean).join(", ");
    const workingHours = String(service.workingHours || "").trim();
    const endTime = parseServiceWorkingHoursRange(workingHours).endTime || "18:00";
    const availability = service.available === false
      ? { label: `Занято до ${endTime}`, color: "var(--drivex-danger)" }
      : { label: "Свободно сейчас", color: "var(--drivex-success)" };
    const startingPrice = (() => {
      const typeLabel = `${service.type || ""} ${service.category || ""}`.toLowerCase();
      if (typeLabel.includes("детейл")) return 120;
      if (typeLabel.includes("шин")) return 60;
      if (typeLabel.includes("диаг")) return 50;
      if (typeLabel.includes("элект")) return 70;
      return 80;
    })();
    const returnRate = Math.max(40, Math.round(Number(service.repeatClientsPercent) || 67));
    const monthlyClients = Math.max(18, Math.round((Number(service.completedCars) || 216) / 12));
    const trustChips = [
      { id: "verified", label: "Проверено DRIVEX", color: "var(--drivex-neon-cyan)" },
      { id: "monthly", label: `${monthlyClients} клиентов в месяц`, color: "var(--drivex-electric-blue)" }
    ];
    const summaryMetrics = [
      { id: "rating", icon: "star", value: ratingValue, label: "рейтинг", color: "var(--drivex-warning)" },
      { id: "time", icon: "clock", value: service.averageRepairTime || "25 мин", label: "среднее время", color: "var(--drivex-electric-blue)" },
      { id: "price", icon: "coins", value: `от ${formatTjsPrice(startingPrice)}`, label: "старт по цене", color: "var(--drivex-warning)" },
      { id: "repeat", icon: "repeat", value: `${returnRate}%`, label: "возвращаются", color: "var(--drivex-success)" }
    ];
    const servicesList = (() => {
      const typeLabel = `${service.type || ""} ${service.category || ""}`.toLowerCase();
      if (typeLabel.includes("детейл")) {
        return [
          { id: "wash", title: "Комплексная мойка", duration: "45 мин", price: 80 },
          { id: "salon", title: "Химчистка салона", duration: "2 ч", price: 180 },
          { id: "polish", title: "Полировка кузова", duration: "3 ч", price: 260 },
          { id: "coat", title: "Защитное покрытие", duration: "4 ч", price: 420 }
        ];
      }
      if (typeLabel.includes("шин")) {
        return [
          { id: "tires", title: "Комплект шиномонтажа", duration: "35 мин", price: 60 },
          { id: "balance", title: "Балансировка", duration: "20 мин", price: 40 },
          { id: "repair", title: "Ремонт прокола", duration: "15 мин", price: 25 },
          { id: "storage", title: "Сезонная замена", duration: "30 мин", price: 70 }
        ];
      }
      return [
        { id: "oil", title: "Замена масла", duration: "25 мин", price: 95 },
        { id: "diag", title: "Диагностика", duration: "15 мин", price: 40 },
        { id: "brakes", title: "Проверка тормозов", duration: "30 мин", price: 70 },
        { id: "suspension", title: "Ходовая и подвеска", duration: "45 мин", price: 120 }
      ];
    })();
    const messageHref = (() => {
      const safePhone = String(service.phone || "").trim().replace(/[^\d+]/g, "");
      return safePhone ? `sms:${safePhone}` : "";
    })();

    return html`
      <div className="min-h-screen" style=${{ background: "var(--drivex-black)", paddingBottom: "112px" }}>
        <div className="relative h-[292px] overflow-hidden">
          <img key=${serviceRenderKey} src=${heroImage} alt=${service.name} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style=${{
              background:
                "linear-gradient(180deg, rgba(2, 6, 23, 0.08) 0%, rgba(2, 6, 23, 0.36) 30%, rgba(2, 6, 23, 0.88) 100%)"
            }}
          ></div>
          <div
            className="absolute inset-x-0 top-0 h-32"
            style=${{ background: "linear-gradient(180deg, rgba(2, 6, 23, 0.72) 0%, rgba(2, 6, 23, 0) 100%)" }}
          ></div>

          <div className="absolute inset-x-0 top-0 px-5 pt-5 flex items-center justify-between">
            <a
              href="#/services"
              className="w-11 h-11 rounded-2xl inline-flex items-center justify-center"
              style=${{
                background: "rgba(8, 15, 26, 0.5)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)"
              }}
              aria-label="Назад к сервисам"
            >
              <${Icon} name="chevron-left" size=${20} />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-11 h-11 rounded-2xl inline-flex items-center justify-center"
                style=${{
                  background: isSaved ? alphaBg("var(--drivex-warning)", 0.22) : "rgba(8, 15, 26, 0.5)",
                  color: isSaved ? "var(--drivex-warning)" : "var(--drivex-white)",
                  border: `1px solid ${isSaved ? alphaBg("var(--drivex-warning)", 0.4) : "rgba(255, 255, 255, 0.12)"}`,
                  backdropFilter: "blur(14px)"
                }}
                onClick=${() => {
                  const next = !isSaved;
                  setIsSaved(next);
                  toast.push(next ? "Сервис сохранён" : "Сервис убран из избранного");
                }}
                aria-label=${isSaved ? "Убрать из избранного" : "Сохранить сервис"}
              >
                <${Icon} name="star" size=${18} />
              </button>
              <button
                type="button"
                className="w-11 h-11 rounded-2xl inline-flex items-center justify-center"
                style=${{
                  background: "rgba(8, 15, 26, 0.5)",
                  color: "var(--drivex-white)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(14px)"
                }}
                onClick=${async () => {
                  const shareLink = `${window.location.href.split("#")[0]}#/service/${service.id}`;
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(shareLink);
                      toast.push("Ссылка на сервис скопирована");
                    } else {
                      toast.push("Копирование недоступно");
                    }
                  } catch (error) {
                    toast.push("Не удалось скопировать ссылку");
                  }
                }}
                aria-label="Поделиться сервисом"
              >
                <${Icon} name="copy" size=${18} />
              </button>
            </div>
          </div>

          <div className="absolute left-5 top-20 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold" style=${{
              background: alphaBg(availability.color, 0.18),
              color: availability.color,
              border: `1px solid ${alphaBg(availability.color, 0.28)}`,
              backdropFilter: "blur(10px)"
            }}>
              <span className="w-2 h-2 rounded-full" style=${{ background: availability.color }}></span>
              ${availability.label}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
            <h1 className="text-[30px] leading-tight font-bold" style=${{ color: "var(--drivex-white)" }}>
              ${service.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm">
              <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-warning)" }}>
                <${Icon} name="star" size=${14} />
                ${ratingValue} • ${reviewCount} отзывов
              </span>
              <span className="inline-flex items-center gap-1.5" style=${{ color: "var(--drivex-light-silver)" }}>
                <${Icon} name="map" size=${14} />
                ${distanceLabel} • ${travelMinutes} мин
              </span>
            </div>
            <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
              ${locationMeta}
            </p>
          </div>
        </div>

        <div className="relative z-10 -mt-10 px-5 space-y-4">
          <div className="space-y-3">
            <button
              type="button"
              className="w-full text-left"
              style=${{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                minHeight: "60px",
                padding: "0 18px 0 20px",
                borderRadius: "24px",
                background: "linear-gradient(135deg, #22d3ee 0%, #0ea5e9 52%, #0284c7 100%)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(186, 230, 253, 0.18)",
                boxShadow: "0 18px 36px rgba(14, 165, 233, 0.28)"
              }}
              onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.18em]" style=${{ color: "rgba(224, 242, 254, 0.82)" }}>
                  Онлайн запись
                </span>
                <span className="block text-[18px] font-semibold leading-none mt-1">
                  Записаться сейчас
                </span>
              </span>
              <span
                className="w-9 h-9 rounded-full inline-flex items-center justify-center flex-shrink-0"
                style=${{
                  background: "rgba(255, 255, 255, 0.18)",
                  color: "var(--drivex-white)",
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14)"
                }}
              >
                <${Icon} name="chevron-right" size=${18} />
              </span>
            </button>
            <div className="flex flex-wrap gap-2">
              ${trustChips.map((chip) => html`
                <span
                  key=${chip.id}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style=${{
                    background: alphaBg(chip.color, 0.16),
                    color: chip.color,
                    border: `1px solid ${alphaBg(chip.color, 0.22)}`
                  }}
                >
                  ${chip.label}
                </span>
              `)}
            </div>
          </div>

          <section
            className="rounded-[28px] p-5"
            style=${{
              background: "linear-gradient(145deg, rgba(13, 23, 39, 0.98) 0%, rgba(16, 27, 46, 0.96) 100%)",
              border: "1px solid rgba(6, 182, 212, 0.12)",
              boxShadow: "0 22px 50px rgba(0, 0, 0, 0.24)"
            }}
          >
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px]" style=${{ background: "rgba(148, 163, 184, 0.14)" }}>
              ${summaryMetrics.map((item) => html`
                <div key=${item.id} className="p-4" style=${{ background: "rgba(11, 18, 32, 0.96)" }}>
                  <span className="inline-flex items-center gap-2 text-xs font-medium" style=${{ color: item.color }}>
                    <${Icon} name=${item.icon} size=${14} />
                    ${item.label}
                  </span>
                  <p className="text-[20px] font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                    ${item.value}
                  </p>
                </div>
              `)}
            </div>
          </section>

          <section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="mb-4">
              <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                Услуги
              </h2>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Популярные работы сервиса без лишнего шума
              </p>
            </div>
            <div className="space-y-3">
              ${servicesList.map((item) => html`
                <div
                  key=${item.id}
                  className="rounded-[22px] p-4 flex items-center gap-3"
                  style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      ${item.title}
                    </p>
                    <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                      ${item.duration} • ${formatTjsPrice(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2.5 rounded-full text-sm font-semibold flex-shrink-0"
                    style=${{
                      background: "rgba(14, 165, 233, 0.14)",
                      color: "var(--drivex-electric-blue)",
                      border: "1px solid rgba(14, 165, 233, 0.2)"
                    }}
                    onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
                  >
                    Записаться
                  </button>
                </div>
              `)}
            </div>
            <button
              type="button"
              className="w-full mt-4 px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${() => toast.push("Полный прайс откроем в следующем обновлении")}
            >
              Показать все услуги
            </button>
          </section>

          ${masters.length
            ? html`<section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                    Мастера
                  </h2>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Команда, которой доверяют клиенты
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  ${masters.map((master) => {
                    const initials = String(master.name || "DX")
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase();
                    return html`<div
                      key=${master.id || master.name}
                      className="w-40 flex-shrink-0 rounded-[24px] p-4"
                      style=${{ background: "rgba(255, 255, 255, 0.035)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold"
                        style=${{
                          background: "linear-gradient(145deg, rgba(14, 165, 233, 0.22) 0%, rgba(6, 182, 212, 0.16) 100%)",
                          color: "var(--drivex-white)"
                        }}
                      >
                        ${initials}
                      </div>
                      <p className="font-semibold mt-4" style=${{ color: "var(--drivex-white)" }}>
                        ${master.name}
                      </p>
                      <p className="text-sm mt-1" style=${{ color: "var(--drivex-light-silver)" }}>
                        ${master.experience || "Опытный мастер"}
                      </p>
                      <p className="text-xs mt-2" style=${{ color: "var(--drivex-neon-cyan)", lineHeight: 1.5 }}>
                        ${master.specialty || master.role || "ТО и ремонт"}
                      </p>
                    </div>`;
                  })}
                </div>
              </section>`
            : null}

          ${gallery.length
            ? html`<section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div className="mb-4">
                  <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                    Фото сервиса
                  </h2>
                  <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                    Живые кадры сервиса и рабочей зоны
                  </p>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1" style=${{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                  ${gallery.map((photo, index) => html`
                    <div
                      key=${`${service.id}-gallery-${index}`}
                      className="rounded-[22px] overflow-hidden flex-shrink-0"
                      style=${{
                        width: "160px",
                        minWidth: "160px",
                        flex: "0 0 160px",
                        height: "112px",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        background: "rgba(255, 255, 255, 0.03)"
                      }}
                    >
                      <img src=${photo} alt=${`${service.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  `)}
                </div>
              </section>`
            : null}

          <section className="rounded-[28px] p-5" style=${{ background: "rgba(10, 17, 30, 0.96)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style=${{ background: "rgba(14, 165, 233, 0.12)", color: "var(--drivex-electric-blue)" }}
              >
                <${Icon} name="map" size=${18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[20px] font-bold" style=${{ color: "var(--drivex-white)" }}>
                  Локация
                </h2>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-light-silver)", lineHeight: 1.6 }}>
                  ${shortAddress || "Точка сервиса уже отмечена на карте DRIVEX"}
                </p>
                ${workingHours
                  ? html`<p className="text-xs mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${workingHours}
                    </p>`
                  : null}
              </div>
            </div>
            <button
              type="button"
              className="w-full mt-4 px-4 py-3 rounded-full text-sm font-semibold"
              style=${{
                background: "rgba(255, 255, 255, 0.04)",
                color: "var(--drivex-white)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
              }}
              onClick=${() => navigateToHash("/map")}
            >
              Открыть на карте
            </button>
          </section>
        </div>

        <div className="px-5 pt-3 pb-8">
          <div
            className="rounded-[28px] p-3"
            style=${{
              background: "rgba(8, 15, 26, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              backdropFilter: "blur(18px)"
            }}
          >
            <div className="grid gap-3" style=${{ gridTemplateColumns: "0.9fr 1.3fr" }}>
              <button
                type="button"
                className="px-4 py-3.5 rounded-[20px] text-sm font-semibold"
                style=${{
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "var(--drivex-white)",
                  border: "1px solid rgba(255, 255, 255, 0.08)"
                }}
                onClick=${() => {
                  if (messageHref) {
                    window.location.href = messageHref;
                    return;
                  }
                  toast.push("У сервиса пока нет номера для сообщения");
                }}
              >
                Написать
              </button>
              <button
                type="button"
                className="px-4 py-3.5 rounded-[20px] text-sm font-semibold dx-btn"
                style=${{ boxShadow: "0 16px 34px rgba(14, 165, 233, 0.22)" }}
                onClick=${() => navigateToHash(getServiceBookingPath(service.id))}
              >
                Записаться
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Экспорт в DX.screens для app.js ──────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.ServiceBookingScreen = ServiceBookingScreen;
  DX.screens.ServiceDetailScreen = ServiceDetailScreen;
})();
