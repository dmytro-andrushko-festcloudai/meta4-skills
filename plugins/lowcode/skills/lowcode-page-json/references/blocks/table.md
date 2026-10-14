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

## Empty state ("Тут поки порожньо"), e.g. a "Selected" tab with nothing selected

A centred column Stack after the table, `gap: '24px'`, holding an `Image` (`src: 'assets/images/island-with-pc-x2.webp'`, `size: '284'`, `fit: 'contain'`, `customCss: '& img {\n  height: 240px;\n}'` because the Image block only takes a square size and the asset is 334:282) and a text Stack (`gap: '4px'`, centred): title `heading5-m` `#252B37`, hint `body4-r` `#858C99`. Show it with a script method (`isEmpty() { return this.tab === 'selected' && this.getCount() === 0; }`) and hide the table with its negation. Centring vertically:
- in a drawer whose content Stack scrolls (`references/blocks/overlays.md`): `heightMode: 'fill'` on the empty Stack, and add `box-sizing: border-box;\n  min-height: 100%;` to the content Stack's `& > div` rule, otherwise the slot hugs its content and `fill` has nothing to grow into;
- on a page whose Stacks all hug: `customCss: 'min-height: calc(100vh - <space above>px);'` with `verticalAlign: 'center'`.
The shell serves `shared/assets/src/lib/images` at `assets/images/`, so the image loads inside the shell, not on the standalone lowcode dev server.

## Table with a header row

put the column names in `columns[].title` (they accept `{{ }}` bindings) and give rows `customCss: '& tbody tr > td { padding: 14px 20px; } & tbody tr:hover > td { background-color: #F5FAFF; }'`. A list that must look headless uses `& thead { display: none; }` and leaves every `title` empty. Pagination follows rule "No pagination bar for a single page".

## Row actions that appear on hover

the cell Stack gets `customCss: '& > div > :nth-child(N) { opacity: 0; transition: opacity 120ms ease-in-out; } &:hover > div > :nth-child(N) { opacity: 1; }'` where `N` is the position of the actions Stack in the row. Always-visible icon actions need no CSS.
