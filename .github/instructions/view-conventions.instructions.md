---
description: "Use when writing EJS views, forms, flash messages, or i18n translations in this project. Covers translation key naming, flash message types, form conventions, CSRF, and view structure."
---
# View Layer Conventions

## i18n — Translation Keys

- All user-facing strings must use `req.__('key')` in controllers and `<%= __('key') %>` in EJS views. Never hardcode English text.
- Key naming follows `snake_case` with the pattern `entity_action_detail`:
  ```
  contractors_list_title
  contractors_create_error
  contractors_edit_title
  system_settings_invoice_format_saved
  ```
- Keys with dynamic values use `{{variable}}` placeholders in `locales/en.json` and `locales/es.json`:
  ```json
  "contractors_edit_title": "Edit contractor: {{name}}"
  ```
- Add new keys to **both** `locales/en.json` and `locales/es.json` at the same time.

## Flash Messages

- Use `req.flash(type, message)` for feedback that survives a redirect. Always pair with `req.__()`:
  ```javascript
  req.flash('success', req.__('system_settings_invoice_format_saved'))
  req.flash('danger', req.__('contractors_create_error'))
  ```
- Valid types: `success`, `danger`, `warning`, `info` (maps to Bulma notification classes).
- For inline errors (no redirect), pass a `messages` array directly to `res.render()`:
  ```javascript
  return res.render(FORM_VIEW, {
    messages: [{ content: req.__('auth_login_invalid_credentials'), type: 'warning' }]
  })
  ```
- Every view must include the flash partial to display messages:
  ```ejs
  <%- include('../../partials/flash-messages') %>
  ```

## EJS View Structure

Every view follows this skeleton:
```ejs
<!DOCTYPE html>
<html lang="<%= locale %>" data-theme="<%= locals.theme || 'light' %>">
<%- include('../../partials/head', { title: 'Page Title' }) %>
<body>
    <%- include('../../partials/navigation') %>
    <%- include('../../partials/flash-messages') %>

    <main class="container is-max-widescreen py-6 px-4">
        <!-- content -->
    </main>
</body>
</html>
```

- Use `<%- include() %>` (dash) for partials — never `<%= include() %>`.
- Use `<%= value %>` for escaped output and `<%- html %>` only for trusted HTML.
- Global helpers available in all templates: `formatToCurrency`, `formatDate` (set via `app.locals`).
- UI framework is **Bulma CSS** — use Bulma utility classes (`is-flex`, `title is-1`, `button is-primary`, etc.).

## Forms

- Define form schemas in `src/forms/index.js` as named export objects. Field `label` and `placeholder` values must be i18n keys:
  ```javascript
  export const CONTRACTOR_FORM = {
    fields: [
      { label: 'contractor_name', name: 'name', placeholder: 'contractor_name_placeholder', required: true },
      { label: 'contractor_email', name: 'email', type: 'email', required: true },
    ]
  }
  ```
- Render forms using the `partials/form.ejs` partial, which automatically injects the CSRF token. Never build a raw `<form>` tag without it.
- The CSRF hidden input is handled by the partial — do not add it manually:
  ```ejs
  <%- include('../../partials/form', { form, action: '/contractors/create', method: 'post' }) %>
  ```
- GET renders the empty form; POST handles submission — both in the same controller action via `req.method`:
  ```javascript
  export const create = async (req, res) => {
    const FORM_VIEW = 'app/contractors/new'
    if (req.method === 'GET') {
      return res.render(FORM_VIEW, { title: req.__('contractors_create_title'), form: CONTRACTOR_FORM })
    }
    // POST: handle submission...
  }
  ```
- On validation/service failure, re-render the form with `populateForm()` to preserve user input:
  ```javascript
  return res.render(FORM_VIEW, {
    title: req.__('contractors_create_title'),
    form: populateForm({ form: CONTRACTOR_FORM, data: { name, email }, error: req.__('contractors_create_error') })
  })
  ```
- On success, redirect and use `req.flash()` for feedback:
  ```javascript
  req.flash('success', req.__('contractors_create_success'))
  return res.redirect(`/contractors/show/${newContractor.id}`)
  ```
