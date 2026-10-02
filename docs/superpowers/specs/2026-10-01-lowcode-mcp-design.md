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
- Read-only: generated pages use GraphQL queries only. No mutations, no create, edit or delete flows. Design controls that imply writes (add, edit, delete buttons, form submit) are rendered inert and listed in the report, per the skill's rule about not inventing behaviour. The supported views are list and preview.
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
| `hasura_list_apps` | Introspects all tables and groups them by name prefix. Grouping starts at the first word; a group whose tables share a longer common prefix, or that has more than 40 tables (default, configurable), is split by the next word and reported as `meta4de_hr_` style apps. Tables with no underscore go in an `(other)` group. Returns each app with its table count. |
| `hasura_find_tables(query)` | Resolves user-provided scope words or table names (`people vacation`, `people_vacation`) to matching tables by name, ranked, using the cached introspection. |
| `hasura_list_tables(app)` | Tables of the chosen app prefix. If the user has not chosen an app or table, elicit it; clients without elicitation get the list and Claude asks in chat. |
| `hasura_describe_table(table, depth?)` | Columns, types, nullability, relationships, and up to 3 sample rows. With `depth` (default 1, max 2) it also describes tables reachable through relationships and returns the related-table list so the user can keep or drop them. Output feeds query shaping, replacing the skill's "ask for a sample" step. |
| `lowcode_block_props(type)` | Real props, defaults, slots of a block. |
| `lowcode_build(pageTs, outJson)` | Builder script to page JSON. |
| `lowcode_validate(json)` | Declaration, compile and reference checks, plus a server-side read-only check: any query whose GraphQL document starts with or contains a `mutation` operation is a problem. Fails with the list of problems. |
| `lowcode_render(json, png, width?)` | Headless render so Claude can compare it with the Figma screenshot. |
| `lowcode_wire_app(name, viewsDir)` | Build and validate every view, create wrapper, print routes. |

Prompt `create_lowcode_page(figmaUrls[], hasuraUrl?, scope?)`: fetch each Figma link through the Figma MCP; if `hasuraUrl` is given, run connect; resolve `scope` with `hasura_find_tables`, or run the app pick and table pick; describe with related tables; then follow `lowcode-page-json` using the tools above.

## Security

- The admin secret exists only in server memory for the session. It is never written to disk, logged, or returned in tool output or errors.
- Hasura traffic is read-only introspection and `limit 3` sample selects. No mutations, no `run_sql`. The generated pages are held to the same rule by `lowcode_validate`.
- Repo cache holds only the cloned source, never credentials.
- A local checkout is read, never modified by repo resolution. Page output goes only to paths the user's request names (`lowcode_wire_app` writes into the local repo's `apps/lowcode/src/pages/<name>/`, as the skill does today).

## Errors

Missing git access, unreachable Hasura, bad secret, missing repo cache and validation failures each return a short actionable message. Tool failures are MCP errors, not thrown crashes.

## Testing

- Unit: Hasura introspection to table-description mapping, against recorded responses.
- Unit: repo resolution order (env var, cwd parent, cache clone) and that a local checkout never triggers a clone.
- Unit: prefix grouping into apps (single-word, multi-word, no-underscore tables, oversized group split).
- Unit: scope resolution (`people vacation`, `people_vacation`, ambiguous, unknown) and relationship traversal at depth 1 and 2, including cycles.
- Unit: `lowcode_validate` rejects a page containing a mutation query.
- Unit: secret never appears in any tool result or error.
- End-to-end: build, validate and wire one skill example (`nomenclatures-list`) through the tools against a cloned repo.

## Out of scope

Server-side Figma calls, Hasura mutations and any page that writes data, writing into the monorepo or git operations on it beyond the cache clone, non-admin Hasura auth (JWT, SSO).
