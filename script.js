const PUBLIC_CONFIG_ENDPOINT = "/api/public-config";
const LEAD_SUBMIT_ENDPOINT = "/api/lead";
let telegramPersonalUsername = "your_username";
let telegramChannelUrl = "https://t.me/your_channel";

const form = document.getElementById("lead-form");
const errorEl = document.getElementById("form-error");
const successModal = document.getElementById("success-modal");
const closeSuccessBtn = document.getElementById("close-success");
const telegramLink = document.getElementById("telegram-link");
const footerTelegramLink = document.getElementById("footer-telegram-link");
const welcomeOverlay = document.getElementById("welcome-overlay");
const WELCOME_STORAGE_KEY = "ai-blog-welcome-date";
const phoneGroup = document.getElementById("phone-group");
const phoneInput = document.getElementById("phone");
const phoneCountryInput = document.getElementById("phone-country");
const countryToggle = document.getElementById("country-toggle");
const countryToggleLabel = document.getElementById("country-toggle-label");
const countryDropdown = document.getElementById("country-dropdown");
const countrySearchInput = document.getElementById("country-search");
const countryOptions = document.getElementById("country-options");
const countryEmptyState = document.getElementById("country-empty");
const POPULAR_COUNTRY_ISO = ["UA", "KZ", "GE"];
const YM_COUNTER_ID = 109420811;
const CTA_GOAL_SELECTOR = '[data-ym-goal="cta_click"], a[href="#cta"]';
const TIMEZONE_TO_COUNTRY_ISO = {
  "Europe/Kyiv": "UA",
  "Europe/Kiev": "UA",
  "Asia/Almaty": "KZ",
  "Asia/Aqtau": "KZ",
  "Asia/Aqtobe": "KZ",
  "Asia/Atyrau": "KZ",
  "Asia/Oral": "KZ",
  "Asia/Qostanay": "KZ",
  "Asia/Qyzylorda": "KZ",
  "Asia/Tbilisi": "GE",
};

const COUNTRY_PHONE_DATA = [
  { iso: "AU", name: "Австралия", flag: "🇦🇺", dialCode: "+61", minLength: 9, maxLength: 9 },
  { iso: "AT", name: "Австрия", flag: "🇦🇹", dialCode: "+43", minLength: 10, maxLength: 13 },
  { iso: "AZ", name: "Азербайджан", flag: "🇦🇿", dialCode: "+994", minLength: 9, maxLength: 9 },
  { iso: "AL", name: "Албания", flag: "🇦🇱", dialCode: "+355", minLength: 9, maxLength: 9 },
  { iso: "DZ", name: "Алжир", flag: "🇩🇿", dialCode: "+213", minLength: 9, maxLength: 9 },
  { iso: "AR", name: "Аргентина", flag: "🇦🇷", dialCode: "+54", minLength: 10, maxLength: 10 },
  { iso: "AM", name: "Армения", flag: "🇦🇲", dialCode: "+374", minLength: 8, maxLength: 8 },
  { iso: "BE", name: "Бельгия", flag: "🇧🇪", dialCode: "+32", minLength: 8, maxLength: 9 },
  { iso: "BG", name: "Болгария", flag: "🇧🇬", dialCode: "+359", minLength: 8, maxLength: 9 },
  { iso: "BR", name: "Бразилия", flag: "🇧🇷", dialCode: "+55", minLength: 10, maxLength: 11 },
  { iso: "GB", name: "Великобритания", flag: "🇬🇧", dialCode: "+44", minLength: 10, maxLength: 10 },
  { iso: "HU", name: "Венгрия", flag: "🇭🇺", dialCode: "+36", minLength: 8, maxLength: 9 },
  { iso: "VN", name: "Вьетнам", flag: "🇻🇳", dialCode: "+84", minLength: 9, maxLength: 10 },
  { iso: "DE", name: "Германия", flag: "🇩🇪", dialCode: "+49", minLength: 10, maxLength: 11 },
  { iso: "GR", name: "Греция", flag: "🇬🇷", dialCode: "+30", minLength: 10, maxLength: 10 },
  { iso: "GE", name: "Грузия", flag: "🇬🇪", dialCode: "+995", minLength: 9, maxLength: 9 },
  { iso: "DK", name: "Дания", flag: "🇩🇰", dialCode: "+45", minLength: 8, maxLength: 8 },
  { iso: "EG", name: "Египет", flag: "🇪🇬", dialCode: "+20", minLength: 10, maxLength: 10 },
  { iso: "IL", name: "Израиль", flag: "🇮🇱", dialCode: "+972", minLength: 8, maxLength: 9 },
  { iso: "IN", name: "Индия", flag: "🇮🇳", dialCode: "+91", minLength: 10, maxLength: 10 },
  { iso: "ID", name: "Индонезия", flag: "🇮🇩", dialCode: "+62", minLength: 9, maxLength: 11 },
  { iso: "IE", name: "Ирландия", flag: "🇮🇪", dialCode: "+353", minLength: 7, maxLength: 10 },
  { iso: "ES", name: "Испания", flag: "🇪🇸", dialCode: "+34", minLength: 9, maxLength: 9 },
  { iso: "IT", name: "Италия", flag: "🇮🇹", dialCode: "+39", minLength: 9, maxLength: 10 },
  { iso: "KZ", name: "Казахстан", flag: "🇰🇿", dialCode: "+7", minLength: 10, maxLength: 10 },
  { iso: "CA", name: "Канада", flag: "🇨🇦", dialCode: "+1", minLength: 10, maxLength: 10 },
  { iso: "CY", name: "Кипр", flag: "🇨🇾", dialCode: "+357", minLength: 8, maxLength: 8 },
  { iso: "CN", name: "Китай", flag: "🇨🇳", dialCode: "+86", minLength: 11, maxLength: 11 },
  { iso: "CO", name: "Колумбия", flag: "🇨🇴", dialCode: "+57", minLength: 10, maxLength: 10 },
  { iso: "LV", name: "Латвия", flag: "🇱🇻", dialCode: "+371", minLength: 8, maxLength: 8 },
  { iso: "LT", name: "Литва", flag: "🇱🇹", dialCode: "+370", minLength: 8, maxLength: 8 },
  { iso: "MY", name: "Малайзия", flag: "🇲🇾", dialCode: "+60", minLength: 9, maxLength: 10 },
  { iso: "MT", name: "Мальта", flag: "🇲🇹", dialCode: "+356", minLength: 8, maxLength: 8 },
  { iso: "MA", name: "Марокко", flag: "🇲🇦", dialCode: "+212", minLength: 9, maxLength: 9 },
  { iso: "MX", name: "Мексика", flag: "🇲🇽", dialCode: "+52", minLength: 10, maxLength: 10 },
  { iso: "NL", name: "Нидерланды", flag: "🇳🇱", dialCode: "+31", minLength: 9, maxLength: 9 },
  { iso: "NO", name: "Норвегия", flag: "🇳🇴", dialCode: "+47", minLength: 8, maxLength: 8 },
  { iso: "AE", name: "ОАЭ", flag: "🇦🇪", dialCode: "+971", minLength: 8, maxLength: 9 },
  { iso: "PK", name: "Пакистан", flag: "🇵🇰", dialCode: "+92", minLength: 10, maxLength: 10 },
  { iso: "PE", name: "Перу", flag: "🇵🇪", dialCode: "+51", minLength: 9, maxLength: 9 },
  { iso: "PL", name: "Польша", flag: "🇵🇱", dialCode: "+48", minLength: 9, maxLength: 9 },
  { iso: "PT", name: "Португалия", flag: "🇵🇹", dialCode: "+351", minLength: 9, maxLength: 9 },
  { iso: "RO", name: "Румыния", flag: "🇷🇴", dialCode: "+40", minLength: 9, maxLength: 9 },
  { iso: "RU", name: "Россия", flag: "🇷🇺", dialCode: "+7", minLength: 10, maxLength: 10 },
  { iso: "SA", name: "Саудовская Аравия", flag: "🇸🇦", dialCode: "+966", minLength: 9, maxLength: 9 },
  { iso: "RS", name: "Сербия", flag: "🇷🇸", dialCode: "+381", minLength: 8, maxLength: 9 },
  { iso: "SG", name: "Сингапур", flag: "🇸🇬", dialCode: "+65", minLength: 8, maxLength: 8 },
  { iso: "SK", name: "Словакия", flag: "🇸🇰", dialCode: "+421", minLength: 9, maxLength: 9 },
  { iso: "SI", name: "Словения", flag: "🇸🇮", dialCode: "+386", minLength: 8, maxLength: 8 },
  { iso: "US", name: "США", flag: "🇺🇸", dialCode: "+1", minLength: 10, maxLength: 10 },
  { iso: "TH", name: "Таиланд", flag: "🇹🇭", dialCode: "+66", minLength: 9, maxLength: 9 },
  { iso: "TR", name: "Турция", flag: "🇹🇷", dialCode: "+90", minLength: 10, maxLength: 10 },
  { iso: "UZ", name: "Узбекистан", flag: "🇺🇿", dialCode: "+998", minLength: 9, maxLength: 9 },
  { iso: "UA", name: "Украина", flag: "🇺🇦", dialCode: "+380", minLength: 9, maxLength: 9 },
  { iso: "FI", name: "Финляндия", flag: "🇫🇮", dialCode: "+358", minLength: 7, maxLength: 12 },
  { iso: "FR", name: "Франция", flag: "🇫🇷", dialCode: "+33", minLength: 9, maxLength: 9 },
  { iso: "HR", name: "Хорватия", flag: "🇭🇷", dialCode: "+385", minLength: 8, maxLength: 9 },
  { iso: "ME", name: "Черногория", flag: "🇲🇪", dialCode: "+382", minLength: 8, maxLength: 8 },
  { iso: "CZ", name: "Чехия", flag: "🇨🇿", dialCode: "+420", minLength: 9, maxLength: 9 },
  { iso: "CH", name: "Швейцария", flag: "🇨🇭", dialCode: "+41", minLength: 9, maxLength: 9 },
  { iso: "SE", name: "Швеция", flag: "🇸🇪", dialCode: "+46", minLength: 7, maxLength: 10 },
  { iso: "EE", name: "Эстония", flag: "🇪🇪", dialCode: "+372", minLength: 7, maxLength: 8 },
  { iso: "ZA", name: "ЮАР", flag: "🇿🇦", dialCode: "+27", minLength: 9, maxLength: 9 },
  { iso: "JP", name: "Япония", flag: "🇯🇵", dialCode: "+81", minLength: 9, maxLength: 10 },
];
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

function blockScroll(e) {
  e.preventDefault();
}

function unlockScroll() {
  document.removeEventListener("wheel", blockScroll);
  document.removeEventListener("touchmove", blockScroll);
  document.body.classList.remove("welcome-active");
}

function hideWelcome() {
  if (!welcomeOverlay || !welcomeOverlay.classList.contains("is-visible")) {
    return;
  }

  welcomeOverlay.classList.add("is-hiding");
  localStorage.setItem(WELCOME_STORAGE_KEY, getTodayKey());

  window.setTimeout(() => {
    welcomeOverlay.classList.remove("is-visible", "is-hiding");
    welcomeOverlay.setAttribute("aria-hidden", "true");
    unlockScroll();
  }, 1150);
}

function showWelcomeOncePerDay() {
  if (!welcomeOverlay) {
    return;
  }

  if (localStorage.getItem(WELCOME_STORAGE_KEY) === getTodayKey()) {
    return;
  }

  window.scrollTo({ top: 0, behavior: "instant" });
  document.addEventListener("wheel", blockScroll, { passive: false });
  document.addEventListener("touchmove", blockScroll, { passive: false });

  document.body.classList.add("welcome-active");
  welcomeOverlay.setAttribute("aria-hidden", "false");
  welcomeOverlay.classList.add("is-visible");

  window.setTimeout(hideWelcome, 2600);
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

let selectedCountry = null;
let filteredCountries = sortCountriesForDisplay(COUNTRY_PHONE_DATA);

function sanitizePhoneDigits(value) {
  return value.replace(/\D/g, "");
}

function sortCountriesForDisplay(items) {
  const popularPosition = new Map(
    POPULAR_COUNTRY_ISO.map((iso, index) => [iso, index])
  );

  return [...items].sort((a, b) => {
    const aRank = popularPosition.has(a.iso)
      ? popularPosition.get(a.iso)
      : Number.POSITIVE_INFINITY;
    const bRank = popularPosition.has(b.iso)
      ? popularPosition.get(b.iso)
      : Number.POSITIVE_INFINITY;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.name.localeCompare(b.name, "ru");
  });
}

function isPopularCountry(iso) {
  return POPULAR_COUNTRY_ISO.includes(iso);
}

function extractRegionFromLocale(locale) {
  if (!locale) {
    return null;
  }

  if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
    try {
      const region = new Intl.Locale(locale).region;
      if (region && /^[A-Za-z]{2}$/.test(region)) {
        return region.toUpperCase();
      }
    } catch (_error) {
      // noop
    }
  }

  const parts = String(locale).split(/[-_]/);

  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (/^[A-Za-z]{2}$/.test(parts[i])) {
      return parts[i].toUpperCase();
    }
  }

  return null;
}

function detectCountryFromClientContext() {
  const timezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";

  if (timezone && TIMEZONE_TO_COUNTRY_ISO[timezone]) {
    return findCountryByIso(TIMEZONE_TO_COUNTRY_ISO[timezone]);
  }

  const localeSources = [];

  if (typeof navigator !== "undefined") {
    if (Array.isArray(navigator.languages)) {
      localeSources.push(...navigator.languages);
    }

    if (navigator.language) {
      localeSources.push(navigator.language);
    }
  }

  for (const locale of localeSources) {
    const regionIso = extractRegionFromLocale(locale);

    if (!regionIso) {
      continue;
    }

    const country = findCountryByIso(regionIso);
    if (country) {
      return country;
    }
  }

  return null;
}

function getPhoneLengthHint(country) {
  if (country.minLength === country.maxLength) {
    return `${country.minLength} цифр`;
  }

  return `${country.minLength}-${country.maxLength} цифр`;
}

function renderCountryOptions(items) {
  if (!countryOptions || !countryEmptyState) {
    return;
  }

  countryOptions.innerHTML = "";

  if (!items.length) {
    countryEmptyState.hidden = false;
    return;
  }

  countryEmptyState.hidden = true;

  items.forEach((country) => {
    const listItem = document.createElement("li");
    const optionButton = document.createElement("button");
    const nameSpan = document.createElement("span");
    const codeSpan = document.createElement("span");
    const isPopular = isPopularCountry(country.iso);
    const isSelected = selectedCountry?.iso === country.iso;

    optionButton.type = "button";
    optionButton.className = "country-option";
    optionButton.setAttribute("role", "option");
    optionButton.setAttribute("aria-selected", isSelected ? "true" : "false");
    optionButton.dataset.iso = country.iso;

    if (isSelected) {
      optionButton.classList.add("is-selected");
    }

    nameSpan.className = "country-option-name";
    nameSpan.textContent = `${country.flag} ${country.name}`;

    codeSpan.className = "country-option-code";
    codeSpan.textContent = country.dialCode;

    if (isPopular) {
      optionButton.classList.add("is-popular");
    }

    optionButton.append(nameSpan, codeSpan);
    optionButton.addEventListener("click", () => {
      setCountrySelection(country);
      closeCountryDropdown();
      phoneInput.focus();
    });

    listItem.append(optionButton);
    countryOptions.append(listItem);
  });
}

function setCountrySelection(country) {
  selectedCountry = country || null;

  if (!phoneCountryInput || !countryToggleLabel || !phoneInput) {
    return;
  }

  phoneCountryInput.value = selectedCountry ? selectedCountry.iso : "";
  countryToggleLabel.textContent = selectedCountry
    ? `${selectedCountry.flag} ${selectedCountry.dialCode}`
    : "Код";
  phoneInput.placeholder = selectedCountry
    ? `Номер (${getPhoneLengthHint(selectedCountry)})`
    : "Номер без кода страны";

  renderCountryOptions(filteredCountries);
}

function openCountryDropdown() {
  if (!countryDropdown || !countryToggle || !countrySearchInput) {
    return;
  }

  countryDropdown.hidden = false;
  countryToggle.classList.add("is-open");
  countryToggle.setAttribute("aria-expanded", "true");
  countrySearchInput.focus();
}

function closeCountryDropdown() {
  if (!countryDropdown || !countryToggle || !countrySearchInput) {
    return;
  }

  countryDropdown.hidden = true;
  countryToggle.classList.remove("is-open");
  countryToggle.setAttribute("aria-expanded", "false");
  countrySearchInput.value = "";
  filteredCountries = sortCountriesForDisplay(COUNTRY_PHONE_DATA);
  renderCountryOptions(filteredCountries);
}

function filterCountries(value) {
  const query = value.trim().toLowerCase();

  const matchedCountries = COUNTRY_PHONE_DATA.filter((country) => {
    const matchField = `${country.name} ${country.iso} ${country.dialCode}`.toLowerCase();
    return matchField.includes(query);
  });

  filteredCountries = sortCountriesForDisplay(matchedCountries);

  renderCountryOptions(filteredCountries);
}

function validatePhoneByCountry(country, rawValue) {
  let digits = sanitizePhoneDigits(rawValue);

  if (!country) {
    return {
      isValid: false,
      message: "Выбери страну для номера.",
    };
  }

  if (!digits) {
    return {
      isValid: false,
      message: "Введи номер телефона.",
    };
  }

  const countryCodeDigits = sanitizePhoneDigits(country.dialCode);
  if (digits.startsWith(countryCodeDigits) && digits.length > country.maxLength) {
    digits = digits.slice(countryCodeDigits.length);
  }

  if (digits.length < country.minLength || digits.length > country.maxLength) {
    return {
      isValid: false,
      message: `Проверь номер для страны ${country.name}: нужно ${getPhoneLengthHint(country)}.`,
    };
  }

  return {
    isValid: true,
    phoneDigits: digits,
    internationalPhone: `${country.dialCode}${digits}`,
  };
}

function initCountryPicker() {
  if (
    !phoneGroup ||
    !phoneInput ||
    !phoneCountryInput ||
    !countryToggle ||
    !countryDropdown ||
    !countrySearchInput ||
    !countryOptions ||
    !countryEmptyState
  ) {
    return;
  }

  const autoDetectedCountry = detectCountryFromClientContext();
  setCountrySelection(autoDetectedCountry);
  renderCountryOptions(filteredCountries);

  phoneInput.addEventListener("input", (event) => {
    const sanitizedValue = String(event.target.value || "").replace(/[^\d\s()-]/g, "");
    event.target.value = sanitizedValue;
  });

  countryToggle.addEventListener("click", () => {
    if (countryDropdown.hidden) {
      openCountryDropdown();
      return;
    }

    closeCountryDropdown();
  });

  countrySearchInput.addEventListener("input", (event) => {
    filterCountries(String(event.target.value || ""));
  });

  countrySearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCountryDropdown();
      countryToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (countryDropdown.hidden || !phoneGroup.contains(event.target)) {
      if (!countryDropdown.hidden) {
        closeCountryDropdown();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !countryDropdown.hidden) {
      closeCountryDropdown();
      countryToggle.focus();
    }
  });
}

initCountryPicker();
initFormStartTracking();
initFormVisibilityTracking();

document.addEventListener("click", handleCtaGoalClick);
document.addEventListener("click", handleTelegramGoalClick);

function findCountryByIso(iso) {
  return COUNTRY_PHONE_DATA.find((country) => country.iso === iso) || null;
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
  const response = await fetch(LEAD_SUBMIT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

function applyTelegramLinks() {
  const personalLink = `https://t.me/${telegramPersonalUsername}`;

  if (telegramLink && !isLeadSubmitted) {
    telegramLink.href = personalLink;
  }

  if (footerTelegramLink) {
    footerTelegramLink.href = telegramChannelUrl || personalLink;
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
  const role = String(formData.get("role") || "").trim();
  const telegram = normalizeTelegram(String(formData.get("telegram") || ""));
  const phone = String(formData.get("phone") || "").trim();
  const phoneCountryIso = String(formData.get("phoneCountry") || "").trim();
  const phoneCountry = findCountryByIso(phoneCountryIso);

  if (!name || !role || !telegram || !phone) {
    setError("Заполни все поля, пожалуйста.");
    return;
  }

  if (!isValidTelegram(telegram)) {
    setError("Проверь ник в Telegram. Формат: @username");
    return;
  }

  const phoneValidation = validatePhoneByCountry(phoneCountry, phone);

  if (!phoneValidation.isValid) {
    setError(phoneValidation.message);
    return;
  }

  const payload = {
    name,
    role,
    telegram,
    phone: phoneValidation.internationalPhone,
    phoneCountry: phoneCountry.name,
    phoneLocal: phoneValidation.phoneDigits,
    source: "landing-ai-blog",
    createdAt: new Date().toISOString(),
  };
  const telegramText = encodeURIComponent(
    `Привет, я ${name}, хочу узнать про обучение. Моя роль: ${role}. Telegram: ${telegram}, телефон: ${phoneValidation.internationalPhone} (${phoneCountry.name})`
  );

  try {
    const isDelivered = await sendLead(payload);
    if (!isDelivered) {
      setError("Не удалось отправить заявку в группу. Попробуй ещё раз.");
      return;
    }
  } catch (_error) {
    setError("Проблема с отправкой заявки в группу. Попробуй ещё раз через минуту.");
    return;
  }

  isLeadSubmitted = true;
  sendYmGoal("lead_submit");

  telegramLink.href = `https://t.me/${telegramPersonalUsername}?text=${telegramText}`;
  openSuccessModal();
  form.reset();
  setCountrySelection(detectCountryFromClientContext());
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
