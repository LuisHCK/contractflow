
# Translation Implementation Checklist (using i18n)


This checklist guides you through adding internationalization (i18n) to the project using the [i18n](https://www.npmjs.com/package/i18n) npm package, with translations managed in a simple format (JSON or YAML, but CSV can be converted if needed).

**Supported languages: English (en) and Spanish (es) only.**

## 1. Install Dependency
- [x] Run: `bun add i18n`

## 2. Prepare Translation Files
- [x] Create a `locales/` directory at the project root (same level as `package.json`).
- [x] Create one file for each supported language: `en.json` and `es.json`.
- [x] Each file should contain key-value pairs for translations. Example:

```
// locales/en.json
{
	"greeting": "Hello",
	"farewell": "Goodbye"
}

// locales/es.json
{
	"greeting": "Hola",
	"farewell": "Adiós"
}
```

> If you prefer to manage translations in CSV, maintain a `translations.csv` and use a script to convert it to JSON for each language (en, es). Add this script to `package.json` so converting/transpiling stays a repeatable step (e.g., `bun run translate`).

## 3. Configure i18n
- [x] Initialize and configure i18n in your Express app (e.g., in `server.js`).
- [x] Set the locales directory, supported languages (`en`, `es`), and default locale. Example:

```js
const path = require('path');
const i18n = require('i18n');
i18n.configure({
  locales: ['en', 'es'],
  directory: path.join(process.cwd(), 'locales'),
  defaultLocale: 'en',
  queryParameter: 'lang',
  cookie: 'lang',
  autoReload: true,
  updateFiles: false
});
app.use(i18n.init);
```

- [x] Ensure any language preference cookie middleware (if used) runs before `i18n.init` so detection works correctly.

## 4. Integrate with Express
- [x] Use the i18n middleware before your routes.
- [x] Propagate helpers to templates so every view can access them:

```js
app.use((req, res, next) => {
  res.locals.__ = res.__;
  res.locals.locale = req.getLocale();
  next();
});
```

- [x] In EJS: `<%= __('greeting') %>`

## 5. Update EJS Templates
- [ ] Replace static text in all EJS files with translation keys, using the `__` function.
  - [x] src/views/app/contractors/show.ejs
  - [x] src/views/app/index.ejs
  - [x] src/views/app/payments/invoice.ejs
  - [x] src/views/app/projects/create.ejs
  - [x] src/views/app/projects/index.ejs
  - [x] src/views/app/projects/partials/_list.ejs
  - [x] src/views/app/projects/partials/_overview-cards.ejs
  - [x] src/views/app/projects/partials/_stages.ejs
  - [x] src/views/app/projects/payments/create.ejs
  - [x] src/views/app/projects/show.ejs
  - [ ] src/views/app/stages/partials/_stats.ejs
  - [ ] src/views/app/stages/show.ejs
  - [x] src/views/generic/404.ejs
  - [x] src/views/generic/detail-view.ejs
  - [x] src/views/generic/form-view.ejs
  - [x] src/views/generic/list-view.ejs
  - [x] src/views/generic/table-view.ejs
  - [ ] src/views/partials/breadcrumbs.ejs
  - [ ] src/views/partials/flash-messages.ejs
  - [ ] src/views/partials/form.ejs
  - [ ] src/views/partials/head.ejs
  - [x] src/views/partials/navigation.ejs
  - [x] src/views/partials/table.ejs

## 6. Add Language Switcher (Optional)
- [ ] Add a UI element (dropdown or links) to allow users to change language (e.g., by setting the `lang` query parameter or a `lang` cookie).
- [x] When a user selects a language, set the cookie and redirect/refresh so the preference persists (handled via `/lang/:locale` route; UI trigger pending).

## 7. Test
- [ ] Verify language detection and switching works (try `?lang=es` and changing cookies).
- [ ] Check fallback language behavior.
- [ ] Ensure all UI text is translated.

---
---

## Notes

- The i18n package is simple and works out-of-the-box with Express and EJS.
- Use flat keys (e.g., `nav_home`) instead of nested objects in translation files for easier CSV interoperability.
- You can still manage translations in CSV and convert to JSON if preferred, but i18n expects JSON or YAML files for `en` and `es` only. Keep the conversion automated to avoid inconsistent translation files.
- See the i18n documentation for more options: https://www.npmjs.com/package/i18n
