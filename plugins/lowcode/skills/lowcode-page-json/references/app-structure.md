# A lowcode app: several views on one route

Contents: what an app is, layout on disk, view conventions, navigation between views, the build-and-wire command, per-view checklist.

## What an app is

In `apps/lowcode` an app is one folder in `src/pages/<name>/` that serves several routes from one component:

```
src/pages/<name>/
  <Name>.tsx              wrapper: picks a schema by the `view` prop, renders JsonView
  schemas/index.ts        { list, form, preview, ... } = imported JSON typed as Data
  schemas/<view>.json     one page JSON per view
```

Routes are registered in `src/app/router.tsx`, one entry per URL, all pointing at the same wrapper with a different `view`. `useRoutes` ranks static segments above dynamic ones, so `/x/create` and `/x/:id` can sit in any order. `viewKey` is `<name>:<view>:<id>` so switching record or view remounts the page and drops stale state.

## Plan the views before building any

| View | Route | Typical content |
|---|---|---|
| `list` | `/<name>` | title, create button, search, sort menu, filter, server-paginated table |
| `form` | `/<name>/create`, `/<name>/:id/edit` | one JSON for both; `:id` present means edit |
| `preview` | `/<name>/:id` | read-only cards of label/value rows |
| other | `/<name>/<view>` or `/<name>/:id/<view>` | dictionary items, merge screens |

Use one `form` view for create and edit unless the two really differ. Two near-identical JSONs drift apart (legal-entities has both and they already differ).

Decide up front which actions each view exposes and where each one navigates, then list the modals, since modals are per view, not shared.

## Conventions every view follows

- **Same `constantsJs`** in every view: `GRAPHQL_URL` and `basePath` (`/${lng}/low-code/<name>`, `lng` from `app.URL.params`). Navigation always goes through `basePath`.
- **Same block names across views** for the same role: `InputSearch`, `TableX`, `MenuSorting`, `FilterX`, `ModalX`. Scripts reach blocks by name, so semantic names are what make a script readable and copyable between views.
- **`initJs`** reads `app.URL.params.id`, loads the record when present, and returns `{ id }`. In editor mode (`app.mode === 'editor'`) there is no route param, so fall back to a real id so the preview has data.
- **List data** lives in a `tableJs` (`getData()` resets to page 1 then runs the query; `getVariables()` / `getWhere()` builds it), `sortingJs` (options + `getOrderBy()`), `filterJs` (applied vs draft selection). See `examples/nomenclatures-list`.
- **Modals** each get a script owning `currentItem`, `toggleModal(item)`, `close()`, `onSubmit()`, `loading`. `close()` closes first and clears fields after ~100ms so the content does not flash empty; it skips the clear if the modal was reopened meanwhile. See `examples/dictionary-items`.
- **Mutations** check `error`, then check the returned key (`data?.item?.fcp_id`) because Hasura returns `null` for a row the user may not touch, then `app.showAlert(..., 'success' | 'error')`, then re-run the list query.
- **Cascades:** when a parent row owns child rows, delete the children first (`deleteDictionaryItems`, then `deleteDictionary`).
- **One panel, several entry points: reuse it with a mode.** When two flows open nearly the same drawer or modal (grant a role to employees from the role vs. pick the role first from the employees tab), keep one panel and give its script a `mode`. The differences become bindings on `mode` (an extra role `Select` shown only in one mode, the title, the submit label, what is reloaded after saving) and two openers (`open(role)`, `openForEmployees()`) that set the mode and share one `show()` reset. A second copy of the panel duplicates the selection and submit logic and drifts. Conditional fields follow the chosen record, for example a workgroup select shown only when the chosen role has a workgroup condition, and reset when the role changes.
- **Breadcrumbs** come from a `breadcrumbsJs` returning `[{ id, label }]` and an `onNavigate(id)`; the last label falls back to `'Завантаження...'` while the query loads.
- **Required inputs:** a `notBlank(field)` helper plus `valid` and `dirty` on each field drive `getDisableSubmit()`.

## Build and wire

Author each view as `work/<name>/<view>/page.ts` inside the skill folder (untracked) with its scripts in a `scripts/` folder, like the folders in `examples/`. One level deeper than `examples/`, so import the builder as `../../../scripts/builder`. Then:

```bash
node $T app <name> .claude/skills/lowcode-page-json/work/<name>
```

For every view it builds, validates and writes `apps/lowcode/src/pages/<name>/schemas/<view>.json`, creates `schemas/index.ts` and `<Name>.tsx` when they do not exist (existing files are never overwritten), and prints the `lazy` import and route entries to paste into `router.tsx`. It stops without writing the wrapper if any view fails validation. Add `--out <dir>` to write somewhere else.

Register the routes by hand, then typecheck and lint (see SKILL.md). Rendering a registered route needs no dev server: `node $T render /<name> shot.png`.

## Per-view checklist

1. Every action in the design goes somewhere (navigate, modal, mutation) or is listed in the report as left inert.
2. Every query used by a view is declared in that view: queries are per JSON, not shared.
3. `validate` passes, including the reference check for script, query and block names.
4. `render` matches the design at the design's content width.
5. Every route the views navigate to is in the router snippet.
