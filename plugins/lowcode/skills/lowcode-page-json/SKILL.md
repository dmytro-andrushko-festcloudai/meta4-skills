---
name: lowcode-page-json
description: Build a low-code page for apps/lowcode (page JSON, its queries, scripts, bindings, route and permission gating) from a Figma design, a Hasura/GraphQL/REST schema or sample response, and the existing lowcode pages as the pattern. Use whenever the user asks to create, build or implement a lowcode page or screen, turn a Figma frame into lowcode blocks, add a /route to apps/lowcode, wire a list or form page to Hasura or another API, or add permissions to a lowcode page, even if they never say "JSON" or "skill".
---

# Lowcode page from a design and an API

A lowcode page is a JSON document (root queries/scripts/modules plus a tree of blocks) that `JsonView` renders inside the shell at `/:lng/low-code/<route>`. It is not hand-written React. The reference implementation is `apps/lowcode/src/pages/legal-entities/` (list, create, edit, preview). Copy its shape, not its data.

The unit of work is: **design + data + permissions -> generated JSON -> validated -> rendered and compared with the design -> wired to a route.** The scripts in `scripts/` make the middle steps cheap, so use them instead of editing large JSON by hand.

## 1. Gather inputs (ask only for what is missing)

- **Figma URL** with a `node-id`. Without one, ask; never guess a node.
- **Data:** the Hasura query and a real response, or the schema/REST contract. Hasura cannot be introspected from here and some schemas are permission-denied, so ask for a sample. If there is none, build against mock data inside a script and say so in the report.
- **Route and views:** path (`/vacancies`) and which views exist (list, create, edit, preview).
- **Permissions:** the data-component names and required level for each action. There is no source of truth in the repo (names are not always table names, e.g. `unit_of_measure` is `uom`), so ask. See `references/permissions.md`.
- **Environment:** `GRAPHQL_URL`. Existing pages use `https://hasura-qa.srv.festcloud.ai/v1/graphql`; confirm before reusing it.

## 2. Workflow

1. **Read the closest existing page** for the pattern you need: list + filters + server pagination (`legal-entities/schemas/list.json`), forms and mutations (`create.json`). Note how scripts are split (`constantsJs`, `tableJs`, `formJs`) and how queries are bound.
2. **Read the design.** Invoke the `figma:figma-design-to-code` skill first, then use `get_metadata`, `get_screenshot` and `get_design_context`. A whole page overflows the tool's output limit, so fetch the visible sections as separate `get_design_context` calls. The shell's sidebar and app header already exist, so skip them. Read the dev-note annotations: they carry business rules (for example "pagination only appears at 13+ items").
3. **Map the design to blocks** with `references/blocks-and-layout.md`. Check any block's real props with `node .claude/skills/lowcode-page-json/scripts/tool.mjs props <Block>` rather than trusting memory or these docs.
4. **Model the data** with `references/data-and-queries.md`: queries, a script that shapes the response into what the blocks bind to, and mock data if the API is not ready.
5. **Add permissions** with `references/permissions.md`.
6. **Generate the JSON** with `scripts/builder.ts`. Copy `examples/vacancies.ts` (layout, repeaters, computed data) or `examples/permissions.ts` (query + gated blocks) and adapt it. Build: `node .claude/skills/lowcode-page-json/scripts/tool.mjs build <page.ts> <out.json>`.
7. **Validate:** `... tool.mjs validate <out.json>`. It checks every block against its declaration and compiles every script and `{{ }}` binding with the engine's own compiler. Read `## Rules` for why each check exists.
8. **Render and compare:** `... tool.mjs render <out.json> shot.png --width <design content width>`. Open the PNG next to the Figma screenshot and fix differences. This works on a JSON file directly, before any route exists.
9. **Wire it up:** put the JSON in `apps/lowcode/src/pages/<name>/schemas/`, add the `index.ts` and `<Name>.tsx` wrapper like `legal-entities`, register the route in `apps/lowcode/src/app/router.tsx`, then typecheck and lint the TS you touched.
10. **Report** what was built, what the design does not define and was left inert, every assumption, and any mock data.

## Rules (each one exists because the page breaks or silently misbehaves without it)

- **Every slot prop is an array** (`children`, Menu `trigger`, Table cells, and so on). An object crashes the whole page with `arr.some is not a function`, and neither tsc nor eslint sees it. `validate` checks this.
- **No blocked identifiers in scripts or bindings** (`parent`, `self`, `top`, `window`, `document`, `location`, `history`, `frames`, `fetch`, ...). A rejected script silently exposes an empty API and callers fail with "X.method is not a function". `validate` runs the real compiler for this reason, not `new Function`.
- **Props must match the declaration**: no unknown props, none missing. The builder fills defaults from the declaration, so let it.
- **Scripts get no comments** and other code only where the reason is not visible from the code. This user removes comments from lowcode scripts on sight.
- **Page text is inline Ukrainian**, as in the existing pages. Lowcode pages do not use i18n.
- **Never run git commands** (add, mv, rm, revert, anything) without approval, and never undo or unstage the user's work. Edit forward. Remove only files you created in this session.
- **Don't invent behaviour the design does not show.** Render controls that exist in the design but wire nothing (buttons, menus, tooltips), and list them in the report.
- **Typecheck with a temp tsconfig.** `tsc -p apps/lowcode/tsconfig.app.json` fails on `ignoreDeprecations` before reading any source. Write `apps/lowcode/tsconfig.check.json` extending `./tsconfig.app.json` with `"ignoreDeprecations": "5.0"`, run `tsc --noEmit -p` on it, then delete it. `npx eslint <paths>` works as is.

## Commands

```bash
T=.claude/skills/lowcode-page-json/scripts/tool.mjs
node $T props Stack                       # real props, defaults, slots of a block
node $T build page.ts out.json            # builder script -> page JSON
node $T validate out.json                 # declaration + compile check, exit 1 on problems
node $T render out.json shot.png          # render a page JSON headlessly
node $T render /vacancies shot.png        # render a registered route
```

`render` bundles the real lowcode `Router`/`JsonView` with the ui-v2 theme in a throwaway harness, so no dev server is needed. The dev server (`nx serve lowcode`, port 4206) returns 404 for deep links and the standalone app has no router of its own, which is why the harness exists.
