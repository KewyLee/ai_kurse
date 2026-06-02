# ai_kurse

Одностраничный лендинг для аудитории мастеров, салонов и личного бренда с
фокусом на:
- обучение ИИ простым языком;
- продвижение в соцсетях;
- сбор заявок с переходом в Telegram.

## Файлы проекта
- `index.html` — основная страница лендинга.
- `styles.css` — стили, адаптив и анимации.
- `script.js` — логика интерактивов, анимаций и формы.
- `font-preview.html` — мини-страница для подбора шрифтов.

## Быстрый запуск
1. Скопируй `.env.example` в `.env`.
2. Заполни `TELEGRAM_PERSONAL_USERNAME`, `TELEGRAM_CHANNEL_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
3. Запусти сайт через `node server.js` или `npm start`.
4. Открой `http://localhost:3000`.

## Перед запуском рекламы
1. `TELEGRAM_PERSONAL_USERNAME` используется для перехода в личку после отправки формы.
2. `TELEGRAM_CHANNEL_URL` используется для ссылки в футере на канал.
3. `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` используются только на backend и не видны в браузере.
4. `TELEGRAM_THREAD_ID` можно указать, если нужно отправлять заявки в конкретный топик группы.

## Деплой
Локальный скрипт деплоя: `deploy.local.ps1` (он исключён из Git).
Скрипт обновляет статику и проверяет backend-предусловия на сервере. Для полного production-деплоя на сервере должны быть:
- установленный `node`;
- файл `/home/dev/ai_kurse/.env`;
- user-service `ai-kurse` в `systemd` или процесс `pm2` с именем `ai-kurse`.

Примеры запуска:
- `.\deploy.local.ps1 -Message "feat: update landing"`
- `.\deploy.local.ps1 -SkipServer` (только commit/push в GitHub)
