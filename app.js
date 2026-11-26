// Formularz zgłoszenia: walidacja, hCaptcha i wysyłka AJAX do Web3Forms.

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formularz");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form__status");
  const t = (key) => (window.i18n ? window.i18n.t(key) : key);

  // null | "success" | "error" | "captcha"
  let statusState = null;

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
    } else {
      status.dataset.state = "error";
      status.innerHTML = t("form.error");
    }
  }

  function renderSubmitLabel() {
    if (!submitBtn.disabled) submitBtn.textContent = t("form.submit");
  }

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

  renderSubmitLabel();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!captchaSolved()) {
      statusState = "captcha";
      renderStatus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("form.sending");
    statusState = null;
    renderStatus();

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
      submitBtn.disabled = false;
      submitBtn.textContent = t("form.submit");
      renderStatus();
      resetCaptcha();
    }
  });
});
