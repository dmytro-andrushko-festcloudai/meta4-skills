# Localization

Translations with `app.libraries.i18n`. Reference implementation: the security-service pages as they were localised on `feat/people-pages-v2` (commit `5e924080c`: `security-roles.json`, `role-form.json`, `access.json`). The pages on other branches may be inline Ukrainian again, so read that commit with `git show 5e924080c:apps/lowcode/src/pages/security-service/schemas/<page>.json`.

## Ask first

Before planning a page, ask the user whether it should be localised. Default to inline Ukrainian text when the answer is no or unclear. Localising touches every label, alert, confirm text, tab, menu item and placeholder, so it is far cheaper to decide before building than to retrofit.

## API

The runtime has `app.libraries.i18n`; there is no bare `i18n` global and the page JSON has no `translations` prop.

| Call | Where | Notes |
|------|-------|-------|
| `init(dictionaries)` | scripts only | `{ en: { 'flat.key': '…' }, uk: {…} }`, flat dotted keys only |
| `t('key')`, `t('key', { name })` | scripts and bindings | `{name}` placeholders in the string; a plural form is a leaf such as `items_one`, selected with `count` |

The language is `app.user.locale` (`'en'` or `'uk'`). Dates: `app.libraries.dayjs`.

## Scripts

Two scripts in the `localization` group, right after `core` (see `references/scripts-and-queries.md`):

- `translations` returns the nested dictionaries, one tree per language, with the same keys in `en` and `uk`.
- `i18n` flattens them to dotted keys and exposes `init()` and `t`. Use this verbatim:

```js
const flatten = (tree, prefix = '') =>
  Object.entries(tree).reduce(
    (out, [key, value]) =>
      typeof value === 'object' ? { ...out, ...flatten(value, prefix + key + '.') } : { ...out, [prefix + key]: value },
    {}
  );

return {
  init() {
    const flat = Object.fromEntries(Object.entries(translations).map(([locale, tree]) => [locale, flatten(tree)]));

    app.libraries.i18n.init(flat);
  },

  t: (key, vars) => app.libraries.i18n.t(key, vars),
};
```

The `init` script calls `i18n.init();` before the first load (`i18n.init(); fetchData(); return {};`). Bindings and scripts then call `i18n.t('key')` and re-render when `init` runs.

## Key layout

Group the tree by page area, with a shared `common` group first:

- `common`: words reused everywhere (`search`, `cancel`, `close`, `delete`, `edit`, `status`, `author`, `activate`, `filter`, `sorting`, `from`, `to`, `datePlaceholder`, `dateMask`, `somethingWentWrong`, `sortNameAsc`, `sortNameDesc`).
- One group per page (`roles`, `roleForm`, `access`) with nested groups such as `tab`, `table`, `filter`, `sort`, `status`, `period`, `confirm`, `alert`.
- Sentences with data use placeholders, never concatenation: `"deleteTitle": "Delete the role “{name}”?"`, called as `i18n.t('roles.confirm.deleteTitle', { name: drawer.role?.name || '' })`.
- Reuse `common.*` before adding a page key. The same word in two groups means one of them belongs in `common`.

## What to translate and how

- **Everything the user reads**: block text, table headers, tab and segmented-control labels, menu items, placeholders, empty states, confirm title and body, breadcrumbs, `app.showAlert(...)` messages, thrown `new Error('…')` messages that reach an alert, and the fallback `error?.message || i18n.t('common.somethingWentWrong')`.
- **Constants hold keys, not labels.** A constant evaluated at load is fixed to the language at load time. Store `labelKey` and resolve where used:

```js
const STATUSES = [
  { value: 'PUBLISHED', labelKey: 'roles.filter.statusActive' },
  { value: 'DRAFT', labelKey: 'roles.status.draft' },
];

const labelled = (items) => items.map((item) => ({ ...item, label: i18n.t(item.labelKey) }));
```

- **Option and menu arrays in bindings** call `i18n.t` inline: `{{ [{ label: i18n.t('roles.tab.all'), value: 'all' }, { label: i18n.t('roles.tab.mine'), value: 'mine' }] }}`. Keep `value` language-neutral; only `label` is translated.
- **Dates follow the language**: `app.user.locale === 'en' ? 'en-GB' : 'uk-UA'` for `toLocaleDateString`. A date mask or placeholder is a translation (`common.dateMask`: `dd.mm.yyyy` / `дд.мм.рррр`).
- **Do not translate data**: names from Hasura, ids, statuses sent to the API, enum values, query text.
- **Language-specific data stays per language**: an alphabet filter keeps a Latin and a Cyrillic list and picks one by `app.user.locale`.

## Checks

- `en` and `uk` have identical key sets. A missing key renders as the key itself.
- No Ukrainian or English literal is left in a block `text`, `label`, `placeholder` or `title`, or in an `app.showAlert` call.
- Every `labelKey` and every `i18n.t('…')` key exists in `translations`.
- The `i18n` and `translations` scripts are in the `localization` group, and `init` calls `i18n.init()` before anything renders data.
