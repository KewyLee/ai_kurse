const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
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

      await sendTelegramLeadMessage(payload);

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

function buildTelegramMessage(payload) {
  return [
    "<b>Новая заявка с лендинга</b>",
    "",
    `<b>Имя:</b> ${escapeTelegramText(payload.name)}`,
    `<b>Telegram:</b> ${escapeTelegramText(payload.telegram)}`,
    `<b>Телефон:</b> ${escapeTelegramText(payload.phone)}`,
    `<b>Источник:</b> ${escapeTelegramText(payload.source || "landing-ai-blog")}`,
  ].join("\n");
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
