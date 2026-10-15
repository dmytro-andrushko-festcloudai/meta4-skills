# Localization

Translations with `app.libraries.i18n`. Reference implementation: the dictionaries pages (`apps/lowcode/src/pages/dictionaries/schemas/list.json` and `items.json`). An older layout (a `translations` script plus an `i18n` wrapper, security-service pages at commit `5e924080c`) is superseded by the one below; convert it when you touch such a page.

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

A `localization` folder holds exactly two js files, one per language, and nothing else (see `references/scripts-and-queries.md`):

- `localeUk` returns the Ukrainian dictionary.
- `localeEn` returns the English dictionary, with the same keys.

Each one only returns a flat object; no logic, no `init` call:

```js
return {
  registryTitle: 'Реєстр Словників',
  search: 'Пошук',
  editNamed: 'Редагувати "{name}"',
  itemsCount_one: '{count} значення',
  itemsCount_few: '{count} значення',
  itemsCount_many: '{count} значень',
  itemsCount_other: '{count} значення',
};
```

The `init` js file registers both on its first line, before it loads any data:

```js
app.libraries.i18n.init({ uk: localeUk, en: localeEn });
```

Scripts and bindings call `app.libraries.i18n.t('key')` directly; there is no wrapper js file. A binding that runs before `init` shows the key for a moment and re-renders when `init` sets the dictionaries, because `t` reads a signal.

On a page whose js files carry the `Js` suffix the files are `localeUkJs` and `localeEnJs` and the call is `app.libraries.i18n.init({ uk: localeUkJs, en: localeEnJs })`.

## Key layout

`init` takes flat dictionaries, so the locale files are flat objects:

- Plain camelCase keys are enough for one page (`search`, `cancel`, `createDictionary`, `deleteDictionaryTitle`). For a page with many areas, dotted keys group them (`'common.search'`, `'roles.confirm.deleteTitle'`); quote them in the object literal.
- Shared words first (`search`, `cancel`, `save`, `create`, `edit`, `delete`, `name`, `code`, `description`, `status`, `filter`, `sorting`, `yes`, `no`, `requiredField`, `loading`), then the page's own keys in screen order.
- Sentences with data use placeholders, never concatenation: `deleteDictionaryTitle: 'Видалити словник "{name}"?'`, called as `app.libraries.i18n.t('deleteDictionaryTitle', { name: dictionary?.name || '' })`.
- Plurals are separate leaves selected by `count`: Ukrainian needs `_one`, `_few`, `_many`, `_other`; English `_one`, `_other`. Call `t('itemsCount', { count })`. This replaces hand-written plural rules.
- Reuse a shared key before adding a page key.

## What to translate and how

- **Everything the user reads**: block text, table headers, tab and segmented-control labels, menu items, placeholders, empty states, confirm title and body, breadcrumbs, `app.showAlert(...)` messages, thrown `new Error('…')` messages that reach an alert, and the fallback `error?.message || app.libraries.i18n.t('somethingWentWrong')`.
- **Constants hold keys, not labels.** A constant evaluated at load is fixed to the language at load time. Store `labelKey` and resolve where used:

```js
const STATUSES = [
  { value: 'PUBLISHED', labelKey: 'statusActive' },
  { value: 'DRAFT', labelKey: 'statusDraft' },
];

const labelled = (items) => items.map((item) => ({ ...item, label: app.libraries.i18n.t(item.labelKey) }));
```

- **Option and menu arrays** are built when used, never stored at load: in a binding call `t` inline (`{{ [{ value: 'yes', label: app.libraries.i18n.t('yes') }, { value: 'no', label: app.libraries.i18n.t('no') }] }}`), in a js file return them from a function (`getOptions() { return [...] }`, not an `options: [...]` property). Keep `value` language-neutral; only `label` is translated.
- **Dates follow the language**: `app.user.locale === 'en' ? 'en-GB' : 'uk-UA'` for `toLocaleDateString`. A date mask or placeholder is a translation (`common.dateMask`: `dd.mm.yyyy` / `дд.мм.рррр`).
- **Do not translate data**: names from Hasura, ids, statuses sent to the API, enum values, query text.
- **Language-specific data stays per language**: an alphabet filter keeps a Latin and a Cyrillic list and picks one by `app.user.locale`.

## Checks

- `localeUk` and `localeEn` have identical key sets (plural forms aside). A missing key renders as the key itself.
- No Ukrainian or English literal is left in a block `text`, `label`, `placeholder`, `title` or `validationMessage`, in a table column `title`, or in an `app.showAlert` / `new Error` message.
- Every `labelKey` and every `t('…')` key exists in both locale files.
- The `localization` folder holds only the two locale files, and `init` calls `app.libraries.i18n.init(...)` on its first line.
