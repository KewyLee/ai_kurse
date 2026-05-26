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
Открой `index.html` в браузере.

## Перед запуском рекламы
1. В `script.js` укажи Telegram:
`const TELEGRAM_USERNAME = "your_username";`
2. При наличии webhook укажи URL:
`const TELEGRAM_WEBHOOK_URL = "";`

## Деплой
Локальный скрипт деплоя: `deploy.local.ps1` (он исключён из Git).

Примеры запуска:
- `.\deploy.local.ps1 -Message "feat: update landing"`
- `.\deploy.local.ps1 -SkipServer` (только commit/push в GitHub)
