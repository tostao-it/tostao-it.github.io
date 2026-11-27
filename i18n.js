// Obsługa języka na stronie Tostao IT.
// Słowniki mieszkają w messages.pl.js / messages.en.js / messages.uk.js / messages.de.js.
//
// Haczyki w HTML:
//   data-i18n             → textContent
//   data-i18n-html        → innerHTML (ciągi z <strong>, <a>, <em>)
//   data-i18n-placeholder → atrybut placeholder
//   data-i18n-title       → atrybut title
//   data-i18n-aria-label  → atrybut aria-label

const translations = window.MESSAGES || {};

const SUPPORTED = ["pl", "en", "uk", "de"];
const DEFAULT_LANG = "pl";
const STORAGE_KEY = "tostao-lang";

// Sprowadź tag BCP-47 (np. "en-GB", "uk-UA") do jednego z obsługiwanych języków.
function normalize(tag) {
  if (!tag) return null;
  let base = tag.toLowerCase().split("-")[0];
  if (base === "ua") base = "uk"; // tolerancja dla zapisu "ua"
  return SUPPORTED.includes(base) ? base : null;
}

// Priorytet: wybór użytkownika (localStorage) > języki przeglądarki > domyślny.
function detectLanguage() {
  try {
    const saved = normalize(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch (e) {
    /* localStorage może być niedostępny (tryb prywatny) — lecimy dalej */
  }

  const candidates =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

  for (const tag of candidates) {
    const lang = normalize(tag);
    if (lang) return lang;
  }
  return DEFAULT_LANG;
}

// Tłumaczenie klucza dla aktywnego języka, z podstawianiem {zmiennych}.
function t(key, vars) {
  const dict = translations[currentLang] || translations[DEFAULT_LANG] || {};
  const fallback = translations[DEFAULT_LANG] || {};

  let str = dict[key];
  if (str === undefined) str = fallback[key];
  if (str === undefined) str = key;

  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] !== undefined ? vars[name] : `{${name}}`
    );
  }
  return str;
}

let currentLang = DEFAULT_LANG;

// Nałóż aktywny język na cały dokument.
function applyLanguage(lang) {
  currentLang = normalize(lang) || DEFAULT_LANG;
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
  });

  // Niech komponenty (<tostao-lang-switch>) i formularz zareagują.
  document.dispatchEvent(
    new CustomEvent("languagechange", { detail: { lang: currentLang } })
  );
}

function setLanguage(lang) {
  const norm = normalize(lang);
  if (!norm) return;
  try {
    localStorage.setItem(STORAGE_KEY, norm);
  } catch (e) {
    /* ignorujemy błędy zapisu */
  }
  applyLanguage(norm);
}

// Wystawiamy pomocnik tłumaczeń innym skryptom (app.js).
window.i18n = {
  t,
  setLanguage,
  get lang() {
    return currentLang;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(detectLanguage());
});
