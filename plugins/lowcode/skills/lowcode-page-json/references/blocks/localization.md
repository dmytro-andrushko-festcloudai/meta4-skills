# Localization

Translations with `app.libraries.i18n`.

## Localised pages

the runtime has `app.libraries.i18n` (`t('key')`, `t('key', { name })` with `{name}` placeholders, plural forms with `count`, `init(dictionaries)` in scripts only); there is no bare `i18n` global and the page JSON has no `translations` prop. Use three scripts: `translations` returns nested dictionaries (`{ en: { roles: { title: '…' } }, uk: {…} }`, a plural form is a leaf such as `items_one`); `i18n` flattens them to dotted keys in `init()` (`app.libraries.i18n.init(flat)`, the library only knows flat keys) and re-exports `t: (key, vars) => app.libraries.i18n.t(key, vars)`, see `security-roles.json`; the `init` script calls `i18n.init();` before the first load. Scripts and bindings then call `i18n.t('key')`, which re-renders when `init` runs. The language is `app.user.locale`. Constants in scripts that hold labels must hold keys and call `i18n.t` where used, otherwise they are fixed at load. Dates: `app.libraries.dayjs`. See `security-service/schemas/security-roles.json`.
