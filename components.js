// Komponenty webowe strony Tostao IT — bez frameworka, tylko Custom Elements.
//
//   <tostao-lang-switch>   przełącznik PL / EN / UA / DE
//
// Komponent trzyma markup i style w shadow root i reaguje na zdarzenie
// "languagechange" wysyłane przez i18n.js.

(() => {
  const t = (key) => (window.i18n ? window.i18n.t(key) : key);
  const currentLang = () => (window.i18n ? window.i18n.lang : "pl");

  const LANGS = [
    { code: "pl", label: "PL" },
    { code: "en", label: "EN" },
    { code: "uk", label: "UA" },
    { code: "de", label: "DE" },
  ];

  class TostaoLangSwitch extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._onLangChange = (event) => this._reflect(event.detail.lang);
    }

    connectedCallback() {
      this.shadowRoot.innerHTML = `
        <style>
          .wrap {
            display: flex;
            gap: .25rem;
            padding: .2rem;
            border: 1px solid var(--line, #ddd7ca);
            border-radius: 999px;
            background: rgba(255, 255, 255, .5);
          }
          button {
            border: 0;
            background: transparent;
            color: var(--muted, #65686e);
            font: inherit;
            font-size: .78rem;
            font-weight: 700;
            padding: .32em .72em;
            border-radius: 999px;
            cursor: pointer;
            transition: background .2s ease, color .2s ease;
          }
          button:hover { color: var(--ink, #17191c); }
          button.is-active { background: var(--accent, #1f5c4a); color: #fff; }
          button:focus-visible {
            outline: 2px solid var(--accent, #1f5c4a);
            outline-offset: 2px;
          }
        </style>
        <div class="wrap" role="group">
          ${LANGS.map(
            (lang) =>
              `<button type="button" data-lang="${lang.code}" aria-pressed="false">${lang.label}</button>`
          ).join("")}
        </div>
      `;

      this._wrap = this.shadowRoot.querySelector(".wrap");

      this.shadowRoot.querySelectorAll("[data-lang]").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (window.i18n) window.i18n.setLanguage(btn.dataset.lang);
        });
      });

      document.addEventListener("languagechange", this._onLangChange);
      this._reflect(currentLang());
    }

    disconnectedCallback() {
      document.removeEventListener("languagechange", this._onLangChange);
    }

    _reflect(lang) {
      this._wrap.setAttribute("aria-label", t("switch.aria"));
      this.shadowRoot.querySelectorAll("[data-lang]").forEach((btn) => {
        const active = btn.dataset.lang === lang;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    }
  }

  customElements.define("tostao-lang-switch", TostaoLangSwitch);
})();
