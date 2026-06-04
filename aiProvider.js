(() => {
  const popularPrompts = [
    "Машина не заводится утром",
    "Стук в подвеске",
    "Это нормальная цена?",
    "Что скоро обслужить?",
    "Подбери сервис рядом"
  ];

  const quickScenarios = [
    {
      id: "symptoms",
      scenarioType: "diagnostic",
      title: "Диагностика по симптомам",
      icon: "bot",
      accent: "var(--drivex-electric-blue)",
      placeholder: "Например: машина троит, плохо заводится утром"
    },
    {
      id: "explain",
      scenarioType: "explain_service",
      title: "Объяснить слова мастера",
      icon: "sparkles",
      accent: "var(--drivex-neon-cyan)",
      placeholder: "Вставь текст, который сказал мастер"
    },
    {
      id: "service-soon",
      scenarioType: "maintenance",
      title: "Что скоро обслужить",
      icon: "wrench",
      accent: "var(--drivex-warning)",
      immediate: true
    },
    {
      id: "nearby-service",
      scenarioType: "find_service",
      title: "Подобрать сервис рядом",
      icon: "map",
      accent: "var(--drivex-success)",
      immediate: true
    }
  ];

  function normalizeText(value) {
    return String(value || "").toLowerCase().replace(/ё/g, "е").trim();
  }

  function parseMileage(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }

  function getConfig() {
    const base = window.DRIVEX_AI_CONFIG || {};
    let localMode = "";
    try {
      localMode = window.localStorage?.getItem("drivex.ai.mode") || "";
    } catch {
      localMode = "";
    }

    return {
      mode: base.mode || localMode || "llm_first",
      endpoint: base.endpoint || "/api/ai/assistant",
      timeoutMs: Number(base.timeoutMs) || 45000,
      debug: Boolean(base.debug)
    };
  }

  function cta() {
    return window.DrivexAIMapper?.defaultCta || [
      { type: "find_service", label: "Найти сервис" },
      { type: "map", label: "Показать на карте" },
      { type: "save", label: "Сохранить" }
    ];
  }

  function make(raw, input) {
    return window.DrivexAIMapper.toDriveXResponse({ ...raw, cta: raw.cta || cta() }, input);
  }

  function maintenanceResponse(input = {}) {
    const mileage = parseMileage(input.vehicle?.mileage);
    const oilDueIn = Math.max(300, 60000 - mileage);
    return make({
      title: "Что скоро нужно обслужить",
      summary: `По пробегу ${input.vehicle?.mileage || "текущей машины"} DriveX видит ближайшие точки внимания.`,
      causesTitle: "Скоро проверить",
      causes: [
        `Замена масла примерно через ${oilDueIn.toLocaleString("ru-RU")} км`,
        "Тормозные колодки и состояние дисков",
        "Кондиционер перед жаркими днями"
      ],
      actionsTitle: "План действий",
      actions: [
        "запланировать ближайшее ТО заранее",
        "сравнить 2–3 сервиса",
        "сохранить напоминание до следующего визита"
      ],
      urgency: "low",
      recommendation: "Проверить масло и тормоза, затем выбрать сервис по ТО"
    }, input);
  }

  function findServiceResponse(input = {}) {
    const message = normalizeText(input.userMessage);
    let serviceType = "диагностика";
    if (message.includes("стук") || message.includes("подвес")) serviceType = "подвеска";
    if (message.includes("масло")) serviceType = "замена масла";
    if (message.includes("тормоз")) serviceType = "тормозная система";

    return make({
      title: "Какой сервис подойдет",
      summary: `Для этого запроса лучше искать сервис по направлению: ${serviceType}.`,
      causesTitle: "Почему именно так",
      causes: [
        "тип сервиса выбран по симптомам и контексту машины",
        "конкретную станцию лучше брать из реальной базы DriveX",
        "не стоит выбирать только по самой низкой цене"
      ],
      actionsTitle: "Что делать сейчас",
      actions: [
        "открыть список сервисов рядом",
        "сравнить рейтинг, расстояние и профиль работ",
        "записаться на диагностику перед ремонтом"
      ],
      urgency: /тормоз|дым|гар|перегрев/.test(message) ? "high" : "medium",
      recommendation: "Показать подходящие сервисы рядом"
    }, input);
  }

  function mockAsk(input = {}) {
    const text = normalizeText(input.userMessage);
    const scenario = input.scenarioType || "diagnostic";

    if (scenario === "maintenance") return maintenanceResponse(input);
    if (scenario === "find_service") return findServiceResponse(input);

    if (!text) {
      return make({
        title: "AI помощник готов",
        summary: "Опиши симптомы или выбери быстрый сценарий, и я соберу понятный план действий.",
        causesTitle: "С чем помогу",
        causes: [
          "разобрать симптомы по описанию",
          "объяснить слова мастера простым языком",
          "подсказать ближайшее обслуживание"
        ],
        actionsTitle: "Что делать сейчас",
        actions: [
          "напиши проблему своими словами",
          "или выбери один из быстрых сценариев",
          "после ответа можно перейти к сервисам"
        ],
        urgency: "low",
        recommendation: "Начни с короткого описания проблемы"
      }, input);
    }

    if (text.includes("не завод")) {
      return make({
        title: "Проблема с запуском",
        summary: "По описанию это может быть связано с системой запуска или питанием.",
        causes: ["слабый аккумулятор", "свечи зажигания", "стартер"],
        actions: ["проверить заряд аккумулятора", "не перегружать стартер", "сделать диагностику"],
        urgency: "medium",
        recommendation: "Показать ближайшие сервисы по диагностике"
      }, input);
    }

    if (text.includes("стук")) {
      return make({
        title: "Стук в подвеске",
        summary: "Стук может быть связан с ходовой частью. Точный источник лучше искать на диагностике.",
        causes: ["износ амортизаторов", "проблемы с сайлентблоками", "рулевые элементы"],
        actions: ["избегать плохих дорог на высокой скорости", "проверить подвеску в ближайшее время"],
        urgency: "medium",
        recommendation: "Показать сервисы по подвеске рядом"
      }, input);
    }

    if (text.includes("масло")) {
      return make({
        title: "Плановое ТО по маслу",
        summary: "Масло и фильтры лучше проверять по пробегу и дате последней замены.",
        causes: ["подходит срок замены масла", "фильтр мог потерять эффективность", "уровень масла стоит проверить"],
        actions: ["сверить пробег и дату замены", "проверить уровень масла на холодном моторе", "записаться на ТО"],
        urgency: "low",
        recommendation: "Показать сервисы для замены масла"
      }, input);
    }

    if (text.includes("цена") || text.includes("нормальная цена")) {
      return make({
        title: "Это нормальная цена?",
        summary: "Цена зависит от типа работ, запчастей и уровня сервиса.",
        causesTitle: "Что это значит",
        causes: ["стоимость без состава работ оценить нельзя"],
        actionsTitle: "Что советую",
        actions: [
          "сравнить 2–3 сервиса",
          "уточнить, входят ли запчасти в стоимость",
          "попросить детализацию работ"
        ],
        urgency: "low",
        recommendation: "Показать сервисы с честными ценами рядом"
      }, input);
    }

    if (scenario === "explain_service" || text.includes("мастер") || text.includes("сайлент") || text.includes("аморт")) {
      return make({
        title: "Что сказал мастер",
        summary: "Перевожу сервисные термины на простой язык и отмечаю, что стоит уточнить.",
        causesTitle: "Что это значит",
        causes: [
          "сайлентблоки гасят вибрации и удары в подвеске",
          "амортизаторы отвечают за устойчивость и мягкость хода",
          "диагностика нужна, чтобы точно найти источник проблемы"
        ],
        actionsTitle: "Что уточнить",
        actions: [
          "какая именно деталь под замену",
          "насколько срочно делать ремонт",
          "что входит в цену: работа, диагностика, запчасти"
        ],
        urgency: "medium",
        recommendation: "Попросить детализацию работ и сравнить 2–3 сервиса"
      }, input);
    }

    return make({
      title: "AI собрал предварительную картину",
      summary: "По описанию лучше начать с базовой диагностики и не гадать наугад.",
      causes: [
        "симптом может быть связан с несколькими узлами",
        "нужны детали: звук, момент проявления, частота",
        "по тексту нельзя поставить точный диагноз"
      ],
      actions: [
        "добавить больше деталей",
        "не откладывать при повторении симптома",
        "обратиться в сервис при шуме, ошибках или запахе гари"
      ],
      urgency: "medium",
      recommendation: "Рекомендуется очная диагностика в сервисе"
    }, input);
  }

  async function apiAsk(input = {}) {
    const config = getConfig();
    const prompt = window.DrivexAIPrompts?.buildPrompt
      ? window.DrivexAIPrompts.buildPrompt(input)
      : { user: input };
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      // Получаем историю из сессии если доступна
      const historyService = window.DrivexAIHistoryService;
      const activeChatId   = historyService ? historyService.getActiveChatId() : null;
      const contextHistory = (historyService && activeChatId)
        ? historyService.getContextHistory(activeChatId, 8)
        : [];

      const requestBody = {
        message:              input.userMessage || "",
        userMessage:          input.userMessage || "",
        scenario:             input.scenarioType || "diagnostic",
        vehicle:              input.vehicle || {},
        location:             input.location || {},
        locale:               input.locale || "ru-RU",
        serviceHistorySummary: input.serviceHistorySummary || "",
        // Новые поля для Claude контекста
        userId:               input.userId  || null,
        chatId:               activeChatId  || null,
        history:              contextHistory,
        prompt
      };

      // Сохраняем сообщение пользователя локально
      if (historyService && activeChatId) {
        historyService.addLocalMessage(activeChatId, {
          role: "user",
          text: input.userMessage,
          createdAt: new Date().toISOString()
        });
      }

      if (config.debug) {
        console.info("[DriveX AI] request", {
          endpoint: config.endpoint,
          body: requestBody
        });
      }

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI API failed: ${response.status}`);
      }

      const payload = await response.json();
      if (config.debug) {
        console.info("[DriveX AI] response", payload);
      }
      const mapped = window.DrivexAIMapper.mapApiResponse(payload, input);

      // Сохраняем ответ AI локально в кэш истории
      const hs2 = window.DrivexAIHistoryService;
      const cid2 = hs2 ? hs2.getActiveChatId() : null;
      if (hs2 && cid2 && mapped) {
        hs2.addLocalMessage(cid2, {
          role:      "assistant",
          answer:    mapped.summary || "",
          response:  mapped,
          createdAt: new Date().toISOString()
        });
      }

      return mapped;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function ask(input = {}) {
    const config = getConfig();
    const mode = String(config.mode || "mock").toLowerCase();
    if (mode === "mock") return mockAsk(input);

    try {
      return await apiAsk(input);
    } catch (error) {
      if (config.debug) {
        console.warn("[DriveX AI] api fallback to mock", error);
      }
      return mockAsk(input);
    }
  }

  window.DrivexAIProvider = {
    getConfig,
    getPopularPrompts: () => [...popularPrompts],
    getQuickScenarios: () => quickScenarios.map((item) => ({ ...item })),
    mockAsk,
    apiAsk,
    ask
  };
})();
