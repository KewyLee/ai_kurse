const TELEGRAM_USERNAME = "your_username";
const TELEGRAM_WEBHOOK_URL = "";

const form = document.getElementById("lead-form");
const errorEl = document.getElementById("form-error");
const successModal = document.getElementById("success-modal");
const closeSuccessBtn = document.getElementById("close-success");
const telegramLink = document.getElementById("telegram-link");
const welcomeOverlay = document.getElementById("welcome-overlay");
const WELCOME_STORAGE_KEY = "ai-blog-welcome-date";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hideWelcome() {
  if (!welcomeOverlay || !welcomeOverlay.classList.contains("is-visible")) {
    return;
  }

  welcomeOverlay.classList.add("is-hiding");
  document.body.classList.remove("welcome-active");
  localStorage.setItem(WELCOME_STORAGE_KEY, getTodayKey());

  window.setTimeout(() => {
    welcomeOverlay.classList.remove("is-visible", "is-hiding");
    welcomeOverlay.setAttribute("aria-hidden", "true");
  }, 1150);
}

function showWelcomeOncePerDay() {
  if (!welcomeOverlay) {
    return;
  }

  if (localStorage.getItem(WELCOME_STORAGE_KEY) === getTodayKey()) {
    return;
  }

  document.body.classList.add("welcome-active");
  welcomeOverlay.setAttribute("aria-hidden", "false");
  welcomeOverlay.classList.add("is-visible");

  window.setTimeout(hideWelcome, 2600);
  window.addEventListener("wheel", hideWelcome, { once: true, passive: true });
  window.addEventListener("touchmove", hideWelcome, { once: true, passive: true });
  window.addEventListener("keydown", hideWelcome, { once: true });
  welcomeOverlay.addEventListener("click", hideWelcome, { once: true });
}

showWelcomeOncePerDay();

function setError(message) {
  errorEl.textContent = message || "";
}

function normalizeTelegram(value) {
  const handle = value.trim();
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function isValidTelegram(handle) {
  return /^@[A-Za-z0-9_]{5,32}$/.test(handle);
}

function isValidPhone(value) {
  return /^[+()\d\s-]{7,20}$/.test(value.trim());
}

function openSuccessModal() {
  successModal.classList.add("is-open");
  successModal.setAttribute("aria-hidden", "false");
}

function closeSuccessModal() {
  successModal.classList.remove("is-open");
  successModal.setAttribute("aria-hidden", "true");
}

async function sendLead(payload) {
  if (!TELEGRAM_WEBHOOK_URL) {
    return true;
  }

  const response = await fetch(TELEGRAM_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const telegram = normalizeTelegram(String(formData.get("telegram") || ""));
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !role || !telegram || !phone) {
    setError("Заполни все поля, пожалуйста.");
    return;
  }

  if (!isValidTelegram(telegram)) {
    setError("Проверь ник в Telegram. Формат: @username");
    return;
  }

  if (!isValidPhone(phone)) {
    setError("Проверь номер телефона. Пример: +380000000000");
    return;
  }

  const payload = {
    name,
    role,
    telegram,
    phone,
    source: "landing-ai-blog",
    createdAt: new Date().toISOString(),
  };

  try {
    const isDelivered = await sendLead(payload);
    if (!isDelivered) {
      setError("Не удалось отправить заявку. Попробуй ещё раз.");
      return;
    }
  } catch (_error) {
    setError("Проблема с отправкой. Попробуй ещё раз через минуту.");
    return;
  }

  const text = encodeURIComponent(
    `Привет, я ${name}, хочу узнать про обучение. Моя роль: ${role}. Telegram: ${telegram}, телефон: ${phone}`
  );
  telegramLink.href = `https://t.me/${TELEGRAM_USERNAME}?text=${text}`;
  openSuccessModal();
  form.reset();
});

closeSuccessBtn.addEventListener("click", closeSuccessModal);
successModal.addEventListener("click", (event) => {
  if (event.target === successModal) {
    closeSuccessModal();
  }
});

const revealNodes = document.querySelectorAll("[data-reveal]");
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealNodes.forEach((node) => revealObserver.observe(node));

const painSection = document.querySelector(".pain-section");
const thoughtBubbles = document.querySelectorAll("[data-thought]");
const painScrollHint = document.querySelector(".pain-scroll-hint");
let painScrollHintDismissed = false;

function dismissPainScrollHint() {
  if (!painScrollHint || painScrollHintDismissed) {
    return;
  }

  painScrollHintDismissed = true;
  painScrollHint.classList.add("is-hidden");
}

function syncThoughtBubbles() {
  if (!painSection || !thoughtBubbles.length) {
    return;
  }

  const rect = painSection.getBoundingClientRect();
  const scrollableDistance = painSection.offsetHeight - window.innerHeight;
  const progress = Math.min(Math.max(-rect.top / scrollableDistance, 0), 1);
  const activeCount = Math.max(
    1,
    Math.min(thoughtBubbles.length, Math.floor(progress * thoughtBubbles.length) + 1)
  );

  thoughtBubbles.forEach((bubble, index) => {
    bubble.classList.toggle("is-active", index < activeCount);
  });

  if (activeCount >= thoughtBubbles.length) {
    dismissPainScrollHint();
  }
}

window.addEventListener("scroll", syncThoughtBubbles, { passive: true });
window.addEventListener("resize", syncThoughtBubbles);
syncThoughtBubbles();
