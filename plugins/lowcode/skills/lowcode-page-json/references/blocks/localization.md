# Localization

Translations with `app.libraries.i18n`, called through a short page-level `i18n` js file. Reference implementations: the taxonomies pages (`apps/lowcode/src/pages/taxonomies/schemas/list.json` and `merge.json`) and `app-info`.

Older layouts are superseded; convert them when you touch such a page (see "Converting an older page"):
- flat locale files registered by `init`, every call spelled `app.libraries.i18n.t(...)` (the dictionaries and uom pages before conversion);
- a `translations` script plus an `i18n` wrapper (security-service pages at commit `5e924080c`).

## Ask first

Before planning a page, ask the user whether it should be localised. Default to inline Ukrainian text when the answer is no or unclear. Localising touches every label, alert, confirm text, tab, menu item and placeholder, so it is far cheaper to decide before building than to retrofit.

## Runtime API

`app.libraries.i18n` (`apps/lowcode/src/runtime/libraries/translate.ts`). The page JSON has no `translations` prop.

| Call | Where | Notes |
|------|-------|-------|
| `init(dictionaries)` | scripts only | `{ uk: {…}, en: {…} }`; each dictionary must be **flat** (`{ 'common.cancel': '…' }`) |
| `t('key')`, `t('key', { name })`, `t('key', { count })` | scripts and bindings | `key` is a flat dictionary key such as `'common.cancel'`; `{name}` placeholders; plurals by `count` |

Lookup order for a key: the plural key (`key_few`, when `count` is passed), then the key itself, in the user's language, then in the next language; when nothing matches, the key itself is returned. The lookup is flat only: `t` reads `dictionary['common.cancel']` and **does not walk nested objects**, so a nested dictionary passed to `init` as is renders every key as its raw name. That is why the `i18n` js file flattens the locale files first. The language is `app.user.locale` (`'en'` or `'uk'`). Dates: `app.libraries.dayjs`.

`t` reads signals, so a binding that calls it re-renders when `init` sets the dictionaries or the user switches language.

## Js files

The `localization` folder holds exactly three js files, in this order:

| Js file | Content |
|---|---|
| `localeUk` | returns the Ukrainian dictionary, nested |
| `localeEn` | returns the English dictionary, same keys |
| `i18n` | flattens both, registers them and exposes `t` |

The locale files only return an object; no logic, no `init` call:

```js
return {
  page: {
    title: 'Менеджер таксономії',
    subtitle: 'Універсальний переглядач таксономії',
  },
  common: {
    search: 'Пошук',
    cancel: 'Скасувати',
    save: 'Зберегти',
  },
  createForm: {
    title: 'Створити нову таксономію',
    created: 'Таксономію "{name}" створено',
  },
  tree: {
    nodesCount_one: '{count} вузол',
    nodesCount_few: '{count} вузли',
    nodesCount_many: '{count} вузлів',
    nodesCount_other: '{count} вузла',
  },
};
```

`i18n` is the whole wrapper. Copy it unchanged; the `flatten` helper turns `{ common: { cancel } }` into `{ 'common.cancel' }`, which is the only shape the runtime reads:

```js
const flatten = (dictionary, prefix = '') =>
  Object.entries(dictionary).reduce((result, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return value && typeof value === 'object'
      ? { ...result, ...flatten(value, path) }
      : { ...result, [path]: value };
  }, {});

app.libraries.i18n.init({ uk: flatten(localeUk), en: flatten(localeEn) });

return {
  t: (key, vars) => app.libraries.i18n.t(key, vars),
};
```

Everything else calls `i18n.t(...)`:

- bindings: `{{ i18n.t('page.title') }}`, `{{ i18n.t('tree.nodesCount', { count: tree.getCount() }) }}`;
- scripts: `i18n.t('createForm.created', { name })`, or `const { t } = i18n;` at the top of a function that translates many strings.

The page's `init` js file does not register dictionaries; it only loads data.

## Key layout

- **Group by screen area**, the same areas as the code-panel folders: `page` (title, subtitle, breadcrumbs), `common` (shared words), `validation`, then one group per area (`tree`, `filter`, `drawer`, `createForm`, `editForm`, `deleteModal`, ...). Shared groups first, then areas in screen order.
- **`common` holds shared words**: `search`, `cancel`, `save`, `create`, `edit`, `delete`, `name`, `code`, `description`, `status`, `filter`, `sorting`, `yes`, `no`, `loading`. Reuse a `common` key before adding an area key.
- **`validation`** holds `requiredField`, `invalidValue` and other field messages.
- **Inside a group, short names**: `createForm.title`, `createForm.failed`, `createForm.created`, not `createForm.createTitle`.
- **Views of one app share key paths** for the same text (`page.title`, `common.merge`, `validation.invalidValue` in both taxonomies views), so a string can be copied between views unchanged.
- **Two levels are usually enough** (`group.key`); nest deeper only for a clearly separate sub-area.
- **Sentences with data use placeholders**, never concatenation: `deleteModal.title: 'Видалити "{name}"?'`, called as `i18n.t('deleteModal.title', { name: item?.name || '' })`.
- **Plurals are sibling keys with a suffix**, inside the group: `nodesCount_one`, `nodesCount_few`, `nodesCount_many`, `nodesCount_other` for Ukrainian; `_one` and `_other` for English. Call `i18n.t('tree.nodesCount', { count })`. A nested `nodesCount: { one, few }` does not work: the runtime looks up `tree.nodesCount_few`.
- **No key is both a string and a group**: `details` cannot be a text when `details.title` exists.

## What to translate and how

- **Everything the user reads**: block text, table headers, tab and segmented-control labels, menu items, placeholders, empty states, confirm title and body, breadcrumbs, `app.showAlert(...)` messages, thrown `new Error('…')` messages that reach an alert, and the fallback `error?.message || i18n.t('common.somethingWentWrong')`.
- **Constants hold keys, not labels.** A constant evaluated at load is fixed to the language at load time. Store `labelKey` with the full path and resolve it where used:

```js
const STATES = {
  CATALOG: { labelKey: 'states.catalog' },
  ARTICLE: { labelKey: 'states.article' },
};

const labelled = (items) => items.map((item) => ({ ...item, label: i18n.t(item.labelKey) }));
```

- **Option and menu arrays** are built when used, never stored at load: in a binding call `t` inline (`{{ [{ value: 'yes', label: i18n.t('common.yes') }, { value: 'no', label: i18n.t('common.no') }] }}`), in a js file return them from a function (`getOptions() { return [...] }`, not an `options: [...]` property). Keep `value` language-neutral; only `label` is translated.
- **Dates follow the language**: `app.user.locale === 'en' ? 'en-GB' : 'uk-UA'` for `toLocaleDateString`. A date mask or placeholder is a translation (`common.dateMask`: `dd.mm.yyyy` / `дд.мм.рррр`).
- **Do not translate data**: names from Hasura, ids, statuses sent to the API, enum values, query text.
- **Language-specific data stays per language**: an alphabet filter keeps a Latin and a Cyrillic list and picks one by `app.user.locale`.

## Converting an older page

Edit the page JSON in place, so block, folder, script and query ids stay the same; only the new `i18n` js file gets a new id.

1. Map every old flat key to its new path (`createTitle` → `createForm.title`, `stateCatalog` → `states.catalog`), plural bases included.
2. Rewrite `localeUk` and `localeEn` as nested objects from that map, values unchanged.
3. Add the `i18n` js file (with `flatten`, as above) to the `localization` folder after the locale files; remove the `init(...)` line from the entry js file. The `i18n` js file must come before the entry js file in the scripts list.
4. Replace `app.libraries.i18n.t(` with `i18n.t(` everywhere and each key with its new path, including `labelKey`s and keys passed with `count`.
5. Drop a `Js` suffix from js file names in the same pass (`references/scripts-and-queries.md`, "Renaming a js file or a query"). A reference inside a binding can follow a `\n` escape in the raw JSON text (`"{{\ntreeJs.get()}}"`), so a word-boundary regex over the raw JSON misses it; `validate` reports what was missed.

## Checks

- `localeUk` and `localeEn` have identical key paths (plural forms aside). A missing key renders as the key itself.
- Every `i18n.t('…')` key and every `labelKey` exists in both locale files, and every locale key is used.
- No `app.libraries.i18n.t(` is left outside the `i18n` js file.
- No Ukrainian or English literal is left in a block `text`, `label`, `placeholder`, `title` or `validationMessage`, in a table column `title`, or in an `app.showAlert` / `new Error` message.
- The `localization` folder holds only `localeUk`, `localeEn` and `i18n`; `i18n` defines `flatten` and passes both locale files through it to `init`.
