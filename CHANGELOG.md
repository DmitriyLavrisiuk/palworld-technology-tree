# Changelog

История значимых изменений проекта. Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии — [SemVer](https://semver.org/lang/ru/).

## [Unreleased]

### Added

- Конвейер данных перенесён из прототипа: парсер (`scripts/`, четыре источника), ручные цепочки, типы и константы игры, данные и 588 иконок. `npm run scrape` воспроизводит данные побайтно.
- Документация конвейера: `docs/DATA_PIPELINE.md`, `docs/DATA_MODEL.md`, `docs/CHAINS.md`.
- Каркас приложения: Vite 8, React 19, Tailwind v4, токены shadcn `base-nova`, шрифт Geist. Загрузка данных динамическим `import()` тремя отдельными чанками.
- Первая выкатка на GitHub Pages: https://dmitriylavrisiuk.github.io/palworld-technology-tree/

### Changed

- React-плагин Vite — на SWC вместо babel-версии: `@vitejs/plugin-react@6` требует `@babel/core@8`, а `shadcn` тянет `@babel/core@7`, и дерево не разрешается.

### Fixed

- Число технологий без пререквизитов: 545, а не 544 как в документации прототипа — там не учли, что `Special_ElectricHatchingPalEgg` несёт два гейта сразу.

## [0.1.0] — 2026-08-19

### Added

- Бутстрап проекта: система документации (`docs/` с контракт-шапками, STATUS/CHANGELOG/ROADMAP), `.claude/CLAUDE.md` с архитектурными правилами, настройки Claude Code с разрешениями и хуком линтера, агенты `phase-qa`, `security-audit`, `ui-consistency`.
- Git-процесс: pre-commit с oxlint и `gitleaks protect`, Conventional Commits, GitHub Flow, dependabot.
- GitHub MCP через официальный remote-сервер, токен только из переменной окружения.
- Публичный репозиторий `DmitriyLavrisiuk/palworld-technology-tree`, `main` опубликован.
- План до релиза v1.0: восемь фаз с проверяемыми критериями, цель — паритет с прототипом плюс мобильная вёрстка, скорость первого экрана и достоверность цепочек.
