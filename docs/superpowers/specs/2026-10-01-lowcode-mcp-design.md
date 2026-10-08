# Lowcode MCP server: design

## Goal

A plugin-shipped MCP server (in `plugins/lowcode/mcp/`) that turns the `lowcode-page-json` skill workflow into tools. A user gives Figma links and optionally a Hasura link, and Claude produces a validated, rendered lowcode page.

## Decisions (from brainstorming)

- Figma: the server does not call Figma. An MCP prompt directs Claude to use the Figma MCP (`get_metadata`, `get_screenshot`, `get_design_context`) for each link.
- Hasura: login uses the admin secret (`x-hasura-admin-secret`). After login the user picks an app, then a table. An app is not a Hasura source or schema: it is the table-name prefix, one or more leading underscore-separated words (`meta4de_`, `people_`, possibly `meta4de_hr_`).
- Block registry and compiler come from the meta4 monorepo (`https://github.com/festcloud/meta4`, private). The server resolves the repo in this order and stops at the first hit:
  1. `META4_ROOT`, if set and it contains `apps/lowcode`.
  2. The current working directory or its nearest parent containing `apps/lowcode` (the user is already inside a local meta4 checkout). This is used as is: no clone, no pull, no git commands on it.
  3. Otherwise, auto-clone (sparse, shallow) into a cache dir with the user's git credentials, reuse it, and refresh only on `repo_sync`.
  The resolved source is reported (`local` or `cache`) in tool results.
- Scope: the user may state the page scope up front, as table names or a feature phrase ("people vacation" means `people_vacation` and its related tables). Without it, the app and table pickers run. A named table is resolved against the introspected list; an ambiguous or missing match falls back to the picker.
- Related tables: starting from the scoped table(s), the server follows Hasura relationships (object and array) to pull in related tables, to a default depth of 1 (configurable, max 2), and lists them for the user to keep or drop.
- Read-only: generated pages use GraphQL queries only. No mutations, no create, edit or delete flows. Design controls that imply writes (add, edit, delete buttons, form submit) are rendered but wired to nothing, and listed in the report, per the skill's rule about not inventing behaviour. The supported views are list and preview.
- Version override: root fields end in a version suffix (`_v0`, `_v1`). The user may ask for another version of a table, such as `securityservice_person_condition_values_v1` in place of the `_v0` found in the metadata. The server swaps the suffix and checks that the resulting root field exists in the live schema (a `__type` lookup on `query_root`). If it exists, the page queries it. If not, the tool returns the versions that do exist and nothing is guessed. The swapped table's columns are re-read from the live schema, since metadata describes the original version.
- Role pages: the role-permissions query (`securityservice_role_permissions_v1` filtered by `role_fcp_id`, selecting `permissions { data_component name fcp_id action entity_name }`) is recorded as a reference for role-details pages. The page takes the role fcp id from the route. It does not change how the page's own permission checks work, which still read `securityservice_person_effective_permissions_v_v1`.
- Permissions on write controls: every write-implying control is still gated by a permission check, so it appears only for users who could use it once wired. The requirement is `<data_component>_<action>`, using the skill's existing `permissionsJs` pattern (`references/permissions.md`, `examples/permissions.*`) and `visible` bindings. Level per Hasura operation: select needs `view`, insert and update need `edit`, delete needs `admin`. A list or preview page also requires `view` on the tables it queries.
- Hasura metadata is the source for data components. The server reads `export_metadata` (admin secret) instead of GraphQL introspection. From each table it takes: `table.schema` and `table.name`, `configuration.custom_name` (the GraphQL root field the page queries, such as `meta4dev_agents_v0`, and what apps are grouped by), relationships, and the permission rules. The data component is the `data_component._eq` value inside the `permission_v1.person_effective_permissions_v` `_exists` clause of the table's permissions (`agent_artifact` for schema `agent_artifact_v0`). If a table has no such clause, the fallback is the schema name without its `_vN` suffix. Either way the user is shown the derived component and can override it. Entity-level rules (`entity_name`, such as `agent`) are reported but not added to the requirement string.
- Approach: a TypeScript stdio server that wraps the skill's existing `tool.mjs` (props, build, validate, render, app) against the cloned repo. No reimplementation of validation.

## Layout

```
plugins/lowcode/
  .mcp.json                      registers the server
  mcp/
    src/server.ts                tool + prompt registration
    src/repo.ts                  clone/refresh, cache path
    src/hasura/{client,introspect,session}.ts
    src/tools/{blocks,build,validate,render,wire}.ts
    test/
  skills/lowcode-page-json/      updated: prefer MCP tools when available
```

## Tools

| Tool | Behaviour |
|---|---|
| `repo_sync` | Reports which repo is in use. With a local checkout (`META4_ROOT` or cwd) it does nothing else and never touches git. With none, it clones into the cache or pulls to refresh. Other tools resolve the repo implicitly and clone only when no local checkout exists. |
| `hasura_connect(url, adminSecret)` | Verifies the secret, stores the session in memory, returns the apps found. Uses MCP elicitation for the secret when the client supports it. |
| `hasura_list_apps` | Reads the metadata and groups tables by the prefix of `custom_name`. Grouping starts at the first word; a group whose tables share a longer common prefix, or that has more than 40 tables (default, configurable), is split by the next word and reported as `meta4de_hr_` style apps. Tables with no underscore go in an `(other)` group. Returns each app with its table count. |
| `hasura_find_tables(query)` | Resolves user-provided scope words or table names (`people vacation`, `people_vacation`) to matching tables by name, ranked, using the cached introspection. |
| `hasura_list_tables(app)` | Tables of the chosen app prefix. If the user has not chosen an app or table, elicit it; clients without elicitation get the list and Claude asks in chat. |
| `hasura_describe_table(table, depth?, version?)` | Columns, relationships, the table's GraphQL root field, its data component (derived, overridable) and the three requirement strings (`<component>_view`, `_edit`, `_admin`) with the operations each covers, and up to 3 sample rows. With `depth` (default 1, max 2) it also describes tables reachable through relationships and returns the related-table list so the user can keep or drop them. Output feeds query shaping, replacing the skill's "ask for a sample" step. |
| `lowcode_block_props(type)` | Real props, defaults, slots of a block. |
| `lowcode_permissions_script(requirements)` | Generates `permissionsJs` and the `getPermissions` query from a map of page action to requirement strings, in the skill's tested form (deny until loaded, `admin` satisfies `edit`, `edit` satisfies `view`). |
| `lowcode_build(pageTs, outJson)` | Builder script to page JSON. |
| `lowcode_validate(json)` | Declaration, compile and reference checks, plus two server-side checks: any query containing a `mutation` operation is a problem; and a page with write-implying controls (blocks named `Button<Create|Add|Edit|Update|Delete|Remove|Save|Submit>*` or the like) must define `permissionsJs` and bind each such control's `visible` or `disabled` to `permissionsJs.can(...)`. Fails with the list of problems. |
| `lowcode_render(json, png, width?)` | Headless render so Claude can compare it with the Figma screenshot. |
| `lowcode_wire_app(name, viewsDir)` | Build and validate every view, create wrapper, print routes. |

Prompt `create_lowcode_page(figmaUrls[], hasuraUrl?, scope?)`: fetch each Figma link through the Figma MCP; if `hasuraUrl` is given, run connect; resolve `scope` with `hasura_find_tables`, or run the app pick and table pick; describe with related tables; then follow `lowcode-page-json` using the tools above.

## Security

- The admin secret exists only in server memory for the session. It is never written to disk, logged, or returned in tool output or errors.
- Hasura traffic is read-only: the metadata export and `limit 3` sample selects. No mutations, no `run_sql`. The generated pages are held to the same rule by `lowcode_validate`.
- Repo cache holds only the cloned source, never credentials.
- A local checkout is read, never modified by repo resolution. Page output goes only to paths the user's request names (`lowcode_wire_app` writes into the local repo's `apps/lowcode/src/pages/<name>/`, as the skill does today).

## Errors

Missing git access, unreachable Hasura, bad secret, missing repo cache and validation failures each return a short actionable message. Tool failures are MCP errors, not thrown crashes.

## Testing

- Unit: Hasura introspection to table-description mapping, against recorded responses.
- Unit: repo resolution order (env var, cwd parent, cache clone) and that a local checkout never triggers a clone.
- Unit: prefix grouping into apps (single-word, multi-word, no-underscore tables, oversized group split).
- Unit: scope resolution (`people vacation`, `people_vacation`, ambiguous, unknown) and relationship traversal at depth 1 and 2, including cycles.
- Unit: `lowcode_validate` rejects a page containing a mutation query, and a write control with no permission binding.
- Unit: version override swaps `_v0` to `_v1`, accepts it only when the root field exists, and otherwise lists the available versions.
- Unit: data-component derivation and operation-to-level mapping, against the recorded `agent_artifact_v0` metadata (tables `agents` and `agent_tools`): `agent_artifact`, view for select, edit for insert and update, admin for delete; fallback to the schema name when no `_exists` clause exists.
- Unit: `permissionsJs` output denies until loaded and honours the level order.
- Unit: secret never appears in any tool result or error.
- End-to-end: build, validate and wire one skill example (`nomenclatures-list`) through the tools against a cloned repo.

## Out of scope

Server-side Figma calls, Hasura mutations and any page that writes data, writing into the monorepo or git operations on it beyond the cache clone, non-admin Hasura auth (JWT, SSO).
