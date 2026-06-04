// app/core/utils.js — Pure utility functions
(() => {
  'use strict';
  const DX = window.DX;
  function formatPrice(price) {
    return new Intl.NumberFormat("ru-RU").format(price);
  }

  function formatTjsPrice(price) {
    return `${formatPrice(price)} TJS`;
  }

  function normalizeMarketSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9\u0400-\u04ff]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function slugifyText(value, fallback = "item") {
    return (
      String(value || fallback)
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-z0-9а-яё]+/gi, "-")
        .replace(/^-+|-+$/g, "") || fallback
    );
  }

  function genId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function toLocalISODate(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(iso) {
    const normalized = String(iso || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
    const d = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function formatRuDate(iso) {
    const d = parseISODate(iso);
    if (!d) return "";
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(d);
    } catch {
      return String(iso || "");
    }
  }

  function formatChatTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    try {
      const now = new Date();
      const isSameDay =
        now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();

      return new Intl.DateTimeFormat(
        "ru-RU",
        isSameDay
          ? {
              hour: "2-digit",
              minute: "2-digit"
            }
          : {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }
      ).format(date);
    } catch {
      return String(iso || "");
    }
  }

  function getOrderChatPeerLabel(viewerRole = "buyer") {
    return viewerRole === "seller" ? "Покупатель" : "Продавец";
  }

  function getOrderChatSenderLabel(message, viewerRole = "buyer") {
    const safeViewerRole = viewerRole === "seller" ? "seller" : "buyer";
    return message?.senderRole === safeViewerRole ? "Вы" : getOrderChatPeerLabel(safeViewerRole);
  }

  function getOrderChatPreviewText(message, viewerRole = "buyer") {
    if (!message) {
      return viewerRole === "seller"
        ? "Чат пуст. Покупатель сможет написать по этому заказу."
        : "Чат пуст. Можно написать продавцу по этому заказу.";
    }

    return `${getOrderChatSenderLabel(message, viewerRole)}: ${message.text}`;
  }

  function alphaBg(color, alpha = 0.2) {
    const known = {
      "var(--drivex-electric-blue)": `rgba(14, 165, 233, ${alpha})`,
      "var(--drivex-neon-cyan)": `rgba(6, 182, 212, ${alpha})`,
      "var(--drivex-bright-cyan)": `rgba(34, 211, 238, ${alpha})`,
      "var(--drivex-success)": `rgba(16, 185, 129, ${alpha})`,
      "var(--drivex-warning)": `rgba(245, 158, 11, ${alpha})`,
      "var(--drivex-danger)": `rgba(239, 68, 68, ${alpha})`
    };

    if (known[color]) return known[color];

    if (typeof color === "string" && color.startsWith("#") && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    return `rgba(148, 163, 184, ${alpha})`;
  }

  function parseMileageLabel(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  }


  // Export to DX namespace
  DX.formatPrice = formatPrice;
  DX.formatTjsPrice = formatTjsPrice;
  DX.normalizeMarketSearchText = normalizeMarketSearchText;
  DX.slugifyText = slugifyText;
  DX.genId = genId;
  DX.toLocalISODate = toLocalISODate;
  DX.parseISODate = parseISODate;
  DX.formatRuDate = formatRuDate;
  DX.formatChatTime = formatChatTime;
  DX.alphaBg = alphaBg;
  DX.parseMileageLabel = parseMileageLabel;
  DX.getOrderChatPeerLabel = getOrderChatPeerLabel;
  DX.getOrderChatSenderLabel = getOrderChatSenderLabel;
  DX.getOrderChatPreviewText = getOrderChatPreviewText;
  DX.daysUntil = daysUntil;
})();
