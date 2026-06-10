const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const { URL } = require("url");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const TELEGRAM_PERSONAL_USERNAME = String(process.env.TELEGRAM_PERSONAL_USERNAME || "")
  .trim()
  .replace(/^@/, "");
const TELEGRAM_CHANNEL_URL = String(process.env.TELEGRAM_CHANNEL_URL || "").trim();
const TELEGRAM_BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const TELEGRAM_CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "").trim();
const TELEGRAM_THREAD_ID = String(process.env.TELEGRAM_THREAD_ID || "").trim();

const GOOGLE_SHEETS_SPREADSHEET_ID = String(process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "").trim();
const GOOGLE_SERVICE_ACCOUNT_EMAIL = String(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "")
  .replace(/\\n/g, "\n")
  .trim();
const ALL_LEADS_SHEET_TITLE = "Все заявки";

const STATIC_FILES = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/styles.css", "styles.css"],
  ["/script.js", "script.js"],
  ["/IMG_6336.jpg", "IMG_6336.jpg"],
]);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/public-config") {
      return sendJson(response, 200, {
        telegramPersonalUsername: TELEGRAM_PERSONAL_USERNAME,
        telegramChannelUrl: TELEGRAM_CHANNEL_URL,
      });
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/lead") {
      const payload = await readJsonBody(request);
      const validationError = validateLeadPayload(payload);

      if (validationError) {
        return sendJson(response, 400, { error: validationError });
      }

      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return sendJson(response, 500, {
          error: "Telegram backend is not configured.",
        });
      }

      payload.referral = normalizeReferral(payload.referral);

      await sendTelegramLeadMessage(payload);

      appendLeadToSheets(payload).catch((error) => {
        console.error("Google Sheets logging failed:", error.message);
        if (error.responseBody) {
          console.error("Response:", error.responseBody);
        }
      });

      return sendJson(response, 200, { ok: true });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return sendJson(response, 405, { error: "Method not allowed." });
    }

    return serveStaticFile(requestUrl.pathname, response, request.method === "HEAD");
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode >= 500 ? "Internal server error." : error.message;
    return sendJson(response, statusCode, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const unquotedValue =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue.startsWith("'") && rawValue.endsWith("'")
          ? rawValue.slice(1, -1)
          : rawValue;

    if (!(key in process.env)) {
      process.env[key] = unquotedValue;
    }
  }
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  response.end(body);
}

function serveStaticFile(requestPath, response, isHeadRequest) {
  const normalizedPath = decodeURIComponent(requestPath);
  const targetFile = STATIC_FILES.get(normalizedPath);

  if (!targetFile) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const absolutePath = path.join(__dirname, targetFile);
  const extension = path.extname(absolutePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const fileBuffer = fs.readFileSync(absolutePath);

  response.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": fileBuffer.length,
  });

  if (isHeadRequest) {
    response.end();
    return;
  }

  response.end(fileBuffer);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 1024 * 1024) {
        const error = new Error("Payload is too large.");
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!rawBody) {
        const error = new Error("Request body is required.");
        error.statusCode = 400;
        reject(error);
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (_error) {
        const error = new Error("Invalid JSON payload.");
        error.statusCode = 400;
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function validateLeadPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Lead payload is required.";
  }

  const requiredFields = ["name", "telegram", "phone"];

  for (const fieldName of requiredFields) {
    if (!String(payload[fieldName] || "").trim()) {
      return `Field "${fieldName}" is required.`;
    }
  }

  if (!/^@[A-Za-z0-9_]{5,32}$/.test(String(payload.telegram).trim())) {
    return 'Field "telegram" has invalid format.';
  }

  return "";
}

function escapeTelegramText(value) {
  return String(value).replace(/[&<>]/g, (character) => {
    if (character === "&") {
      return "&amp;";
    }

    if (character === "<") {
      return "&lt;";
    }

    return "&gt;";
  });
}

function normalizeReferral(value) {
  return String(value == null ? "" : value)
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 50);
}

function buildTelegramMessage(payload) {
  const lines = [
    "<b>Новая заявка с лендинга</b>",
    "",
    `<b>Имя:</b> ${escapeTelegramText(payload.name)}`,
    `<b>Telegram:</b> ${escapeTelegramText(payload.telegram)}`,
    `<b>Телефон:</b> ${escapeTelegramText(payload.phone)}`,
    `<b>Источник:</b> ${escapeTelegramText(payload.source || "landing-ai-blog")}`,
  ];

  if (payload.referral) {
    lines.push(`<b>🔗 Реферал:</b> ${escapeTelegramText(payload.referral)}`);
  }

  return lines.join("\n");
}

function sendTelegramLeadMessage(payload) {
  const requestBody = {
    chat_id: TELEGRAM_CHAT_ID,
    text: buildTelegramMessage(payload),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  if (TELEGRAM_THREAD_ID) {
    requestBody.message_thread_id = Number(TELEGRAM_THREAD_ID);
  }

  const body = JSON.stringify(requestBody);

  return new Promise((resolve, reject) => {
    const telegramRequest = https.request(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        family: 4,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (telegramResponse) => {
        let responseBody = "";

        telegramResponse.on("data", (chunk) => {
          responseBody += chunk;
        });

        telegramResponse.on("end", () => {
          if (telegramResponse.statusCode && telegramResponse.statusCode >= 200 && telegramResponse.statusCode < 300) {
            resolve();
            return;
          }

          const error = new Error(
            `Telegram API request failed with status ${telegramResponse.statusCode || 500}: ${responseBody}`
          );
          error.statusCode = 502;
          reject(error);
        });
      }
    );

    telegramRequest.on("error", (error) => {
      error.statusCode = 502;
      reject(error);
    });

    telegramRequest.write(body);
    telegramRequest.end();
  });
}

// ───────────────────────────── Google Sheets ──────────────────────────────
// Чистый Node.js (без зависимостей): JWT через crypto → access token → REST API.
// Лист создаётся с 1 строкой (заголовок), каждый лид добавляет ровно 1 строку.

// "Все заявки" — 9 колонок данных (Дата + Реферал + 7 остальных).
// Телефон: E (idx 4), Оплатил: F (idx 5), Тариф: G (idx 6), %: H (idx 7), Сумма: I (idx 8).
const SHEET_HEADERS_ALL = [
  "Дата", "Реферал", "Имя", "Телеграмм", "Телефон", "Оплатил", "Тариф", "%", "Сумма",
  "", "Всего", "=COUNTA(C2:C)", "Выплаты", "=SUMIF(F2:F,TRUE,I2:I)",
];

// Листы рефералов — 8 колонок данных (без колонки Реферал).
// Телефон: D (idx 3, скрыт), Оплатил: E (idx 4), Тариф: F (idx 5), %: G (idx 6), Сумма: H (idx 7).
const SHEET_HEADERS_REF = [
  "Дата", "Имя", "Телеграмм", "Телефон", "Оплатил", "Тариф", "%", "Сумма",
  "", "Всего", "=COUNTA(B2:B)", "Выплаты", "=SUMIF(E2:E,TRUE,H2:H)",
];

const DEFAULT_REFERRAL_PERCENT = 10;

// Оливковый / светлый / чередующиеся цвета строк.
const COLOR_HEADER  = { red: 0.29,  green: 0.369, blue: 0.227 };
const COLOR_SUMMARY = { red: 0.941, green: 0.957, blue: 0.925 };
const COLOR_ROW_ODD = { red: 1,     green: 1,     blue: 1     };
const COLOR_ROW_EVN = { red: 0.969, green: 0.976, blue: 0.957 };

let cachedGoogleToken = "";
let cachedGoogleTokenExpiry = 0;

function isSheetsConfigured() {
  return Boolean(
    GOOGLE_SHEETS_SPREADSHEET_ID &&
      GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function formatLeadDate(isoValue) {
  const date = isoValue ? new Date(isoValue) : new Date();
  const parsed = Number.isNaN(date.getTime()) ? new Date() : date;
  const pad = (v) => String(v).padStart(2, "0");
  return (
    `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()} ` +
    `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  );
}

function httpsJsonRequest(url, method, body, headers) {
  const finalHeaders = Object.assign({}, headers);
  if (body) finalHeaders["Content-Length"] = Buffer.byteLength(body);

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, family: 4, headers: finalHeaders }, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        const status = res.statusCode || 500;
        if (status >= 200 && status < 300) {
          try { resolve(raw ? JSON.parse(raw) : {}); }
          catch (e) { reject(e); }
          return;
        }
        const err = new Error(`${method} ${url.split("?")[0]} → ${status}`);
        err.statusCode = status;
        err.responseBody = raw;
        console.error("[Sheets API]", status, raw.slice(0, 300));
        reject(err);
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getGoogleAccessToken() {
  if (cachedGoogleToken && Date.now() < cachedGoogleTokenExpiry - 60000) {
    return cachedGoogleToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const hdr = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cls = base64Url(JSON.stringify({
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));
  const si = `${hdr}.${cls}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(si);
  const sig = signer.sign(GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    .toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const tokenBody =
    "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer" +
    `&assertion=${encodeURIComponent(`${si}.${sig}`)}`;

  const resp = await httpsJsonRequest("https://oauth2.googleapis.com/token", "POST", tokenBody, {
    "Content-Type": "application/x-www-form-urlencoded",
  });

  cachedGoogleToken = resp.access_token;
  cachedGoogleTokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
  return cachedGoogleToken;
}

function sheetsApiUrl(suffix) {
  return `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SPREADSHEET_ID}${suffix}`;
}

function batchUpdate(token, requests) {
  return httpsJsonRequest(
    sheetsApiUrl(":batchUpdate"),
    "POST",
    JSON.stringify({ requests }),
    { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  );
}

function getSpreadsheetSheets(token) {
  return httpsJsonRequest(
    sheetsApiUrl("?fields=sheets(properties(sheetId,title))"),
    "GET",
    null,
    { Authorization: `Bearer ${token}` }
  ).then((data) => data.sheets || []);
}

// Создаёт лист с 2 строками (заголовок + 1 пустая), форматирует только строку 1.
// isAllLeads=true → SHEET_HEADERS_ALL (9 колонок данных), иначе SHEET_HEADERS_REF (8 колонок).
// Возвращает числовой sheetId.
async function ensureSheet(token, title, existingSheets, isAllLeads) {
  const existing = existingSheets.find((s) => s.properties.title === title);
  if (existing) {
    // Авто-миграция: проверяем что B1 соответствует ожидаемой схеме.
    // "Все заявки" должен иметь B1="Реферал"; реферальный лист — B1="Имя".
    const expectedB1 = isAllLeads ? "Реферал" : "Имя";
    try {
      const check = await httpsJsonRequest(
        sheetsApiUrl(`/values/${encodeURIComponent(`'${title}'!B1`)}`),
        "GET", null,
        { Authorization: `Bearer ${token}` }
      );
      const actualB1 = check.values && check.values[0] && check.values[0][0];
      if (actualB1 === expectedB1) return existing.properties.sheetId;
      // Неверная схема — удаляем и пересоздаём.
      console.log(`[Sheets] Migrating "${title}": B1="${actualB1}", expected "${expectedB1}"`);
      await batchUpdate(token, [{ deleteSheet: { sheetId: existing.properties.sheetId } }]);
      const idx = existingSheets.findIndex((s) => s.properties.title === title);
      if (idx !== -1) existingSheets.splice(idx, 1);
    } catch (_e) {
      return existing.properties.sheetId;
    }
  }

  const headers = isAllLeads ? SHEET_HEADERS_ALL : SHEET_HEADERS_REF;
  const dataColCount = isAllLeads ? 9 : 8;
  const summaryStartCol = dataColCount + 1; // пропускаем пустую колонку

  // Шаг 1: создать лист (2 строки, 14 колонок).
  let newSheetId;
  try {
    const created = await batchUpdate(token, [
      { updateSpreadsheetProperties: { properties: { locale: "en_US" }, fields: "locale" } },
      { addSheet: { properties: { title, gridProperties: { rowCount: 2, columnCount: 14, frozenRowCount: 1 } } } },
    ]);
    newSheetId = created.replies[1].addSheet.properties.sheetId;
  } catch (err) {
    if (String(err.responseBody || "").includes("already exists")) {
      const refreshed = await getSpreadsheetSheets(token);
      const found = refreshed.find((s) => s.properties.title === title);
      refreshed.forEach((s) => {
        if (!existingSheets.some((e) => e.properties.title === s.properties.title)) {
          existingSheets.push(s);
        }
      });
      return found ? found.properties.sheetId : 0;
    }
    throw err;
  }

  // Шаг 2: записать заголовки через values.update (USER_ENTERED — формулы правильно интерпретируются).
  await httpsJsonRequest(
    sheetsApiUrl(`/values/${encodeURIComponent(`'${title}'!A1`)}?valueInputOption=USER_ENTERED`),
    "PUT",
    JSON.stringify({ values: [headers] }),
    { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  );

  // Шаг 3: форматировать строку заголовка + сводные ячейки.
  const fmtRequests = [
    {
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: dataColCount },
        cell: { userEnteredFormat: {
          backgroundColor: COLOR_HEADER,
          textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
          horizontalAlignment: "CENTER",
        }},
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
      },
    },
    {
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: summaryStartCol, endColumnIndex: summaryStartCol + 4 },
        cell: { userEnteredFormat: {
          backgroundColor: COLOR_SUMMARY,
          textFormat: { bold: true, foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 } },
        }},
        fields: "userEnteredFormat(backgroundColor,textFormat)",
      },
    },
  ];

  // В листах рефералов скрываем телефон (D, idx 3).
  if (!isAllLeads) {
    fmtRequests.push({
      updateDimensionProperties: {
        range: { sheetId: newSheetId, dimension: "COLUMNS", startIndex: 3, endIndex: 4 },
        properties: { hiddenByUser: true },
        fields: "hiddenByUser",
      },
    });
  }

  await batchUpdate(token, fmtRequests);

  // Шаг 4: создать Google Sheets Table (фильтры, сортировка, авторасширение).
  // Если API не поддерживается — fallback на базовый фильтр.
  let tableCreated = false;
  try {
    await httpsJsonRequest(
      sheetsApiUrl("/tables"),
      "POST",
      JSON.stringify({
        range: {
          sheetId: newSheetId,
          startRowIndex: 0,
          startColumnIndex: 0,
          endColumnIndex: dataColCount,
        },
      }),
      { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    );
    tableCreated = true;
    console.log("[Sheets] ✓ Table created in", title);
  } catch (err) {
    console.warn("[Sheets] Table API unavailable, using basic filter:", err.message);
  }

  if (!tableCreated) {
    await batchUpdate(token, [{
      setBasicFilter: {
        filter: { range: { sheetId: newSheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: dataColCount } },
      },
    }]);
  }

  existingSheets.push({ properties: { title, sheetId: newSheetId } });
  return newSheetId;
}

// Добавляет ровно 1 строку в лист: расширяет сетку на 1, пишет данные + форматирование.
// isAllLeads=true → "Все заявки" (9 колонок: A=Дата, B=Реферал, C=Имя, D=TG, E=Тел, F=Оплатил, G=Тариф, H=%, I=Сумма).
// isAllLeads=false → лист реферала (8 колонок: A=Дата, B=Имя, C=TG, D=Тел, E=Оплатил, F=Тариф, G=%, H=Сумма).
async function appendLeadRow(token, sheetId, sheetTitle, payload, isAllLeads) {
  // Читаем колонку A только для подсчёта строк с данными (без validation-пустышек).
  const colA = await httpsJsonRequest(
    sheetsApiUrl(`/values/${encodeURIComponent(`'${sheetTitle}'!A:A`)}`),
    "GET",
    null,
    { Authorization: `Bearer ${token}` }
  );

  // values[0] = заголовок. Длина массива = количество непустых строк в A.
  const dataRowCount = Array.isArray(colA.values) ? colA.values.length : 1;
  const rowIndex = dataRowCount; // 0-based: 0=row1(заголовок), 1=row2(первый лид)…

  // Расширяем лист ровно на 1 строку — не больше, не меньше.
  await batchUpdate(token, [
    { appendDimension: { sheetId, dimension: "ROWS", length: 1 } },
  ]);

  const rowNum = rowIndex + 1; // 1-based для формул
  const rowBg = rowIndex % 2 === 0 ? COLOR_ROW_EVN : COLOR_ROW_ODD;
  const dataRange = { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1 };

  let rowValues, checkboxCol, tariffCol, sumCol, totalCols, sumFormula;

  if (isAllLeads) {
    // "Все заявки": F=Оплатил(idx5), G=Тариф(idx6), H=%(idx7), I=Сумма(idx8)
    sumFormula = `=IF(G${rowNum}="","",G${rowNum}*H${rowNum}/100)`;
    checkboxCol = 5;
    tariffCol   = 6;
    sumCol      = 8;
    totalCols   = 9;
    rowValues = [
      { userEnteredValue: { stringValue: formatLeadDate(payload.createdAt) } },
      { userEnteredValue: { stringValue: String(payload.referral || "").trim() } },
      { userEnteredValue: { stringValue: String(payload.name     || "").trim() } },
      { userEnteredValue: { stringValue: String(payload.telegram || "").trim() } },
      { userEnteredValue: { stringValue: String(payload.phone    || "").trim() } },
      { userEnteredValue: { boolValue: false } },
      { userEnteredValue: { stringValue: "" } },
      { userEnteredValue: { numberValue: DEFAULT_REFERRAL_PERCENT } },
      { userEnteredValue: { formulaValue: sumFormula } },
    ];
  } else {
    // Лист реферала: E=Оплатил(idx4), F=Тариф(idx5), G=%(idx6), H=Сумма(idx7)
    sumFormula = `=IF(F${rowNum}="","",F${rowNum}*G${rowNum}/100)`;
    checkboxCol = 4;
    tariffCol   = 5;
    sumCol      = 7;
    totalCols   = 8;
    rowValues = [
      { userEnteredValue: { stringValue: formatLeadDate(payload.createdAt) } },
      { userEnteredValue: { stringValue: String(payload.name     || "").trim() } },
      { userEnteredValue: { stringValue: String(payload.telegram || "").trim() } },
      { userEnteredValue: { stringValue: String(payload.phone    || "").trim() } },
      { userEnteredValue: { boolValue: false } },
      { userEnteredValue: { stringValue: "" } },
      { userEnteredValue: { numberValue: DEFAULT_REFERRAL_PERCENT } },
      { userEnteredValue: { formulaValue: sumFormula } },
    ];
  }

  await batchUpdate(token, [
    // Данные.
    {
      updateCells: {
        rows: [{ values: rowValues }],
        fields: "userEnteredValue",
        start: { sheetId, rowIndex, columnIndex: 0 },
      },
    },
    // Чекбокс "Оплатил".
    {
      setDataValidation: {
        range: { ...dataRange, startColumnIndex: checkboxCol, endColumnIndex: checkboxCol + 1 },
        rule: { condition: { type: "BOOLEAN" }, strict: true },
      },
    },
    // Выпадающий список тарифов.
    {
      setDataValidation: {
        range: { ...dataRange, startColumnIndex: tariffCol, endColumnIndex: tariffCol + 1 },
        rule: {
          condition: {
            type: "ONE_OF_LIST",
            values: [{ userEnteredValue: "99" }, { userEnteredValue: "149" }, { userEnteredValue: "249" }],
          },
          showCustomUi: true,
          strict: false,
        },
      },
    },
    // Денежный формат "Сумма".
    {
      repeatCell: {
        range: { ...dataRange, startColumnIndex: sumCol, endColumnIndex: sumCol + 1 },
        cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "€#,##0.00" } } },
        fields: "userEnteredFormat.numberFormat",
      },
    },
    // Фон строки (чередование).
    {
      repeatCell: {
        range: { ...dataRange, startColumnIndex: 0, endColumnIndex: totalCols },
        cell: { userEnteredFormat: { backgroundColor: rowBg } },
        fields: "userEnteredFormat.backgroundColor",
      },
    },
  ]);

  console.log("[Sheets] ✓ Row", rowNum, "written in", sheetTitle);
}

async function appendLeadToSheets(payload) {
  if (!isSheetsConfigured()) return;

  const token = await getGoogleAccessToken();
  const existingSheets = await getSpreadsheetSheets(token);

  const allLeadsId = await ensureSheet(token, ALL_LEADS_SHEET_TITLE, existingSheets, true);
  await appendLeadRow(token, allLeadsId, ALL_LEADS_SHEET_TITLE, payload, true);
  console.log("[Sheets] → Все заявки");

  const referral = normalizeReferral(payload.referral);
  if (referral && referral !== ALL_LEADS_SHEET_TITLE) {
    const refId = await ensureSheet(token, referral, existingSheets, false);
    await appendLeadRow(token, refId, referral, payload, false);
    console.log("[Sheets] →", referral);
  }
}
