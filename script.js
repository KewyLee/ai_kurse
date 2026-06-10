const PUBLIC_CONFIG_ENDPOINT = "/api/public-config";
const LEAD_SUBMIT_ENDPOINT = "/api/lead";
let telegramPersonalUsername = "";
let telegramChannelUrl = "";

const form = document.getElementById("lead-form");
const errorEl = document.getElementById("form-error");
const successModal = document.getElementById("success-modal");
const closeSuccessBtn = document.getElementById("close-success");
const telegramLink = document.getElementById("telegram-link");
const footerTelegramLink = document.getElementById("footer-telegram-link");
const welcomeOverlay = document.getElementById("welcome-overlay");
const WELCOME_STORAGE_KEY = "ai-blog-welcome-date";
const phoneInput = document.getElementById("phone");
const REFERRAL_STORAGE_KEY = "ai-blog-referral";
const YM_COUNTER_ID = 109420811;
const CTA_GOAL_SELECTOR = '[data-ym-goal="cta_click"], a[href="#cta"]';
let hasTrackedFormStart = false;
let hasTrackedFormVisibility = false;
let isLeadSubmitted = false;

function sendYmGoal(goalName) {
  if (
    goalName &&
    typeof window !== "undefined" &&
    typeof window.ym === "function"
  ) {
    window.ym(YM_COUNTER_ID, "reachGoal", goalName);
  }
}

function getReferralCode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = String(params.get("ref") || "").trim();
    const cleaned = fromUrl.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50);

    if (cleaned) {
      window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, cleaned);
      return cleaned;
    }

    return window.sessionStorage.getItem(REFERRAL_STORAGE_KEY) || "";
  } catch (_error) {
    return "";
  }
}

function isTelegramHref(href) {
  return /^(https?:\/\/(t\.me|telegram\.me)\/|tg:\/\/)/i.test(href);
}

function handleCtaGoalClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest(CTA_GOAL_SELECTOR)) {
    sendYmGoal("cta_click");
  }
}

function handleTelegramGoalClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const link = target.closest("a[href]");
  if (!link) {
    return;
  }

  const href = String(link.getAttribute("href") || "").trim();
  if (!isTelegramHref(href)) {
    return;
  }

  if (link.id === "telegram-link" && isLeadSubmitted) {
    sendYmGoal("telegram_after_submit");
  }

  sendYmGoal("telegram_click");
}

function isTrackableFormControl(element) {
  return element.matches("input:not([type='hidden']), select, textarea, button");
}

function initFormStartTracking() {
  if (!form) {
    return;
  }

  const trackFormStart = (event) => {
    if (hasTrackedFormStart) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element) || !isTrackableFormControl(target)) {
      return;
    }

    hasTrackedFormStart = true;
    sendYmGoal("form_start");

    form.removeEventListener("focus", trackFormStart, true);
    form.removeEventListener("input", trackFormStart);
    form.removeEventListener("click", trackFormStart);
  };

  form.addEventListener("focus", trackFormStart, true);
  form.addEventListener("input", trackFormStart);
  form.addEventListener("click", trackFormStart);
}

function initFormVisibilityTracking() {
  if (!form || hasTrackedFormVisibility) {
    return;
  }

  const trackVisibility = () => {
    if (hasTrackedFormVisibility) {
      return;
    }

    hasTrackedFormVisibility = true;
    sendYmGoal("scroll_to_form");
  };

  if (typeof IntersectionObserver !== "function") {
    const checkVisibility = () => {
      if (hasTrackedFormVisibility) {
        return;
      }

      const rect = form.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        trackVisibility();
        window.removeEventListener("scroll", checkVisibility);
        window.removeEventListener("resize", checkVisibility);
      }
    };

    checkVisibility();
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);
    return;
  }

  const formVisibilityObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          trackVisibility();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0 }
  );

  formVisibilityObserver.observe(form);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

let welcomeTimer = null;
let welcomeClosing = false;

function unlockScroll() {
  document.body.classList.remove("welcome-active");
}

function removeWelcomeListeners() {
  document.removeEventListener("wheel", dismissWelcomeFromInput);
  document.removeEventListener("touchstart", dismissWelcomeFromInput);
  window.removeEventListener("keydown", dismissWelcomeFromInput);
  welcomeOverlay?.removeEventListener("click", dismissWelcomeFromInput);
}

function hideWelcome() {
  if (!welcomeOverlay || !welcomeOverlay.classList.contains("is-visible")) {
    return;
  }

  if (welcomeClosing) {
    return;
  }

  welcomeClosing = true;
  if (welcomeTimer) {
    window.clearTimeout(welcomeTimer);
    welcomeTimer = null;
  }
  removeWelcomeListeners();
  unlockScroll();
  welcomeOverlay.classList.add("is-hiding");
  localStorage.setItem(WELCOME_STORAGE_KEY, getTodayKey());

  window.setTimeout(() => {
    welcomeOverlay.classList.remove("is-visible", "is-hiding");
    welcomeOverlay.setAttribute("aria-hidden", "true");
    welcomeClosing = false;
  }, 1150);
}

function dismissWelcomeFromInput() {
  hideWelcome();
}

function showWelcomeOncePerDay() {
  if (!welcomeOverlay) {
    return;
  }

  if (localStorage.getItem(WELCOME_STORAGE_KEY) === getTodayKey()) {
    return;
  }

  window.scrollTo({ top: 0, behavior: "instant" });

  document.body.classList.add("welcome-active");
  welcomeOverlay.setAttribute("aria-hidden", "false");
  welcomeOverlay.classList.add("is-visible");

  welcomeTimer = window.setTimeout(hideWelcome, 2600);
  document.addEventListener("wheel", dismissWelcomeFromInput, { passive: true });
  document.addEventListener("touchstart", dismissWelcomeFromInput, { passive: true });
  window.addEventListener("keydown", dismissWelcomeFromInput);
  welcomeOverlay.addEventListener("click", dismissWelcomeFromInput);
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

function validatePhone(value) {
  const normalized = value.trim().replace(/[\s\-() ]/g, "");
  if (!normalized) {
    return { isValid: false, message: "Введи номер телефона." };
  }
  if (!/^\+\d{7,15}$/.test(normalized)) {
    return {
      isValid: false,
      message: "Укажи номер с кодом страны, например: +380991234567",
    };
  }
  return { isValid: true, phone: normalized };
}

if (phoneInput) {
  phoneInput.addEventListener("input", (event) => {
    const val = String(event.target.value || "");
    const sanitized = val.replace(/[^\d\s()\-+]/g, "");
    if (sanitized !== val) {
      event.target.value = sanitized;
    }
  });
}

initFormStartTracking();
initFormVisibilityTracking();

document.addEventListener("click", handleCtaGoalClick);
document.addEventListener("click", handleTelegramGoalClick);

function openSuccessModal() {
  successModal.classList.add("is-open");
  successModal.setAttribute("aria-hidden", "false");
}

function closeSuccessModal() {
  successModal.classList.remove("is-open");
  successModal.setAttribute("aria-hidden", "true");
}

async function sendLead(payload) {
  const response = await fetch(LEAD_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

function applyTelegramLinks() {
  const personalLink = telegramPersonalUsername
    ? `https://t.me/${telegramPersonalUsername}`
    : null;

  if (telegramLink && !isLeadSubmitted && personalLink) {
    telegramLink.href = personalLink;
  }

  if (footerTelegramLink) {
    const channelLink = telegramChannelUrl || personalLink;
    if (channelLink) {
      footerTelegramLink.href = channelLink;
    }
  }
}

async function loadPublicConfig() {
  try {
    const response = await fetch(PUBLIC_CONFIG_ENDPOINT, {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const nextTelegramPersonalUsername = String(payload.telegramPersonalUsername || "")
      .trim()
      .replace(/^@/, "");
    const nextTelegramChannelUrl = String(payload.telegramChannelUrl || "").trim();

    if (nextTelegramPersonalUsername) {
      telegramPersonalUsername = nextTelegramPersonalUsername;
    }

    if (nextTelegramChannelUrl) {
      telegramChannelUrl = nextTelegramChannelUrl;
    }

    applyTelegramLinks();
  } catch (_error) {
    // noop
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("");

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const telegram = normalizeTelegram(String(formData.get("telegram") || ""));
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !telegram || !phone) {
    setError("Заполни все поля, пожалуйста.");
    return;
  }

  if (!isValidTelegram(telegram)) {
    setError("Проверь ник в Telegram. Формат: @username");
    return;
  }

  const phoneValidation = validatePhone(phone);

  if (!phoneValidation.isValid) {
    setError(phoneValidation.message);
    return;
  }

  const payload = {
    name,
    telegram,
    phone: phoneValidation.phone,
    source: "landing-ai-blog",
    referral: getReferralCode() || null,
    createdAt: new Date().toISOString(),
  };

  const telegramText = encodeURIComponent(
    `Привет, я ${name}, хочу узнать про обучение. Telegram: ${telegram}, телефон: ${phoneValidation.phone}`
  );

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

  isLeadSubmitted = true;
  sendYmGoal("lead_submit");

  telegramLink.href = `https://t.me/${telegramPersonalUsername}?text=${telegramText}`;
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
const pricingSection = document.querySelector("#pricing");
const pricingCards = document.querySelectorAll("#pricing .pricing-card");
const lastPricingCard = pricingCards[pricingCards.length - 1];
const pricingAfterword = document.querySelector(".pricing-afterword");
let pricingSequenceStarted = false;
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        if (entry.target === lastPricingCard && !pricingSequenceStarted) {
          pricingSequenceStarted = true;
          window.setTimeout(() => {
            pricingSection?.classList.add("pricing-bg-visible");
          }, 280);
          window.setTimeout(() => {
            pricingAfterword?.classList.add("is-visible");
          }, 980);
        }
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
applyTelegramLinks();
loadPublicConfig();
