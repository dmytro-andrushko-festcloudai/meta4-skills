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

Readable in bindings: `app.URL` (`.pathname`, `.query`, `.params`, `.base`), `app.mode` (`'editor'` or `'viewer'`), `app.token`, `app.user` (`.permissions`), `app.vars`, and `app.hasPermission(requirements)`. Only in scripts and actions: `app.copyToClipboard(text)` (async; was `app.copy`, so pages written earlier need the new name), `app.navigate(to, { replace, newTab })`, `app.setSearchParams(patch)`, `app.setVar(name, value)`, `app.showAlert(message, severity)`. Navigate with the full shell path, `/uk/low-code/<route>`.

## Binding a list or table to a query

Server-side list (from `legal-entities/schemas/list.json`): the query takes `offset`, `limit`, `order_by`, `where` built in its `variables` binding from `Table1` page/size state, the search `Input1.value` and filter widgets, plus a `<root>_aggregate` field for the total. The Table binds `data` to `{{ getX.data.<alias> }}`, `totalCount` to `{{ getX.data.total.aggregate.count }}`, `serverSidePagination: true`, and `onPageChange` to `{{ getX.run() }}`. Re-run the query after changing filters and reset with `Table1.setPage(1)`.

- **Every variable sent must be declared in the operation, and used.** Adding `offset` to `variables` without `$offset: Int` in the query header and `offset: $offset` on the root field fails with `unexpected variables in variableValues: offset`.
- **Never fetch a whole people-sized table into a picker.** Lists of employees, principals and similar must page and search on the server. A `limit: 100` with no offset silently hides everyone after the first hundred.
- **Search across several fields, word by word.** Split the input on spaces and require every word to match one of the fields; email lives on a relation, which Hasura filters through like a column:

  ```js
  const terms = (InputSearch.value || '').trim().split(/\s+/).filter(Boolean);
  const where = {
    _and: terms.map((term) => ({
      _or: [
        { second_name: { _ilike: `%${term}%` } },
        { first_name: { _ilike: `%${term}%` } },
        { persons_fcp_id_principals: { contact_principal_fcp_id_array: { contact_source: { _ilike: 'Email' }, contact_value: { _ilike: `%${term}%` } } } },
      ],
    })),
  };
  ```

- **A server-paged picker with a "Selected" tab** (`TableEmployees` in `security-roles.json`): keep the selection in a script map keyed by id, so it survives page changes and new searches. Bind `serverSidePagination: "{{ accessJs.tab !== 'selected' }}"` so the selected tab pages in the browser over the map. Reset with `TableEmployees.setPage(1)` on open, on search, on page-size change and on tab change, and re-fetch when going back to the "all" tab.

## Checking a query or mutation result

`await getX.run()` never rejects and resolves to `{ data, error }`; it has no `errors` field. GraphQL and HTTP errors arrive as the `error` string. `if (result?.errors?.length)` is always false and swallows every failure, so check `if (result?.error) throw new Error(result.error);`.

**A Hasura mutation that changed nothing is not an error.** Row permissions, a wrong id or a filter that matches nothing return `affected_rows: 0` or a `null` `*_by_pk` result with no `error`. After the `error` check, always confirm the mutation did something, and throw a user-facing message if it did not:

```js
const result = await assignRole.run({ usersToAdd });

if (result?.error) throw new Error(result.error);

if (!result?.data?.insert_securityservice_person_roles_v0?.affected_rows) {
  throw new Error('Не вдалося надати роль');
}
```

- `insert_*`, `update_*`, `delete_*` with `where`: `affected_rows > 0`.
- `*_by_pk` (delete or update by id): the returned `fcp_id` is not null.
- `insert_*` with `returning`: `returning[0].fcp_id` is not null.
- When several mutations run in one operation, check each one only when it had work to do: `if ((toDelete.length && !deleted) || (toAdd.length && !added))`. A delete of optional child rows that may legitimately match nothing is not checked; the parent's result is.
- Hasura actions (`securityservice_deleteRole`, activate) return a custom shape. Ask what a failure looks like instead of guessing a check.

Forms: `examples/nomenclatures-form` serves create and edit from one page. `initJs` reads `app.URL.params.id` and loads the record when present, lookup queries run on page load, and `formJs` computes the submit-disabled state from each field's `valid` and `dirty` and performs the mutations. `legal-entities` splits the same thing into `create.json` and `edit.json`. Do not reinvent either.

Modals (`examples/dictionary-items`): one script per modal owns `currentItem`, `toggleModal(item)`, `close()`, `onSubmit()` and a `loading` flag; the modal's fields are reset after the close animation, and the list is re-fetched after a successful mutation.

## Mock-first data

When the API is not ready, put the data in a script and bind to it exactly as if it were a query result, so swapping in the real query changes only the binding: `data: '{{ itemsJs.rows }}'` becomes `'{{ getItems.data.items }}'`. `examples/nomenclatures-preview/scripts/*.txt` shows the shape: small scripts that return the label/value rows a `Repeater` renders. Always say in the report which parts are mock.

## Hasura notes

- **Reading live Hasura yourself:** propose it to the user first (URL plus an admin secret for dev) and, **before every request, say what you will read, which data, and why**, then wait for a yes. Only `query` operations (including `__type` / `__schema` introspection) and the read-only metadata export (`POST /v1/metadata`, `export_metadata`) are allowed; mutations are never sent by the agent, not even against an id that does not exist. When the page needs a mutation checked, write it out for the user to run. Reads are worth asking for: introspection is how you confirm a field or column type before the page ships (`resolved_at` turned out to be `timestamp`, not `timestamptz`, and `people_organizations_v0` has no `name`; the workgroup name is `people_workgroups_v1.name`), and the metadata is how you learn the real write rules per table (see `permissions.md`). A soft-deleted flag such as `securityservice_workgroups_v1.deleted` is a nullable boolean: confirm it by introspection and filter in the query, not in script after paging.
- **Soft-deleted rows belong in the `where`, not in a `.filter()`.** Filtering a paged list in the script after the fetch makes pages come back short or empty and breaks infinite scroll (a short page is read as the end). Put the condition in the query: `_or: [{ deleted: { _eq: false } }, { deleted: { _is_null: true } }]` (a column that is `null` means not deleted).
- **Request headers** used in development: `x-hasura-admin-secret`, `x-hasura-tenant-id: 1` and `x-hasura-allowed-principal_fcp_id: {<principal fcp_id>}`. Audited tables refuse writes without the principal header (`audit_created_by` cannot be filled) and refuse a `tenant_id` in the payload: it must come from the session header.
- **Alias every root field, in queries and mutations, with a name that has no version.** `things: schema_things_v1` makes `data.things` stable, so a table version bump touches only the query text and no script. Do the same for mutations (`assigned_roles: insert_securityservice_person_roles_v0`, `removed_roles: delete_...`), whose results scripts read for `affected_rows`; an unaliased `insert_..._v0` forces every caller to change on a version bump. Never put the version in the alias (`role_permissions_v1:`). Variable type names (`..._bool_exp`, `..._insert_input`) carry the version too but live inside the query node, so they are part of the one place to edit. **Alias nested relations too**: Hasura's generated names (`rolepermission_role_fcp_id_array`, `persons_fcp_id_principals`) are long and embed the table names, so alias every one the page reads and have scripts use only the alias. **Plural for an array, singular for an object**: `role_permissions`, `emails`, `photos`, `condition_values` for `_array` relations and lists, `person`, `principal`, `permission`, `condition_field` for single-object relations; a mutation root such as `insert_*`/`delete_*` with a `where` returns one `{ affected_rows, returning }` object, so its alias is singular (`assigned_role`, `removed_condition`). Name a filtered contact list for what the filter picks (`photos`, `emails`), not for the generic column. Use the same alias for the same relation in every query, because scripts shared between queries read it. Keep real field names in a `where`: an alias does not apply there.
- Use `<root>_aggregate { aggregate { count } }` for totals.
- Table names carry a schema prefix and a version (`businessmngt_legal_entities_v1`, `meta4dev_widgets_v0`) and versions change. Take names from a query the user has run against the target environment. Versions are per table, not per schema: `securityservice_role_permissions_v1` sits next to `securityservice_roles_v0`. When fixing one version, fix it in every page that names that table.
- Some schemas are permission-denied when queried directly (for example `permission denied for schema ui_artifact_v0`); reach that data through a relation from an allowed table. When a query fails with permission errors, ask for a working query instead of guessing.
- Relation field names are generated (`<child_table>_<fk_column>_array`, `<parent>_<fk>_<table>`); copy them, do not derive them.
- **Ids are `String`, not `uuid`.** `fcp_id` and the other id columns are typed `String` in this Hasura, so declare query variables as `$id: String!` even though the values look like UUIDs. `uuid!` fails with a variable type mismatch.
