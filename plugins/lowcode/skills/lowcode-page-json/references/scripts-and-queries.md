# Scripts and queries layout

How to name, group and order the js files (`scripts`) and `queries` of a page. The code panel shows them as one tree of folders, so the layout is what the next person reads first.

## Names

- **Js files: the role, camelCase.** `table`, `filter`, `sorting`, `drawer`, `access`, `permissions`, `constants`, `init`, `localeUk`, `localeEn`, `i18n`. A js file owns one area of the page, so its name is the area. **No `Js` suffix**: some older pages suffix every js file (`tableJs`, `localeUkJs`, the dictionaries pages); when you edit such a page, drop the suffix from all its js files in one pass ("Renaming a js file or a query" below), never mix both styles on one page.
- **Queries: verb plus entity.** `getRoles`, `getRolePermissions`, `createRole`, `updateRole`, `deleteDraftRole`, `assignRole`, `upsertPersonConditionValues`. Read queries start with `get`, writes with `create`, `update`, `delete`, `assign`, `upsert`. A REST call follows the same rule (`activateRole`).
- **Blocks stay PascalCase** (`TableRoles`, `ModalDelete`), so a lower-case js file name never collides with a block name.
- **Names are one namespace for the whole page.** Blocks, queries and js files share it, and the engine reserves some words (`app`, `params`, `inputs`, `currentItem`, `currentIndex`, `parent`, `self`, `top`, the JS globals and keywords). `validateName` in the editor and `tool.mjs validate` report a clash. `filter`, `table` and `drawer` are fine, `top` and `self` are not.
- **A js file must not declare a local with the name of another js file** (`const filter = ...` inside `table` hides the `filter` js file there). Rename the local.
- **Name blocks you reference from scripts.** The builder numbers blocks `Input1`, `Input2`, ...; set `block.props.name = 'InputName'` right after `node()` for anything a script reads (`InputName.value`, `ModalForm.setOpen(true)`), because renumbering would break the script.

## Folders

`root.props.folders` is a flat list of `{ id, name }`. Folders do not nest. Every js file and every query carries a `folderId`; never leave one at the root of a page that uses folders.

**Folder names are camelCase**: one word lower case (`core`, `table`, `localization`), several words camelCase (`dictionariesTable`, `itemForm`, `deleteDictionary`). No spaces, no capitals at the start, no kebab-case.

Group by domain, the area of the screen, not by the kind of code. Never make a `scripts` folder and a `queries` folder:

| Folder | What goes in it |
|---|---|
| `core` | `init`, `constants`, `permissions`: what every other area reads |
| `localization` | exactly `localeUk`, `localeEn` and the `i18n` wrapper, nothing else; see `references/blocks/localization.md` |
| one folder per feature area, named after it: `table`, `filter`, `drawer`, `access`, `itemForm`, `deleteItem`, ... | the js files of that area and the queries they call |

Rules:

1. **A query lives with the area that owns the data it loads.** `getRoles` and `activateRole` belong to the table, `getAuthorPrincipals` to the filter that offers authors, `getRolePermissions` and the delete queries to the drawer.
2. **A query used by two or more areas goes to `core`.** Move it there when the second caller appears, not before.
3. **A modal or drawer is an area.** Its js file (`drawer`, `access`, `deleteModal`) and the queries it fires sit in one folder, named after the panel: the delete-confirm modal script with the delete mutations in `deleteDictionary`, the create/edit form script with the create and update mutations in `dictionaryForm`.
4. **Small helpers stay in the js file that uses them.** Add a js file only for a new area or when one grows past one job (roughly 300 lines or two kinds of work, for example state of a panel and loading its list).
5. **A one-view page can have two folders** (`core`, then the area) and a trivial page none. Folders exist to find things, do not add them to a page with five scripts.

Order in the arrays (the editor shows them in this order): `localization`, `core`, then the feature areas in the order they appear on the screen, top to bottom. Inside an area, scripts before queries.

## How js files talk to each other

- Reach another js file by its name: `table.getData()`, `permissions.canEditRole()`; translations through `i18n.t('roles.title')`.
- `i18n` registers the dictionaries when the page loads; `init` is the entry point that loads the page data. Nothing else runs on page load except queries with `runOnPageLoad`.
- `constants` holds endpoints and fixed lists. Labels that are shown to the user are keys in the locale js files, never literals in `constants` (a constant is built once and would stay in the first language).
- Avoid cycles at load time: a js file that calls another one at its top level needs that one to exist and not call back.

## Worked example (the taxonomies pages)

`apps/lowcode/src/pages/taxonomies/schemas/`:

| Folder (list.json) | Scripts | Queries |
|---|---|---|
| `localization` | `localeUk`, `localeEn`, `i18n` | |
| `core` | `constants`, `permissions`, `init` | |
| `tree` | `tree` | `getTaxonomies` |
| `filter` | `filters` | |
| `drawer` | `drawer` | |
| `createForm` | `createModal` | `createTaxonomy` |
| `editForm` | `editModal` | `updateTaxonomy` |

| Folder (merge.json) | Scripts | Queries |
|---|---|---|
| `localization` | `localeUk`, `localeEn`, `i18n` | |
| `core` | `constants`, `permissions`, `init` | |
| `header` | `breadcrumbs` | |
| `tree` | `tree` | `getTaxonomies` |
| `merge` | `merge`, `preview` | `mergeTaxonomy` |

The dictionaries pages still use the older layout (`Js` suffix, a `common` folder, flat locale files); convert them when you touch them.

## Builder

In `scripts/builder.ts` pass the folder name; `page()` writes `root.props.folders` for the folders used:

```ts
script('table', code, 'table');
graphqlQuery('getRoles', query, { folder: 'table' });
```

## Worked example (the roles page)

| Folder | Scripts | Queries |
|---|---|---|
| `localization` | `localeUk`, `localeEn`, `i18n` | |
| `core` | `init`, `constants`, `permissions` | |
| `table` | `table`, `sorting` | `getRoles`, `getEmployeesByIds`, `activateRole` |
| `filter` | `filter` | `getAuthorPrincipals` |
| `drawer` | `drawer` | `getRolePermissions`, `deleteDraftRole`, `deletePublishedRole` |
| `access` | `access` | `getEmployees`, `assignRole`, `getWorkgroups`, `upsertPersonConditionValues` |

## Renaming a js file or a query

Do it in one pass and validate after:

1. Replace the name in every string of the page JSON: bindings, event handlers, other js files, query variables and headers. A reference is the name not preceded by a letter, digit, `_`, `$` or `.`. A spread (`...filter.getWhere()`) ends in dots, so a "not preceded by `.`" rule misses it; handle it explicitly. In the raw JSON text a binding that starts on a new line holds `\n` before the name (`"{{\ntreeJs.get()}}"`), so a name preceded by that `n` is missed too; work on the parsed strings or handle it explicitly.
2. Check that no local variable in any js file already uses the new name.
3. Run `tool.mjs validate` (it compiles every js file and binding and reports names that are not defined), then open the page and use each panel once.
4. Each view of an app is its own document with its own js files, so rename the other views in their own pass; keep the same names across views for the same role (`table`, `filter`, `constants`).
