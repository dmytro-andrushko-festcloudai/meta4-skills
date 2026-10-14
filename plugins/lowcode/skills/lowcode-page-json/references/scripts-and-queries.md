# Scripts and queries layout

How to name, group and order the js files (`scripts`) and `queries` of a page. The code panel shows them as one tree of folders, so the layout is what the next person reads first.

## Names

- **Js files: the role, camelCase.** `table`, `filter`, `sorting`, `drawer`, `access`, `permissions`, `constants`, `init`, `i18n`, `translations`. A js file owns one area of the page, so its name is the area.
- **Queries: verb plus entity.** `getRoles`, `getRolePermissions`, `createRole`, `updateRole`, `deleteDraftRole`, `assignRole`, `upsertPersonConditionValues`. Read queries start with `get`, writes with `create`, `update`, `delete`, `assign`, `upsert`. A REST call follows the same rule (`activateRole`).
- **Blocks stay PascalCase** (`TableRoles`, `ModalDelete`), so a lower-case js file name never collides with a block name.
- **Names are one namespace for the whole page.** Blocks, queries and js files share it, and the engine reserves some words (`app`, `params`, `inputs`, `currentItem`, `currentIndex`, `parent`, `self`, `top`, the JS globals and keywords). `validateName` in the editor and `tool.mjs validate` report a clash. `filter`, `table` and `drawer` are fine, `top` and `self` are not.
- **A js file must not declare a local with the name of another js file** (`const filter = ...` inside `table` hides the `filter` js file there). Rename the local.

## Folders

`root.props.folders` is a flat list of `{ id, name }`. Folders do not nest. Every js file and every query carries a `folderId`; never leave one at the root of a page that uses folders.

Group by the area of the screen, not by the kind of code:

| Folder | What goes in it |
|---|---|
| `core` | `init`, `constants`, `permissions`: what every other area reads |
| `localization` | `translations` (the nested dictionaries) and `i18n` (`init()` and `t`), see gotcha 42 in `blocks-and-layout.md` |
| one folder per feature area, named after it: `table`, `filter`, `drawer`, `access`, `form`, ... | the js files of that area and the queries they call |

Rules:

1. **A query lives with the area that owns the data it loads.** `getRoles` and `activateRole` belong to the table, `getAuthorPrincipals` to the filter that offers authors, `getRolePermissions` and the delete queries to the drawer.
2. **A query used by two or more areas goes to `core`.** Move it there when the second caller appears, not before.
3. **A modal or drawer is an area.** Its js file (`drawer`, `access`) and the queries it fires sit in one folder, named after the panel.
4. **Small helpers stay in the js file that uses them.** Add a js file only for a new area or when one grows past one job (roughly 300 lines or two kinds of work, for example state of a panel and loading its list).
5. **A one-view page can have two folders** (`core`, then the area) and a trivial page none. Folders exist to find things, do not add them to a page with five scripts.

Order in the arrays (the editor shows them in this order): `core`, `localization`, then the feature areas in the order they appear on the screen, top to bottom. Inside an area, scripts before queries.

## How js files talk to each other

- Reach another js file by its name: `table.getData()`, `permissions.canEditRole()`, `i18n.t('roles.title')`.
- `init` is the entry point: it calls `i18n.init()` first, then loads the page data. Nothing else runs on page load except queries with `runOnPageLoad`.
- `constants` holds endpoints and fixed lists. Labels that are shown to the user are keys in `translations`, never literals in `constants` (a constant is built once and would stay in the first language).
- Avoid cycles at load time: a js file that calls another one at its top level needs that one to exist and not call back.

## Builder

In `scripts/builder.ts` pass the folder name; `page()` writes `root.props.folders` for the folders used:

```ts
script('table', code, 'table');
graphqlQuery('getRoles', query, { folder: 'table' });
```

## Worked example (the roles page)

| Folder | Scripts | Queries |
|---|---|---|
| `core` | `init`, `constants`, `permissions` | |
| `localization` | `translations`, `i18n` | |
| `table` | `table`, `sorting` | `getRoles`, `getEmployeesByIds`, `activateRole` |
| `filter` | `filter` | `getAuthorPrincipals` |
| `drawer` | `drawer` | `getRolePermissions`, `deleteDraftRole`, `deletePublishedRole` |
| `access` | `access` | `getEmployees`, `assignRole`, `getWorkgroups`, `upsertPersonConditionValues` |

## Renaming a js file or a query

Do it in one pass and validate after:

1. Replace the name in every string of the page JSON: bindings, event handlers, other js files, query variables and headers. A reference is the name not preceded by a letter, digit, `_`, `$` or `.`. A spread (`...filter.getWhere()`) ends in dots, so a "not preceded by `.`" rule misses it; handle it explicitly.
2. Check that no local variable in any js file already uses the new name.
3. Run `tool.mjs validate` (it compiles every js file and binding and reports names that are not defined), then open the page and use each panel once.
4. Each view of an app is its own document with its own js files, so rename the other views in their own pass; keep the same names across views for the same role (`table`, `filter`, `constants`).
