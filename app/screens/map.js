// map.js
(() => {
  'use strict';
  const DX = window.DX;
  const html = DX.html;
  const { useState, useEffect, useCallback, useMemo, useRef } = DX;
  const Icon = DX.Icon;
  const alphaBg = DX.alphaBg;

  function MapScreen({ serviceDirectory }) {
    useEffect(() => {
      let instance = null;
      let cancelled = false;
      let retryId = 0;

      const mountMap = () => {
        if (cancelled || instance) return;
        const mapModule = window.DrivexMapScreen;
        if (!mapModule || typeof mapModule.mount !== "function") {
          retryId = window.setTimeout(mountMap, 120);
          return;
        }
        try {
          instance = mapModule.mount({
            containerId: "map-container",
            serviceDirectory
          });
        } catch (error) {
          const container = document.getElementById("map-container");
          if (container) {
            container.innerHTML = `
              <div class="dx-map-fallback">
                <h2>Карта временно недоступна</h2>
                <p>${String(error?.message || "Не удалось запустить карту.")}</p>
              </div>
            `;
          }
        }
      };

      mountMap();

      return () => {
        cancelled = true;
        window.clearTimeout(retryId);
        if (instance && typeof instance.destroy === "function") instance.destroy();
      };
    }, [serviceDirectory]);

    return html`
      <div id="map-container" className="dx-map-container" aria-label="Карта сервисов DriveX"></div>
    `;
  }

  // ── Экспорт в DX.screens для app.js ──────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.MapScreen = MapScreen;
})();
