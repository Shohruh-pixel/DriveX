// Garage + ТО + Orders + Trips
(() => {
  'use strict';
  window.DX = window.DX || {};
  const DX = window.DX;
  const html  = DX.html;
  const React = DX.React;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon    = function(p){ return DX.Icon ? DX.Icon(p) : null; };
  const alphaBg = function(){ return DX.alphaBg ? DX.alphaBg(...arguments) : arguments[0]; };
  function useToast(){ return DX.useToast ? DX.useToast() : {push: function(){}}; }
  const navigateToHash = function(p){ DX.navigateToHash && DX.navigateToHash(p); };
  const SimplePage = function(p){ var F=DX.SimplePage; return F ? F(p) : (p.children||null); };
  const formatTjsPrice = function(n){ return DX.formatTjsPrice ? DX.formatTjsPrice(n) : (String(n)+' сом.'); };
  const genId = function(p){ return DX.genId ? DX.genId(p) : (p+'-'+Date.now()); };

  function GarageScreen({ activeCarId, onSelectCar, onAddCar, onRemoveCar }) {
    const toast = useToast();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [plate, setPlate] = useState("");
    const [year, setYear] = useState("");
    const [mileage, setMileage] = useState("");

    const cars = garageCars;
    const activeCar = findGarageCar(activeCarId) || cars[0];
    const submitCar = useCallback(() => {
      const nextCar = normalizeGarageCar({
        name,
        plate,
        year,
        mileageValue: mileage,
        mileage: mileage ? `${Number(mileage).toLocaleString("ru-RU")} км` : ""
      });
      if (!nextCar) {
        toast.push("Введите марку и модель");
        return;
      }
      onAddCar && onAddCar(nextCar);
      setName("");
      setPlate("");
      setYear("");
      setMileage("");
      setShowForm(false);
      toast.push("Автомобиль добавлен");
    }, [mileage, name, onAddCar, plate, toast, year]);

    return html`
      <${SimplePage} title="Мой гараж" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Активный автомобиль
                </p>
                <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${activeCar?.name || "Не выбран"}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="car" size=${28} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 text-sm" style=${{ color: "var(--drivex-silver)" }}>
              <span>${activeCar?.plate || "—"}</span>
              <span>•</span>
              <span>${activeCar?.year || "—"}</span>
              <span>•</span>
              <span>${activeCar?.mileage || "—"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Автопарк
            </h2>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-medium dx-btn"
              onClick=${() => setShowForm((value) => !value)}
            >
              Добавить
            </button>
          </div>

          ${showForm
            ? html`
                <div className="glass-card-light rounded-2xl p-4 space-y-3">
                  <input
                    className="w-full p-3 rounded-xl dx-input"
                    value=${name}
                    onInput=${(e) => setName(e.target.value)}
                    placeholder="Марка и модель, например Toyota Camry"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full p-3 rounded-xl dx-input"
                      value=${plate}
                      onInput=${(e) => setPlate(e.target.value)}
                      placeholder="Госномер"
                    />
                    <input
                      type="number"
                      className="w-full p-3 rounded-xl dx-input"
                      value=${year}
                      onInput=${(e) => setYear(e.target.value)}
                      placeholder="Год"
                    />
                  </div>
                  <input
                    type="number"
                    className="w-full p-3 rounded-xl dx-input"
                    value=${mileage}
                    onInput=${(e) => setMileage(e.target.value)}
                    placeholder="Пробег, км"
                  />
                  <button type="button" className="w-full py-3 rounded-2xl font-bold dx-btn" onClick=${submitCar}>
                    Сохранить автомобиль
                  </button>
                </div>
              `
            : null}

          <div className="space-y-3">
            ${cars.length
              ? cars.map((car) => html`
                <button
                  key=${car.id}
                  type="button"
                  className="w-full glass-card-light rounded-2xl p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02]"
                  onClick=${() => {
                    onSelectCar && onSelectCar(car.id);
                    toast.push(`Активная машина: ${car.name}`);
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style=${{ background: "rgba(14, 165, 233, 0.2)", color: "var(--drivex-electric-blue)" }}
                  >
                    <${Icon} name="car" size=${22} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${car.name}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      ${car.plate} • ${car.year} • ${car.mileage}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style=${{
                      background: car.id === activeCar?.id ? "rgba(6, 182, 212, 0.18)" : "rgba(148, 163, 184, 0.12)",
                      color: car.id === activeCar?.id ? "var(--drivex-neon-cyan)" : "var(--drivex-silver)"
                    }}
                  >
                    ${car.id === activeCar?.id ? "Активна" : "Выбрать"}
                  </span>
                  <span
                    role="button"
                    className="px-3 py-1 rounded-xl text-xs font-bold"
                    style=${{ background: "rgba(239, 68, 68, 0.12)", color: "var(--drivex-danger)" }}
                    onClick=${(event) => {
                      event.stopPropagation();
                      onRemoveCar && onRemoveCar(car.id);
                      toast.push("Автомобиль удалён");
                    }}
                  >
                    Удалить
                  </span>
                </button>
              `)
              : html`
                  <div className="glass-card-light rounded-2xl p-5 text-center">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Гараж пуст</p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      Добавьте свой автомобиль, и журнал, документы и умный уход будут работать именно под ним.
                    </p>
                  </div>
                `}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function SmartCareScreen({ maintenance, activeCarId }) {
    const toast = useToast();
    const activeCar = findGarageCar(activeCarId) || garageCars[0] || null;
    const tasks = buildSmartCareTasks(maintenance, activeCarId);
    const nextTask = tasks[0] || null;

    return html`
      <${SimplePage} title="Умный уход" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <p className="text-sm mb-2" style=${{ color: "var(--drivex-silver)" }}>
              Следующее обслуживание
            </p>
            <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              ${nextTask?.title || (activeCar ? "Всё спокойно" : "Добавьте автомобиль")}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                ${nextTask?.dueDate || (activeCar ? "Срочных задач нет. Добавляйте записи в журнал обслуживания." : "После добавления машины появятся персональные рекомендации.")}
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium dx-btn"
                onClick=${() => {
                  window.location.hash = activeCar ? "#/maintenance-add" : "#/garage";
                }}
              >
                ${activeCar ? "Добавить запись" : "Добавить авто"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              Задачи
            </h2>
            <button
              type="button"
              className="text-sm font-medium"
              style=${{ color: "var(--drivex-neon-cyan)" }}
              onClick=${() => {
                window.location.hash = activeCar ? "#/maintenance-add" : "#/garage";
              }}
            >
              Добавить
            </button>
          </div>

          <div className="space-y-3">
            ${tasks.length
              ? tasks.map((t) => html`
                <div key=${t.id} className="glass-card-light rounded-2xl p-4 flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style=${{ background: alphaBg(t.color, 0.2), color: t.color }}
                  >
                    <${Icon} name="scan" size=${20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                      ${t.title}
                    </p>
                    <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                      ${t.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-xs font-bold"
                    style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
                    onClick=${() => {
                      window.location.hash = "#/maintenance";
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              `)
              : html`
                  <div className="glass-card-light rounded-2xl p-5 text-center">
                    <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${activeCar ? "Нет задач" : "Нет автомобиля"}
                    </p>
                    <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                      ${activeCar
                        ? "Добавьте записи обслуживания или дату техосмотра, и DRIVEX начнёт считать рекомендации."
                        : "Добавьте машину в гараж, чтобы включить умный уход."}
                    </p>
                  </div>
                `}
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  function MaintenanceScreen({ maintenance, spentTotal, activeCarId, onSelectCar, onRemoveRecord, serviceRequests }) {
    const toast = useToast();
    const safeCarId = ensureCarId(activeCarId);
    const activeCar = findGarageCar(safeCarId) || garageCars[0];
    const carState = getMaintenanceCarState(maintenance, safeCarId);
    const records = carState.records;
    const inspection = carState.inspection;
    const relatedServiceRequests = normalizeServiceRequestsList(serviceRequests)
      .filter((item) => item.carId === safeCarId)
      .sort((left, right) =>
        String(right.statusUpdatedAt || right.createdAt || "").localeCompare(
          String(left.statusUpdatedAt || left.createdAt || "")
        )
      );

    const safeSpentTotal = Number.isFinite(Number(spentTotal)) ? Number(spentTotal) : getMaintenanceSpentTotal(maintenance);
    const currentCarSpent = getMaintenanceSpentTotal(maintenance, safeCarId);

    const daysLeft = inspection?.validUntil ? daysUntil(inspection.validUntil) : null;
    const inspectionLabel =
      typeof daysLeft === "number"
        ? daysLeft < 0
          ? "Просрочен"
          : daysLeft === 0
            ? "Сегодня"
            : `${daysLeft} дн`
        : "Не задан";
    const inspectionColor =
      typeof daysLeft === "number"
        ? daysLeft < 0
          ? "var(--drivex-danger)"
          : daysLeft <= 14
            ? "var(--drivex-warning)"
            : "var(--drivex-success)"
        : "var(--drivex-silver)";
    const inspectionSubtitle = inspection?.validUntil
      ? `Действует до ${formatRuDate(inspection.validUntil)}`
      : "Укажите дату окончания техосмотра";

    return html`
      <${SimplePage} title="Журнал обслуживания" backPath="/profile">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  Текущая машина
                </p>
                <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
                  ${activeCar?.name || "Не выбрано"}
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  ${activeCar ? `${activeCar.plate} • ${activeCar.year} • ${activeCar.mileage}` : "Выберите авто"}
                </p>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: "var(--gradient-primary)", color: "var(--drivex-white)" }}
              >
                <${Icon} name="car" size=${28} />
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
              ${garageCars.map((car) => html`
                <button
                  key=${car.id}
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                  style=${{
                    background: car.id === safeCarId ? "rgba(6, 182, 212, 0.18)" : "var(--glass-bg)",
                    color: car.id === safeCarId ? "var(--drivex-neon-cyan)" : "var(--drivex-white)"
                  }}
                  onClick=${() => onSelectCar && onSelectCar(car.id)}
                >
                  ${car.name}
                </button>
              `)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-5 neon-glow-blue">
              <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                По машине
              </p>
              <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${formatTjsPrice(currentCarSpent)}
              </p>
              <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                расходы ${activeCar?.name || "по машине"}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 neon-glow-cyan">
              <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                Всего в системе
              </p>
              <p className="text-xl font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${formatTjsPrice(safeSpentTotal)}
              </p>
              <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                по всем машинам
              </p>
            </div>
          </div>

          <a
            href="#/inspection"
            className="glass-card-light rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style=${{ background: alphaBg(inspectionColor, 0.2), color: inspectionColor }}
            >
              <${Icon} name="scan" size=${22} />
            </div>
            <div className="flex-1">
              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                Техосмотр
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                ${inspectionSubtitle}
              </p>
            </div>
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold"
              style=${{ background: alphaBg(inspectionColor, 0.2), color: inspectionColor }}
            >
              ${inspectionLabel}
            </span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="#/maintenance-add"
              className="py-4 rounded-2xl font-bold text-center dx-btn inline-flex items-center justify-center gap-2"
            >
              <${Icon} name="plus" size=${18} /> Добавить
            </a>
            <button
              type="button"
              className="py-4 rounded-2xl font-bold"
              style=${{ background: "var(--glass-bg)", color: "var(--drivex-white)" }}
              onClick=${() => navigateToHash("/services")}
            >
              Онлайн запись
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <h2 className="text-xl font-bold" style=${{ color: "var(--drivex-white)" }}>
              История и записи ${activeCar?.name || ""}
            </h2>
            <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              ${records.length} записей
            </span>
          </div>

          ${records.length === 0
            ? html`<div className="glass-card-light rounded-2xl p-5" style=${{ color: "var(--drivex-white)" }}>
                Для ${activeCar?.name || "этой машины"} пока нет записей. Добавьте первую работу вручную или создайте онлайн-запись в сервис.
              </div>`
            : html`<div className="space-y-3">
                ${records.map((r) => {
                  const dateLabel = r.date ? formatRuDate(r.date) : "Без даты";
                  const mileageLabel =
                    typeof r.mileage === "number" ? `${formatPrice(r.mileage)} км` : null;
                  const isBooking = r.type === "booking";
                  const linkedRequest = isBooking
                    ? relatedServiceRequests.find((request) => request.id === r.id) || null
                    : null;
                  const linkedStatusMeta = getServiceRequestStatusMeta(linkedRequest?.status);
                  const iconName = isBooking ? "calendar" : "wrench";
                  const accentColor = isBooking ? "var(--drivex-neon-cyan)" : "var(--drivex-electric-blue)";
                  const badgeLabel = isBooking ? "Запись" : "Работа";
                  const amountLabel = isBooking
                    ? r.cost > 0
                      ? formatTjsPrice(r.cost)
                      : linkedRequest
                        ? linkedStatusMeta.label
                        : "Запланировано"
                    : formatTjsPrice(r.cost || 0);
                  return html`
                    <div key=${r.id} className="glass-card-light rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style=${{
                              background: alphaBg(accentColor, 0.2),
                              color: accentColor
                            }}
                          >
                            <${Icon} name=${iconName} size=${22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                                ${r.title}
                              </p>
                              <span
                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                                style=${{
                                  background: alphaBg(accentColor, 0.16),
                                  color: accentColor
                                }}
                              >
                                ${badgeLabel}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style=${{ color: "var(--drivex-silver)" }}>
                              ${dateLabel}${mileageLabel ? ` • ${mileageLabel}` : ""}
                            </p>
                            ${r.service
                              ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                                  ${r.service}
                                </p>`
                              : null}
                            ${linkedRequest
                              ? html`<p className="text-xs mt-2" style=${{ color: linkedStatusMeta.color }}>
                                  Онлайн-статус: ${linkedStatusMeta.label}
                                </p>`
                              : null}
                            ${r.notes
                              ? html`<p className="text-sm mt-2" style=${{ color: "var(--drivex-white)" }}>
                                  ${r.notes}
                                </p>`
                              : null}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold" style=${{ color: linkedRequest ? linkedStatusMeta.color : "var(--drivex-white)" }}>
                            ${amountLabel}
                          </p>
                          <button
                            type="button"
                            className="mt-3 p-2 rounded-xl glass-card"
                            style=${{ color: "var(--drivex-danger)" }}
                            onClick=${() => {
                              onRemoveRecord && onRemoveRecord(safeCarId, r.id);
                              toast.push("Удалено");
                            }}
                            aria-label="Удалить запись"
                          >
                            <${Icon} name="trash" size=${18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                })}
              </div>`}
        </div>
      </${SimplePage}>
    `;
  }

  function MaintenanceAddScreen({ activeCarId, onSelectCar, onAddRecord }) {
    const toast = useToast();
    const [carId, setCarId] = useState(() => ensureCarId(activeCarId));

    const [type, setType] = useState("oil");
    const [date, setDate] = useState(toLocalISODate());
    const [mileage, setMileage] = useState("");
    const [cost, setCost] = useState("");
    const [service, setService] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
      setCarId(ensureCarId(activeCarId));
    }, [activeCarId]);

    const submit = useCallback(() => {
      const option = maintenanceTypeOptions.find((o) => o.id === type);
      const title = option ? option.title : "Обслуживание";
      const dateValue = parseISODate(date) ? date : toLocalISODate();

      const mileageNum = mileage === "" ? null : Number(mileage);
      const costNum = cost === "" ? 0 : Number(cost);

      if (!Number.isFinite(costNum) || costNum < 0) {
        toast.push("Проверьте сумму");
        return;
      }
      if (mileageNum !== null && (!Number.isFinite(mileageNum) || mileageNum < 0)) {
        toast.push("Проверьте пробег");
        return;
      }

      onAddRecord &&
        onAddRecord(carId, {
          id: genId("svc"),
          type,
          title,
          date: dateValue,
          mileage: mileageNum === null ? null : Math.floor(mileageNum),
          cost: Math.floor(costNum),
          service: String(service || "").trim(),
          notes: String(notes || "").trim()
        });

      toast.push("Добавлено");
      window.location.hash = "#/maintenance";
    }, [carId, cost, date, mileage, notes, onAddRecord, service, toast, type]);

    return html`
      <${SimplePage} title="Новая запись" backPath="/maintenance">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Машина
            </label>
            <select
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${carId}
              onChange=${(e) => {
                setCarId(e.target.value);
                onSelectCar && onSelectCar(e.target.value);
              }}
            >
              ${garageCars.map((car) => html`<option key=${car.id} value=${car.id}>${car.name} • ${car.plate}</option>`)}
            </select>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Тип работ
            </label>
            <select
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${type}
              onChange=${(e) => setType(e.target.value)}
            >
              ${maintenanceTypeOptions.map((o) => html`<option key=${o.id} value=${o.id}>${o.title}</option>`)}
            </select>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Дата
            </label>
            <input
              type="date"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${date}
              onInput=${(e) => setDate(e.target.value)}
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Пробег (км)
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${mileage}
              onInput=${(e) => setMileage(e.target.value)}
              placeholder="Например: 54200"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Сумма (₽)
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${cost}
              onInput=${(e) => setCost(e.target.value)}
              placeholder="Например: 6500"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Мастер / Сервис
            </label>
            <input
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)" }}
              value=${service}
              onInput=${(e) => setService(e.target.value)}
              placeholder="Название или контакты (опционально)"
            />
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
              Заметка
            </label>
            <textarea
              className="w-full p-3 rounded-xl outline-none dx-input"
              style=${{ background: "var(--glass-bg)", minHeight: "96px" }}
              value=${notes}
              onInput=${(e) => setNotes(e.target.value)}
              placeholder="Какие запчасти, масло, детали и т.д."
            ></textarea>
          </div>

          <button type="button" className="w-full py-4 rounded-2xl font-bold text-lg dx-btn" onClick=${submit}>
            Сохранить
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function InspectionScreen({ maintenance, activeCarId, onSelectCar, onSave }) {
    const toast = useToast();
    const safeCarId = ensureCarId(activeCarId);
    const activeCar = findGarageCar(safeCarId) || garageCars[0];
    const inspection = getMaintenanceCarState(maintenance, safeCarId).inspection;

    const initialDoneAt = typeof inspection?.doneAt === "string" ? inspection.doneAt : "";
    const initialValidUntil = typeof inspection?.validUntil === "string" ? inspection.validUntil : "";

    const [doneAt, setDoneAt] = useState(parseISODate(initialDoneAt) ? initialDoneAt : toLocalISODate());
    const [validUntil, setValidUntil] = useState(parseISODate(initialValidUntil) ? initialValidUntil : "");

    useEffect(() => {
      setDoneAt(parseISODate(initialDoneAt) ? initialDoneAt : toLocalISODate());
      setValidUntil(parseISODate(initialValidUntil) ? initialValidUntil : "");
    }, [initialDoneAt, initialValidUntil, safeCarId]);

    const submit = useCallback(() => {
      if (!parseISODate(validUntil)) {
        toast.push("Укажите дату окончания");
        return;
      }

      if (!parseISODate(doneAt)) {
        toast.push("Укажите дату прохождения");
        return;
      }

      const dDone = parseISODate(doneAt);
      const dUntil = parseISODate(validUntil);
      if (dDone && dUntil && dUntil.getTime() < dDone.getTime()) {
        toast.push("Окончание не может быть раньше даты прохождения");
        return;
      }

      onSave && onSave(safeCarId, { doneAt, validUntil });
      toast.push("Сохранено");
      window.location.hash = "#/maintenance";
    }, [doneAt, onSave, safeCarId, toast, validUntil]);

    return html`
      <${SimplePage} title="Техосмотр" backPath="/maintenance">
        <div className="px-6 py-6 space-y-4">
          <div className="glass-card rounded-3xl p-6 neon-glow-blue">
            <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
              Для машины
            </p>
            <p className="text-2xl font-bold mt-1" style=${{ color: "var(--drivex-white)" }}>
              ${activeCar?.name || "Не выбрано"}
            </p>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              ${garageCars.map((car) => html`
                <button
                  key=${car.id}
                  type="button"
                  className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap"
                  style=${{
                    background: car.id === safeCarId ? "rgba(14, 165, 233, 0.18)" : "var(--glass-bg)",
                    color: car.id === safeCarId ? "var(--drivex-electric-blue)" : "var(--drivex-white)"
                  }}
                  onClick=${() => onSelectCar && onSelectCar(car.id)}
                >
                  ${car.name}
                </button>
              `)}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-5">
            <h2 className="text-lg font-bold" style=${{ color: "var(--drivex-white)" }}>
              Даты
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
                  Дата прохождения
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-xl outline-none dx-input"
                  style=${{ background: "var(--glass-bg)" }}
                  value=${doneAt}
                  onInput=${(e) => setDoneAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-3" style=${{ color: "var(--drivex-silver)" }}>
                  Действует до
                </label>
                <input
                  type="date"
                  className="w-full p-3 rounded-xl outline-none dx-input"
                  style=${{ background: "var(--glass-bg)" }}
                  value=${validUntil}
                  onInput=${(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
              Подсказка: мы покажем напоминание, когда срок начнёт подходить к концу.
            </p>
          </div>

          <button type="button" className="w-full py-4 rounded-2xl font-bold text-lg dx-btn" onClick=${submit}>
            Сохранить
          </button>
        </div>
      </${SimplePage}>
    `;
  }

  function OrdersScreen({ orders, orderChats }) {
    const safeOrders = normalizeBuyerOrdersList(orders);
    return html`
      <${SimplePage} title="История заказов" backPath="/profile">
        <div className="px-6 py-6 space-y-3">
          ${safeOrders.length
            ? safeOrders.map((order) => html`
                <div
                  key=${order.id}
                  className="rounded-[28px] p-5"
                  style=${{
                    background: "linear-gradient(180deg, rgba(20, 25, 37, 0.94) 0%, rgba(12, 16, 24, 0.98) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.14)"
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                        ${order.id}
                      </p>
                      <p className="text-sm mt-1 truncate" style=${{ color: "var(--drivex-silver)" }}>
                        ${formatRuDate(order.date)} • ${order.storeName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        ${[order.deliveryMethod, `${order.itemsCount} товара`].map((chip, index) => html`
                          <span
                            key=${`${order.id}-buyer-chip-${index}`}
                            className="px-3 py-1.5 rounded-full text-xs"
                            style=${{
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "var(--drivex-silver)",
                              border: "1px solid rgba(255, 255, 255, 0.05)"
                            }}
                          >
                            ${chip}
                          </span>
                        `)}
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style=${{
                        background: alphaBg(order.statusColor, 0.2),
                        color: order.statusColor
                      }}
                    >
                      ${order.statusLabel}
                    </span>
                  </div>

                  <div
                    className="rounded-[24px] p-4 mt-4"
                    style=${{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.05)"
                    }}
                  >
                    <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>
                      ${order.statusNote}
                    </p>
                    <div className="space-y-2 mt-3">
                      ${order.items.map((item) => html`
                        <div key=${`${order.id}-${item.title}`} className="flex items-center justify-between gap-3">
                          <span className="text-sm" style=${{ color: "var(--drivex-white)" }}>
                            ${item.title} × ${item.qty}
                          </span>
                          <span className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                            ${formatTjsPrice((Number(item.qty) || 0) * (Number(item.price) || 0))}
                          </span>
                        </div>
                      `)}
                    </div>
                  </div>

                  <${OrderStatusTimeline} order=${order} variant="buyer" />

                  <${OrderChatSummaryCard}
                    order=${order}
                    orderChats=${orderChats}
                    viewerRole="buyer"
                    actionLabel="Написать продавцу"
                    actionPath=${getBuyerOrderChatPath(order.id)}
                  />

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm" style=${{ color: "var(--drivex-silver)", lineHeight: 1.5 }}>
                        ${order.address || "Адрес будет подтверждён продавцом"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold" style=${{ color: "var(--drivex-white)" }}>
                      ${formatTjsPrice(order.amount)}
                    </p>
                  </div>
                </div>
              `)
            : html`<div className="glass-card-light rounded-2xl p-6 text-center">
                <p className="font-semibold" style=${{ color: "var(--drivex-white)" }}>
                  Заказов пока нет
                </p>
                <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                  После оформления товары появятся здесь, и статусы будут обновляться от продавца.
                </p>
                <a href="#/market" className="inline-flex mt-4 px-4 py-3 rounded-2xl text-sm font-semibold dx-btn">
                  Открыть маркет
                </a>
              </div>`}
        </div>
      </${SimplePage}>
    `;
  }

  function TripsScreen() {
    const trips = [
      { id: 1, date: "Сегодня", from: "Дом", to: "Работа", distance: "12.4 км", time: "18 мин" },
      { id: 2, date: "Вчера", from: "Работа", to: "СТО Премиум", distance: "7.8 км", time: "14 мин" },
      { id: 3, date: "10 марта", from: "Дом", to: "ТЦ Галерея", distance: "5.1 км", time: "11 мин" }
    ];

    return html`
      <${SimplePage} title="История поездок" backPath="/profile">
        <div className="px-6 py-6 space-y-3">
          ${trips.map((t) => html`
            <div key=${t.id} className="glass-card-light rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs" style=${{ color: "var(--drivex-silver)" }}>${t.date}</p>
                <span className="text-xs" style=${{ color: "var(--drivex-neon-cyan)" }}>${t.time}</span>
              </div>
              <p className="font-bold mt-2" style=${{ color: "var(--drivex-white)" }}>
                ${t.from} → ${t.to}
              </p>
              <p className="text-sm mt-1" style=${{ color: "var(--drivex-silver)" }}>
                Дистанция: ${t.distance}
              </p>
            </div>
          `)}
        </div>
      </${SimplePage}>
    `;
  }

  function SavedLocationsScreen({ places = [], onAddPlace, onRemovePlace }) {
    const toast = useToast();
    const [title, setTitle] = useState("");
    const [address, setAddress] = useState("");
    const safePlaces = normalizeSavedPlacesList(places);
    const addPlace = useCallback(() => {
      const place = normalizeSavedPlace({ title, address });
      if (!place) {
        toast.push("Введите название или адрес");
        return;
      }
      onAddPlace && onAddPlace(place);
      setTitle("");
      setAddress("");
      toast.push("Место сохранено");
    }, [address, onAddPlace, title, toast]);

    return html`
      <${SimplePage} title="Сохранённые места" backPath="/profile">
        <div className="px-6 py-6 space-y-3">
          <div className="glass-card-light rounded-2xl p-4 space-y-3">
            <input
              className="w-full p-3 rounded-xl dx-input"
              value=${title}
              onInput=${(e) => setTitle(e.target.value)}
              placeholder="Название: дом, работа, любимый сервис"
            />
            <input
              className="w-full p-3 rounded-xl dx-input"
              value=${address}
              onInput=${(e) => setAddress(e.target.value)}
              placeholder="Адрес"
            />
            <button type="button" className="w-full py-3 rounded-2xl font-bold dx-btn" onClick=${addPlace}>
              Сохранить место
            </button>
          </div>

          ${safePlaces.length
            ? safePlaces.map((p) => html`
            <button
              key=${p.id}
              type="button"
              className="w-full glass-card-light rounded-2xl p-4 flex items-center gap-4 text-left"
              onClick=${() => toast.push(`Сохранённое место: ${p.title}`)}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style=${{ background: alphaBg(p.color, 0.2), color: p.color }}
              >
                <${Icon} name=${p.icon} size=${22} />
              </div>
              <div className="flex-1">
                <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>
                  ${p.title}
                </p>
                <p className="text-sm" style=${{ color: "var(--drivex-silver)" }}>
                  ${p.address}
                </p>
              </div>
              <span
                role="button"
                style=${{ color: "var(--drivex-danger)" }}
                onClick=${(event) => {
                  event.stopPropagation();
                  onRemovePlace && onRemovePlace(p.id);
                  toast.push("Место удалено");
                }}
              >
                ×
              </span>
            </button>
          `)
            : html`
                <div className="glass-card-light rounded-2xl p-5 text-center">
                  <p className="font-bold" style=${{ color: "var(--drivex-white)" }}>Список пуст</p>
                  <p className="text-sm mt-2" style=${{ color: "var(--drivex-silver)" }}>
                    Сохраните свои адреса, чтобы быстро использовать их в заказах и маршрутах.
                  </p>
                </div>
              `}
        </div>
      </${SimplePage}>
    `;
  }


  // ── Export to DX.screens (chain: app-main.js читает отсюда) ──
  DX.screens = DX.screens || {};
  if (typeof GarageScreen !== 'undefined') DX.screens['GarageScreen'] = GarageScreen;
  if (typeof InspectionScreen !== 'undefined') DX.screens['InspectionScreen'] = InspectionScreen;
  if (typeof MaintenanceAddScreen !== 'undefined') DX.screens['MaintenanceAddScreen'] = MaintenanceAddScreen;
  if (typeof MaintenanceScreen !== 'undefined') DX.screens['MaintenanceScreen'] = MaintenanceScreen;
  if (typeof OrdersScreen !== 'undefined') DX.screens['OrdersScreen'] = OrdersScreen;
  if (typeof SavedLocationsScreen !== 'undefined') DX.screens['SavedLocationsScreen'] = SavedLocationsScreen;
  if (typeof SmartCareScreen !== 'undefined') DX.screens['SmartCareScreen'] = SmartCareScreen;
  if (typeof TripsScreen !== 'undefined') DX.screens['TripsScreen'] = TripsScreen;
})();
