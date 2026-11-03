# Js files: `export`, `state` and the page `init`

Every js file of a page is a module. What it exports is its API (`table.getData()`, `filter.selectedFilters`), what it holds in `state(...)` is what the page sees change. Do not write the old form (`return { loading: false, async getData() { this.loading = true; ... } }`): `this` is not available, a field assigned that way does not re-render, and `tool.mjs validate` reports it. The reference implementations are the pages under `examples/` and `apps/lowcode/src/pages/vacancies/schemas/vacancy-list.json`.

```js
const PAGE_SIZE = 15;

export const loading = state(false);
export const tab = state('all');

export const rows = (getVacancies.data?.vacancies ?? []).map(map);

export function setTab(value) {
  update(tab, value || 'all');
  refetch();
}

export async function refetch() {
  update(loading, true);

  try {
    await getVacancies.run();
  } finally {
    update(loading, false);
  }
}

function map(item) {
  return { key: item.fcp_id, title: item.details?.name };
}
```

## What a top-level declaration means

| Declaration | Meaning |
|---|---|
| `export const x = state(initial)` | State: what the page follows. Read it by name (`x`) in the file and as `file.x` from a binding or another js file. Change it only with `update(x, next)`. |
| `export const y = <expression that reads a state, a block, a query or `app`>` | Derived value: recomputed when what it read changes. `rows` above is one. It cannot be assigned. |
| `export const Z = <literal or expression that reads nothing that changes>` | A frozen constant (endpoints, option lists, `basePath`). |
| `export function f() {}` / `export async function f() {}` | A handler or a getter other code can call: `file.f()`. Every exported function runs as one batch, so the page re-renders once when it returns. |
| `function g() {}`, `const h = ...` (not exported) | Private helper or constant. Not reachable from outside the file. |
| `let n = 0` | The file's own plain JS, not state: nothing re-renders when it changes. Use `state` for anything the page shows. |

Only named exports exist (`export const`, `export function`); no `export default`, no `import`.

## Changing state

- `update(x, next)` replaces the value; `update(x, (previous) => next)` computes it from the previous one. A path works too: `update(filters.names, ['a'])`, `update(todos[0].done, true)`.
- A row read from state (`currentItem`, `Table.selectedRow`, an item you `find`) is found by identity: `update(currentItem.done, true)` changes that row in its list.
- State is JSON data: `null`, booleans, numbers, strings, arrays, plain objects. A `Date`, `Map`, class instance or function is refused. Keep a date as an ISO string.
- State is frozen: never mutate it (`rows.push(x)`, `obj.a = 1`, `sort()` in place). Build the next value (`[...rows, x]`, `{ ...obj, a: 1 }`, `[...rows].sort()`) and `update` it.
- An object lives in one place. Keep `selectedId` and find the row with a derived value (`export const selected = rows.find((row) => row.id === selectedId)`), do not store the row twice.
- `update` does not run inside a binding or in a function a binding calls. Bindings only read.
- After an `await`, each `update` reaches the page at once; inside a synchronous call the changes arrive together when it returns.

Assigning another file's state (`merge.loading = true`) is refused: call a function of that file, or `update(merge.loading, true)` where that is meant.

## The page `init`

`init` is a field of the page, not a js file: `root.props.init` holds a few lines that run when the page opens, after the queries marked `runOnPageLoad`. It only starts things:

```js
dictionary.load();
```

With the builder: `page({ init: initCode, scripts, queries, content })`. Everything `init` needs is an exported function of a js file (`export async function load() { ... }`), so the same function reloads the data later. A query started from `init` is shown as a step of the page load. Do not read permissions in `init` (see `references/permissions.md`).

A value the whole page needs, such as the route id, is an exported constant of `constants`, not something `init` returns:

```js
export const id = app.mode === 'editor' ? '<a real id>' : app.URL.params?.id || null;
```

Bindings and other files read `constants.id`. In editor mode there is no route param, so fall back to a real id so the preview has data.

## Names

- A top-level name of a file must not be a block, a query, another js file, or an engine name (`app`, `params`, `inputs`, `currentItem`, `currentIndex`, `parent`, `self`, `top`). A script `dictionary` that declares `getDictionary` hides the query of that name: `getDictionary.data` is then your function. Name the getter for what it returns (`current()`), and a state for what it holds (`item`, not `currentItem`).
- Names are one namespace per page: `state` and `update` are reserved inside a file.
- A local variable or parameter named like a state hides it inside that function, so `update(filters, ...)` there does not reach the state. Give the parameter another name. `tool.mjs validate` reports an assignment that lands on such a local.

## Converting an old file

| Old | New |
|---|---|
| `return { loading: false, ... }` | `export const loading = state(false);` |
| `this.loading = true` | `update(loading, true)` |
| `this.rows = this.rows.map(...)` | `update(rows, (previous) => previous.map(...))` |
| a field that is computed (`getTotal()` reading `this.items`) | a derived `export const total = items.length` or a function |
| `method() { ... this.other() }` | `export function method() { ... other() }` |
| a helper only the file uses | a plain `function helper() {}` (not exported) |
| `init` js file: `fetchData(); return { id };` | `init` code `dictionary.load();`, `export const id` in `constants`, `export async function load()` |
| `init.id` in bindings and files | `constants.id` |
| a method named like a query (`getDictionary()`) | rename it (`current()`) |
| a state named `currentItem` | rename it (`item`) |
