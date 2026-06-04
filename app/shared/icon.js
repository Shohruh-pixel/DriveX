// app/shared/icon.js — Icon SVG component (EXACT copy)
(() => {
  'use strict';
  const DX = window.DX;
  const { html } = DX;

  function Icon({ name, size = 24, strokeWidth = 2, className = "", style }) {
    const commonProps = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    };

    const Star = () =>
      html`<svg
        width=${size}
        height=${size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        aria-hidden="true"
        className=${className}
        style=${style}
      >
        <path
          d="M12 17.3 6.8 20l1-5.9L3 9.8l6-.7L12 3.6l3 5.5 6 .7-4.8 4.3 1 5.9z"
        ></path>
      </svg>`;

    switch (name) {
      case "star":
        return Star();
      case "home":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 10.5 12 3l9 7.5"></path>
          <path d="M5 10v10h14V10"></path>
        </svg>`;
      case "map":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"></path>
          <path d="M9 3v15"></path>
          <path d="M15 6v15"></path>
        </svg>`;
      case "wrench":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M14.7 6.3a5 5 0 0 1-6.4 6.4L4 17l3 3 4.3-4.3a5 5 0 0 1 6.4-6.4l-3 3 2 2 3-3Z"
          ></path>
        </svg>`;
      case "bag":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M6 7h12l-1 14H7L6 7Z"></path>
          <path d="M9 7a3 3 0 0 1 6 0"></path>
        </svg>`;
      case "user":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M20 21a8 8 0 0 0-16 0"></path>
          <circle cx="12" cy="8" r="4"></circle>
        </svg>`;
      case "smile":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M8.5 15a5 5 0 0 0 7 0"></path>
          <path d="M9 10h.01"></path>
          <path d="M15 10h.01"></path>
        </svg>`;
      case "phone":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6.1 6.1l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6A2 2 0 0 1 22 16.9z"
          ></path>
        </svg>`;
      case "bell":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
          ></path>
          <path d="M13.7 21a2 2 0 0 1-3.4 0"></path>
        </svg>`;
      case "sun":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v3"></path>
          <path d="M12 19v3"></path>
          <path d="m4.9 4.9 2.1 2.1"></path>
          <path d="m17 17 2.1 2.1"></path>
          <path d="M2 12h3"></path>
          <path d="M19 12h3"></path>
          <path d="m4.9 19.1 2.1-2.1"></path>
          <path d="m17 7 2.1-2.1"></path>
        </svg>`;
      case "coffee":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M6 8h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4V8Z"></path>
          <path d="M16 10h1a2 2 0 0 1 0 4h-1"></path>
          <path d="M8 3v3"></path>
          <path d="M12 3v3"></path>
          <path d="M6 21h10"></path>
        </svg>`;
      case "gift":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="8" width="18" height="5" rx="1"></rect>
          <path d="M12 8v13"></path>
          <path d="M5 13h14v8H5z"></path>
          <path d="M12 8H8.5a2.5 2.5 0 1 1 0-5c2 0 3.5 2 3.5 5Z"></path>
          <path d="M12 8h3.5a2.5 2.5 0 1 0 0-5C13.5 3 12 5 12 8Z"></path>
        </svg>`;
      case "cloud-rain":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M7 18a4 4 0 1 1 .8-7.9A5 5 0 0 1 18 11a3.5 3.5 0 1 1 0 7H7Z"></path>
          <path d="M9 19.5 8 22"></path>
          <path d="M13 19.5 12 22"></path>
          <path d="M17 19.5 16 22"></path>
        </svg>`;
      case "fuel":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 3h10v18H3z"></path>
          <path d="M13 7h2l3 3v10a2 2 0 0 1-2 2h-3"></path>
          <path d="M6 7h4"></path>
        </svg>`;
      case "battery":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="7" width="16" height="10" rx="2"></rect>
          <path d="M19 10h2v4h-2"></path>
          <path d="M7 10v4"></path>
          <path d="M5 12h4"></path>
          <path d="M13 10v4"></path>
        </svg>`;
      case "car":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 14l1-4a4 4 0 0 1 4-3h8a4 4 0 0 1 4 3l1 4"></path>
          <path d="M5 14v4"></path>
          <path d="M19 14v4"></path>
          <circle cx="7" cy="18" r="2"></circle>
          <circle cx="17" cy="18" r="2"></circle>
        </svg>`;
      case "sos":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2 2 22h20L12 2Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>`;
      case "bot":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 8V4"></path>
          <rect x="5" y="8" width="14" height="12" rx="3"></rect>
          <path d="M9 12h.01"></path>
          <path d="M15 12h.01"></path>
          <path d="M9 16h6"></path>
        </svg>`;
      case "search":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="11" cy="11" r="7"></circle>
          <path d="M21 21l-4.3-4.3"></path>
        </svg>`;
      case "filter":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 6h16"></path>
          <path d="M7 12h10"></path>
          <path d="M10 18h4"></path>
        </svg>`;
      case "settings":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 21v-7"></path>
          <path d="M4 10V3"></path>
          <path d="M12 21v-9"></path>
          <path d="M12 8V3"></path>
          <path d="M20 21v-5"></path>
          <path d="M20 12V3"></path>
          <path d="M1 14h6"></path>
          <path d="M9 8h6"></path>
          <path d="M17 16h6"></path>
        </svg>`;
      case "edit":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>`;
      case "lock":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="11" width="18" height="11" rx="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
      case "card":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <path d="M2 10h20"></path>
          <path d="M6 15h2"></path>
          <path d="M10 15h6"></path>
        </svg>`;
      case "calendar":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="3" y="5" width="18" height="16" rx="2"></rect>
          <path d="M16 3v4"></path>
          <path d="M8 3v4"></path>
          <path d="M3 11h18"></path>
        </svg>`;
      case "clock":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>`;
      case "coins":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <ellipse cx="12" cy="6.5" rx="5.5" ry="2.5"></ellipse>
          <path d="M6.5 6.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4"></path>
          <path d="M6.5 10.5v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4"></path>
        </svg>`;
      case "bolt":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M13 2 5 13h5l-1 9 8-11h-5z"></path>
        </svg>`;
      case "repeat":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M17 2l4 4-4 4"></path>
          <path d="M3 11V9a3 3 0 0 1 3-3h15"></path>
          <path d="M7 22l-4-4 4-4"></path>
          <path d="M21 13v2a3 3 0 0 1-3 3H3"></path>
        </svg>`;
      case "check":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M20 6 9 17l-5-5"></path>
        </svg>`;
      case "copy":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`;
      case "folder":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"></path>
        </svg>`;
      case "plus":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>`;
      case "x":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>`;
      case "trash":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>`;
      case "layers":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2 2 7l10 5 10-5-10-5Z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>`;
      case "wash":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M7 3h10"></path>
          <path d="M9 3v4"></path>
          <path d="M15 3v4"></path>
          <path d="M6 7h12l-1 14H7L6 7Z"></path>
        </svg>`;
      case "tire":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 3v2"></path>
          <path d="M12 19v2"></path>
          <path d="M3 12h2"></path>
          <path d="M19 12h2"></path>
        </svg>`;
      case "parking":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M8 3h6a4 4 0 0 1 0 8H8z"></path>
          <path d="M8 11v10"></path>
        </svg>`;
      case "crosshair":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="7"></circle>
          <path d="M12 3v2"></path>
          <path d="M12 19v2"></path>
          <path d="M3 12h2"></path>
          <path d="M19 12h2"></path>
        </svg>`;
      case "chevron-left":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M15 18 9 12l6-6"></path>
        </svg>`;
      case "truck":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M3 7h11v10H3z"></path>
          <path d="M14 10h4l3 3v4h-7z"></path>
          <circle cx="7" cy="17" r="2"></circle>
          <circle cx="18" cy="17" r="2"></circle>
        </svg>`;
      case "scan":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M4 7V4h3"></path>
          <path d="M17 4h3v3"></path>
          <path d="M20 17v3h-3"></path>
          <path d="M7 20H4v-3"></path>
          <path d="M7 12h10"></path>
        </svg>`;
      case "sparkles":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <path d="M12 2l1.5 5L19 9l-5.5 2L12 16l-1.5-5L5 9l5.5-2L12 2Z"></path>
        </svg>`;
      case "play":
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="9"></circle>
          <path d="m10 8 6 4-6 4z"></path>
        </svg>`;
      default:
        return html`<svg ...${commonProps} className=${className} style=${style}>
          <circle cx="12" cy="12" r="10"></circle>
        </svg>`;
    }
  }
  // Export to DX namespace
  DX.Icon = Icon;
})();
