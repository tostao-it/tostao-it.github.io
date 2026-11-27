// Formularz zgłoszenia: walidacja pól, kontakt, hCaptcha i wysyłka AJAX.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formularz");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form__status");
  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const phoneInput = form.querySelector("#phone");
  const messageInput = form.querySelector("#message");
  const adultInput = form.querySelector("#adult");
  const captchaWrap = form.querySelector(".h-captcha");
  const contactInputs = [emailInput, phoneInput];
  const allInputs = [nameInput, messageInput, ...contactInputs, adultInput];
  const t = (key) => (window.i18n ? window.i18n.t(key) : key);

  // E-mail: coś@domena.tld, bez spacji; domena ma część po kropce (min. 2 znaki).
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Telefon: opcjonalny "+", cyfry i typowe separatory (spacja, myślnik, kropka, nawiasy).
  const PHONE_RE = /^\+?[\d\s().-]+$/;

  // null | "success" | "error" | "captcha" | "contact" | "age"
  let statusState = null;
  let sending = false;

  function renderStatus() {
    status.textContent = "";
    status.removeAttribute("data-state");
    if (!statusState) return;

    if (statusState === "success") {
      status.dataset.state = "ok";
      status.textContent = t("form.success");
    } else if (statusState === "captcha") {
      status.dataset.state = "error";
      status.textContent = t("form.captcha");
    } else if (statusState === "contact") {
      status.dataset.state = "error";
      status.textContent = t("form.contact");
    } else if (statusState === "age") {
      status.dataset.state = "error";
      status.textContent = t("form.adultRequired");
    } else {
      status.dataset.state = "error";
      status.innerHTML = t("form.error");
    }
  }

  function renderSubmitLabel() {
    submitBtn.textContent = sending ? t("form.sending") : t("form.submit");
  }

  function isEmailValid(raw) {
    return EMAIL_RE.test(raw.trim());
  }

  function isPhoneValid(raw) {
    const value = raw.trim();
    if (!PHONE_RE.test(value)) return false;
    const digits = value.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
  }

  // Wymagany jest e-mail albo telefon; każde wypełnione pole musi być poprawne.
  function contactValid() {
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    return (
      (email !== "" || phone !== "") &&
      (email === "" || isEmailValid(email)) &&
      (phone === "" || isPhoneValid(phone))
    );
  }

  // Przycisk aktywny dopiero, gdy imię, wiadomość, poprawny kontakt
  // i potwierdzenie pełnoletności są gotowe.
  function formReady() {
    return (
      nameInput.value.trim().length >= 2 &&
      messageInput.value.trim() !== "" &&
      contactValid() &&
      adultInput.checked
    );
  }

  function markInvalid(input, invalid) {
    input.classList.toggle("is-invalid", invalid);
    if (invalid) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function updateSubmitState() {
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    // Czerwona ramka dopiero, gdy w polu jest już jakaś — ale niepoprawna — wartość.
    markInvalid(emailInput, email !== "" && !isEmailValid(email));
    markInvalid(phoneInput, phone !== "" && !isPhoneValid(phone));

    const ready = formReady();

    // Captcha pojawia się dopiero po wypełnieniu wymaganych pól.
    if (captchaWrap) captchaWrap.classList.toggle("is-active", ready);

    submitBtn.disabled = sending || !ready;
  }

  allInputs.forEach((input) => {
    input.addEventListener("input", () => {
      if (statusState === "contact" || statusState === "age") {
        statusState = null;
        renderStatus();
      }
      updateSubmitState();
    });

    // Autouzupełnianie przeglądarki nie zawsze wysyła zdarzenie "input".
    input.addEventListener("change", updateSubmitState);
  });

  // hCaptcha podstawia token w ukrytym polu "h-captcha-response".
  function captchaSolved() {
    const field = form.querySelector('textarea[name="h-captcha-response"]');
    return Boolean(field && field.value.trim());
  }

  // Token jest jednorazowy — po każdej próbie trzeba odświeżyć widżet.
  function resetCaptcha() {
    try {
      if (window.hcaptcha && typeof window.hcaptcha.reset === "function") {
        window.hcaptcha.reset();
      }
    } catch (error) {
      /* widżet jeszcze nie gotowy — ignorujemy */
    }
  }

  document.addEventListener("languagechange", () => {
    renderSubmitLabel();
    renderStatus();
  });

  window.addEventListener("pageshow", updateSubmitState);

  renderSubmitLabel();
  updateSubmitState();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!formReady()) {
      updateSubmitState();
      if (!contactValid()) {
        statusState = "contact";
        renderStatus();
        emailInput.focus();
      } else if (!adultInput.checked) {
        statusState = "age";
        renderStatus();
        adultInput.focus();
      }
      return;
    }

    if (!captchaSolved()) {
      statusState = "captcha";
      renderStatus();
      return;
    }

    sending = true;
    statusState = null;
    renderStatus();
    renderSubmitLabel();
    updateSubmitState();

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Submission failed");
      }

      form.reset();
      statusState = "success";
    } catch (error) {
      statusState = "error";
    } finally {
      sending = false;
      renderSubmitLabel();
      renderStatus();
      resetCaptcha();
      updateSubmitState();
    }
  });
});
