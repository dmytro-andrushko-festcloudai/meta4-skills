# Data, queries and scripts

Contents: page structure, query nodes, scripts, the `app` object, common list and form patterns, mock-first data, Hasura notes.

## Page document

```json
{ "root": { "props": { "queries": [], "modules": [], "scripts": [] } }, "content": [ /* blocks */ ], "zones": {} }
```

`scripts` are named objects other code reaches by name (`constantsJs`, `tableJs`, `formJs`). `queries` are named requests reached by name (`getLegalEntities.run()`, `getLegalEntities.data`). Blocks are reached by their `name` (`Table1.setPage(1)`, `Input1.value`), which the builder assigns as `Type1`, `Type2`, ... in creation order. `scripts/builder.ts` exports `page`, `script`, `graphqlQuery`, `node`, `stack`, `text`, `icon`, `button`.

## Query nodes

GraphQL (what every existing page uses):

```json
{ "id": "<uuid>", "kind": "graphql", "name": "getThings", "endpoint": "{{ constantsJs.GRAPHQL_URL }}",
  "operation": "query", "query": "query GetThings { things: schema_things_v1 { fcp_id name } }",
  "variables": "{}", "headers": "{{ { \"Authorization\": `Bearer ${app.token}` } }}", "runOnPageLoad": true }
```

REST: `kind: "rest"`, `url`, `method` (GET/POST/PUT/PATCH/DELETE), `headers`, `body`, `runOnPageLoad`. Bodies are sent only for non-GET and default to JSON.

- `graphqlQuery(name, query, { runOnPageLoad, variables })` in the builder produces the GraphQL node with the endpoint and Bearer header already set. It sets `operation` from the text; existing pages leave `operation: "query"` on mutations and it still works because only `subscription` is treated differently.
- `variables`, `headers`, `endpoint`, `url` and `body` are templates: `{{ }}` bindings are resolved when the query runs, so they can read blocks (`Input1.value`) and other queries. Queries that reference each other run in dependency order on page load.
- A query with `runOnPageLoad: false` runs when a script calls `.run(args)`. Arguments are available as `params` inside its variables (`{{ { "id": params.id } }}`).

## Scripts

A script is the body of a function that returns an object; methods on it are the page's handlers.

```js
const basePath = constantsJs.basePath;

return {
  async getData() {
    Table1.setPage(1);
    await getLegalEntities.run();
  },
  onEdit() {
    app.navigate(`${basePath}/${Table1.selectedRow.fcp_id}/edit`);
  },
};
```

Conventions from `legal-entities`: `constantsJs` holds `GRAPHQL_URL` and `basePath` (`/${lng}/low-code/<route>`, `lng` from `app.URL`); one script per concern (table, filter, form, breadcrumbs, options); a data-shaping script turns the query response into the rows the blocks bind to (`getData()` returning `{ fcp_id, name, ... }[]`), so bindings stay one-liners.

Blocked identifiers apply here too (see SKILL.md). Avoid naming a local `parent`, `top`, `self`.

## The `app` object

Readable in bindings: `app.URL` (`.pathname`, `.query`, `.params`, `.base`), `app.mode` (`'editor'` or `'viewer'`), `app.token`, `app.vars`. Only in scripts and actions: `app.navigate(to, { replace, newTab })`, `app.setSearchParams(patch)`, `app.setVar(name, value)`, `app.showAlert(message, severity)`. Navigate with the full shell path, `/uk/low-code/<route>`.

## Binding a list or table to a query

Server-side list (from `legal-entities/schemas/list.json`): the query takes `offset`, `limit`, `order_by`, `where` built in its `variables` binding from `Table1` page/size state, the search `Input1.value` and filter widgets, plus a `<root>_aggregate` field for the total. The Table binds `data` to `{{ getX.data.<alias> }}`, `totalCount` to `{{ getX.data.total.aggregate.count }}`, `serverSidePagination: true`, and `onPageChange` to `{{ getX.run() }}`. Re-run the query after changing filters and reset with `Table1.setPage(1)`.

Forms (create/edit) live in `create.json` / `edit.json`: an `initJs` script reads `app.URL.params.id`, runs the lookup queries in `Promise.all`, and a `formJs` script computes `isSubmitDisabled()` from each field's `valid` and `dirty` and performs the mutations. Read `create.json` when a page needs a form; do not reinvent it.

## Mock-first data

When the API is not ready, put the data in a script and bind to it exactly as if it were a query result, so swapping in the real query changes only the binding: `data: '{{ vacanciesJs.requests }}'` becomes `'{{ getRequests.data.requests }}'`. `examples/vacancies.script.txt` shows the pattern, including computed values (plural forms, a ring SVG). Always say in the report which parts are mock.

## Hasura notes

- Alias root fields (`things: schema_things_v1`) so `data.things` is stable regardless of the table name.
- Use `<root>_aggregate { aggregate { count } }` for totals.
- Table names carry a schema prefix and a version (`businessmngt_legal_entities_v1`, `meta4dev_widgets_v0`) and versions change. Take names from a query the user has run against the target environment.
- Some schemas are permission-denied when queried directly (for example `permission denied for schema ui_artifact_v0`); reach that data through a relation from an allowed table. When a query fails with permission errors, ask for a working query instead of guessing.
- Relation field names are generated (`<child_table>_<fk_column>_array`, `<parent>_<fk>_<table>`); copy them, do not derive them.
