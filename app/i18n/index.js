// app/i18n/index.js — useTranslation hook + LangSwitcher component
(() => {
  "use strict";
  const DX = window.DX;
  const { html, useState, useCallback } = DX;

  // Default language
  if (!DX.lang) DX.lang = "ru";

  // Translation function
  DX.t = function(key) {
    const dict = (DX.i18n && DX.i18n[DX.lang]) || (DX.i18n && DX.i18n.ru) || {};
    return dict[key] || key;
  };

  // useTranslation hook — returns t() and current lang, triggers re-render on lang change
  function useTranslation() {
    const [lang, setLang] = useState(() => DX.lang);

    const t = useCallback((key) => {
      const dict = (DX.i18n && DX.i18n[lang]) || (DX.i18n && DX.i18n.ru) || {};
      return dict[key] || key;
    }, [lang]);

    const changeLang = useCallback((newLang) => {
      DX.lang = newLang;
      setLang(newLang);
    }, []);

    return { t, lang, changeLang };
  }

  function LangSwitcher() {
    const { lang, changeLang } = useTranslation();
    const langs = ["ru", "tj", "en"];

    return html`
      <div
        className="flex items-center gap-1 rounded-xl p-1"
        style=${{ background: "rgba(148,163,184,0.08)" }}
      >
        ${langs.map((l) => html`
          <button
            key=${l}
            type="button"
            onClick=${() => changeLang(l)}
            className="px-2 py-1 rounded-lg text-xs font-semibold transition-all"
            style=${{
              background: lang === l ? "rgba(6, 182, 212, 0.18)" : "transparent",
              color: lang === l ? "var(--drivex-neon-cyan)" : "var(--drivex-silver)"
            }}
          >
            ${l.toUpperCase()}
          </button>
        `)}
      </div>
    `;
  }

  DX.useTranslation = useTranslation;
  DX.LangSwitcher = LangSwitcher;
})();
