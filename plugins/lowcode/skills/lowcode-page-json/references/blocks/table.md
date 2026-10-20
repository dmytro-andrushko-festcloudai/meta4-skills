# Table, List and permission matrices

Rules for the `Table` and `List` blocks, row behavior, empty states, and tables of checkboxes.

## Table cells are top-aligned by default

The cell slot takes its alignment from the Table's own `verticalAlign`, so set `verticalAlign: 'center'` on the Table, not on each cell, to centre names, badges and action icons in a row.

## Hide pagination when there is only one page, on every paginated `Table` and `List`

Never leave `enablePagination: true` as a constant; bind it:
- server-side: `enablePagination: "{{ (getX.data?.total?.aggregate?.count || 0) > 15 }}"`, the same expression as `totalCount`, with optional chaining so it does not throw before the first response;
- client-side: `enablePagination: "{{ perms.getRows().length > 15 }}"`, the same call the `data` binding makes;
- a table that switches mode (a server-paged list with a local "Selected" tab): `"{{ access.tab === 'selected' ? access.getCount() > 15 : (getEmployees.data?.total?.aggregate?.count || 0) > 15 }}"`.

Compare against 15, the smallest page-size option, not `Table1.pageSize`: once a user picks a larger size the bar would vanish and they could not switch back.

## Per-row checkboxes that depend on each other

keep the rows in a script (`perms.rows`), bind each `Checkbox` `defaultValue` to `currentItem.<level>`, and in `onChange` call a script method that returns a **new** array (`this.rows = this.rows.map(...)`). Mutating a row in place does not refresh the table. Do not name a row field `parent` (blocked identifier): use `owner`.

## Levels that include each other (View < Edit < Admin) must cascade on read-only screens too,

not only in the editing form. The API stores only the highest level, so a details drawer that sets just `row[action] = true` shows Admin without Edit and View. Set every level up to the stored one: `LEVELS.slice(0, LEVELS.indexOf(action) + 1).forEach((level) => (row[level] = true))`.

## A read-only table must not react to hover or clicks

The Table block always passes row click handlers, so every row gets the hover background and a pointer cursor, and a click leaves it `Mui-selected` (light blue). For preview tables (permissions or users in a details drawer) add to the table's `customCss`:
```css
& tbody tr.MuiTableRow-hover:hover,
& tbody tr.Mui-selected,
& tbody tr.Mui-selected:hover {
  background-color: transparent;
  cursor: default;
}
```
Keep hover on tables whose rows open something or carry checkboxes.

## Highlight rows by what they hold, with `:has()` in the table's `customCss`

Selected rows in a picker: `& tbody tr:has(.Mui-checked) > td { background-color: #F5FAFF; }`. Group rows (a data component above its entities): give the name `Text` a distinct variant (`variant: "{{ currentItem.component ? 'body4-m' : 'body4-r' }}"`, colour `#252B37` / `#555D6D`) and match it: `& tbody tr:has(> td:first-of-type .MuiTypography-body4-m) > td { background-color: #EEF4FF; }`. Colour the `td`, not the `tr`, so it survives the read-only hover rule above. The row builder must set the flag (`component: true`) on group rows.

## Empty state ("Тут поки порожньо"): one rule for every Table, List and Repeater

Always add it, on every list page and every `Table`, `List` or `Repeater` in a drawer, modal or tab, even when the design does not draw it. The three blocks follow the same rule and all read `data`; a `List` and a `Repeater` have no `columns`, their rows are the `children` template. Put the empty Stack right after the block in the same parent, give the empty Stack the empty condition as `visible` and the block its negation. Without it an empty result is a bare header row. Reference: `StackAccessEmpty` in `apps/lowcode/src/pages/security-service/schemas/access.json` (the access drawer).

The table and the empty Stack are mutually exclusive, driven by one script method:
- the empty Stack is `visible: "{{ table.isEmpty() }}"`, the Table is `visible: "{{ !table.isEmpty() }}"` (the access page adds a readiness check, `accessJs.isReady() && ...`, so nothing flashes before the data is there);
- a server-paged list is empty only once the query has answered, so check loading and data first: `isEmpty() { return !getItems.loading && Boolean(getItems.data) && (getItems.data.total?.aggregate?.count ?? 0) === 0; }`. A client-side or tab table uses its own row count (`this.tab === 'selected' && this.getCount() === 0`);
- a search or filter that matches nothing is also empty, so it shows the same state; keep the toolbar (search, sort, filter) above it visible so the user can clear it;
- write `isEmpty()` for every state the table can be in, not only the one you thought of first. A drawer table with an "all" tab and a "selected" tab needs both (`tab === 'selected' ? count === 0 : loaded && !loading && rows.length === 0`, with a `loaded` flag reset when the panel opens), otherwise searching the "all" tab for a string with no match leaves a bare header row. A table with no script method can inline the condition in `visible`: `{{ !loading && rows.length === 0 }}` on the empty Stack and its negation on the Table. Give the empty Stack's children names that cannot clash with the page's other blocks (`TextPeopleEmptyTitle`, not `TextPeopleTitle`; `validate` reports a duplicate). A search or filter that matched nothing needs a hint about changing it (`common.emptyHint`: "Спробуйте змінити пошук або фільтр"), not about creating data;
- the title and hint are text, so on a localised page they are keys (`emptyTitle`, `emptyHint`) in both locale files; take the hint from the design, or use one that says what to do next ("Створіть першу одиницю виміру" only when the create button is visible to this user).

Build: a centred column Stack after the table, `gap: '24px'`, with `horizontalAlign: 'center'` and `verticalAlign: 'center'`, holding an `Image` (`src: 'assets/images/island-with-pc-x2.webp'`, `widthMode: 'hug'`, `size: '284'`, `fit: 'contain'`, `customCss: '& img {\n  height: 240px;\n}'` because the Image block only takes a square size and the asset is 334:282) and a text Stack (`gap: '4px'`, centred): title `heading5-m` `#252B37`, hint `body4-r` `#858C99`. Set `widthMode: 'hug'` on the Image and on both Texts: a Text defaults to `fill` and then sits at the left edge even inside a centred Stack (render it with the empty Stack forced visible to check). Show it with a script method (`isEmpty() { return this.tab === 'selected' && this.getCount() === 0; }`) and hide the table with its negation. Centring vertically:
- in a drawer whose content Stack scrolls (`references/blocks/overlays.md`): `heightMode: 'fill'` on the empty Stack, and add `box-sizing: border-box;\n  min-height: 100%;` to the content Stack's `& > div` rule, otherwise the slot hugs its content and `fill` has nothing to grow into;
- in a drawer or tab where every Stack hugs (a `Tabs` block between the header and the content, as in the access drawer): the `fill` chain does not reach the empty Stack, so use the viewport as in the list page, with the height above it: `customCss: 'min-height: max(320px, calc(100vh - 460px));'` (460px is the drawer header, info rows, tab strip and footer; adjust it when the header grows). `max()` keeps a floor on short screens. A fixed `min-height: 320px` leaves the state at the top of a tall drawer;
- on a list page whose Stacks all hug (title row, toolbar, table): `customCss: 'min-height: max(320px, calc(100vh - 260px));'` on the empty Stack with `verticalAlign: 'center'`, no padding. 260px is the space above it: page title and toolbar (about 150px) plus the shell bar and page padding; checked in the shell on the `/uom` page, where it sat centred. A page with a taller header takes a larger number; do not use fixed top padding, it only centres one viewport height.

Centring needs both parts: `horizontalAlign: 'center'` on the Stack and `widthMode: 'hug'` on its children. `verticalAlign: 'center'` does nothing without the `min-height` (or `heightMode: 'fill'` in a drawer), because a hugging Stack is only as tall as its content.

Check it before reporting: the render harness has no query data, so the empty Stack stays hidden. Copy the page JSON, set the empty Stack `visible` to `{{ true }}` and the Table `visible` to `{{ false }}`, and `tool.mjs render` that copy. The viewport is the render's `--height`, so judge vertical centring in the shell, not in the PNG.

The shell serves `shared/assets/src/lib/images` at `assets/images/`, so the image loads inside the shell, not on the standalone lowcode dev server.

## Table with a header row

put the column names in `columns[].title` (they accept `{{ }}` bindings) and give rows `customCss: '& tbody tr > td { padding: 14px 20px; } & tbody tr:hover > td { background-color: #F5FAFF; }'`. A list that must look headless uses `& thead { display: none; }` and leaves every `title` empty. Pagination follows rule "No pagination bar for a single page".

## Row actions that appear on hover

the cell Stack gets `customCss: '& > div > :nth-child(N) { opacity: 0; transition: opacity 120ms ease-in-out; } &:hover > div > :nth-child(N) { opacity: 1; }'` where `N` is the position of the actions Stack in the row. Always-visible icon actions need no CSS.
