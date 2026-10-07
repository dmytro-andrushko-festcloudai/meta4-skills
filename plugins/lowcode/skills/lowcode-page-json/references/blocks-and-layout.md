# Blocks, layout and design translation

Contents: how layout works, blocks worth knowing, mapping Figma values to tokens, and the gotchas that cost time when translating a design.

## Read a block's real props first

```bash
node .claude/skills/lowcode-page-json/scripts/tool.mjs props <Block>
```

prints the props and defaults, the slot keys and the methods, straight from the declaration. Block folders are in `apps/lowcode/src/blocks/`: badge, breadcrumbs, button, checkbox, checkbox-group, date-picker, divider, drag-and-drop, drawer, dropzone, filter, icon, icon-picker, image, input, list, menu, modal, phone-input, popover, radio-group, repeater, select, stack, switch, switcher, table, tabs, tag, text, tree. Only the blocks below were read in detail when this skill was written; use `props` for the rest.

## Layout model (every block has these props)

`widthMode` / `heightMode` are `fill`, `hug` or `fixed`; `width` / `height` apply only when `fixed`. Along the parent's main axis `fill` means `flex: 1 1 0`, `hug` means `auto`. Across it `fill` means stretch. `horizontalAlign` / `verticalAlign` on a Stack position its children (`start`, `center`, `end`, `stretch`, `space-between`). `padding` and `margin` take CSS shorthand strings. `customCss` takes plain declarations (`position: relative;`) but drops `url(`, `@import` and `expression(`.

Stack is the only container: `direction` (`row` / `column`), `gap`, `wrap`, `bgColor`, `borderColor` (draws a 1px border), `borderRadius`. A Figma auto-layout frame is a Stack.

## Blocks used so far

| Design element | Block | Notes |
|---|---|---|
| Frame / auto-layout | `Stack` | `children` is a slot array |
| Any text | `Text` | `variant` is a ui-v2 typography variant, `color` takes a CSS value |
| Button | `Button` | `variant` contained/outlined/text, `size` sm 28px / md 32px / lg 36px, `startIcon` / `endIcon` are Phosphor names |
| Icon | `Icon` | `icon` Phosphor name, `color` is a palette (`primary`, `secondary`, `error`), `size` md 20px / sm 16px |
| Status pill | `Badge` | `color` is a palette, `dot`, `size` sm/md/lg |
| Photo / avatar | `Image` | `src`, `size`, `radius`, `fit`, `fallback` man / woman / no_photo |
| Repeated rows or cards | `Repeater` | `data` binding, `currentItem` in the row scope, `showAddButton: false` for read-only |
| Tabular data | `Table` | `columns` + `cell1..cell12` slots, `data`, built-in pagination props |
| Sort / row-action menu | `Menu` | `trigger` slot holds the Button; `selectedValue` and `setSelectedValue` drive sort, see `nomenclatures-list` |
| Multi-category filter | `Filter` + `CheckboxGroup` + `Input` | draft selection vs applied selection kept in `filterJs`, see `nomenclatures-list` |
| Paginated card list | `List` | like Repeater plus the Table pagination props; no `gap` prop, so space rows with `customCss: 'gap: 4px;'` |
| Create/edit dialog, delete confirm | `Modal` | one script per modal; fields reset after close, see `dictionary-items`. Children are a flat list spaced by `margin`, as in `ModalDictionary`: subtitle `4px 0 0`, first field `24px 0 0`, every next field (or row Stack of fields) `16px 0 0`, actions Stack `24px 0 0` with `gap: 12px` |
| Tabs over a list | `Tabs` | `tabs: [{ id, label, value, content: [] }]`, `defaultValue`, `onChange`; `showToolbar` + `toolbar` slot for the icons on the right. Only the active tab's `content` renders and an empty content is still 250px tall, so each tab holds its own List (unique names) and one query filters on `Tabs.value`. Give the first block in each tab `margin: '12px 0 0'` for the gap under the tab strip, as in taxonomies (`TabsView`) |
| Details side panel | `Drawer` | `anchor: 'right'`, `width`, `setOpen()`; a script keeps the opened item (`detailsJs.item`) and the drawer binds to it. Start it with the header divider below. Live example: `taxonomies/schemas/list.json` (`DrawerDetails`). With bottom action buttons and a long list, use gotcha 23 instead (`security-roles.json`, `DrawerRole`, `DrawerAccess`) |
| Page trail | `Breadcrumbs` | items come from a script, `onNavigate(id)` |
| Hierarchy | `Tree` | see `taxonomy-merge` |
| Form fields | `Input`, `Select`, `Checkbox`, `RadioGroup` | `valid` / `dirty` / `reset()` feed the submit state, see `nomenclatures-form` |

Pagination props on `Table` and `List`: `enablePagination`, `serverSidePagination`, `pageSize`, `totalCount`, `onPageChange`, `onPageSizeChange`. **Repeater has no pagination**: use `List` for a paginated card list. To hide pagination when everything fits on one page, bind `enablePagination` to `total > <smallest page size>` (15); comparing against the selected `pageSize` hides the size picker after the user picks a larger size, and they cannot switch back.

## Figma values to ui-v2 tokens

Colours are CSS variables `var(--color-<palette>-<step>)`, for example `primary.light_hover` becomes `var(--color-primary-light_hover)`. The `v('primary-light_hover')` helper in `scripts/builder.ts` builds that string.

Figma's variable names do not always equal ui-v2's semantic names (`text/lable` in Figma is `text.label` in code). Match by **hex**: find the hex in `shared/ui-v2/src/lib/theme/design-system/color/primitives.ts`, then the semantic key that points at it in `semantics.ts`. Verified pairs: `#161A22` text.title, `#3F4653` text.label, `#A3A8B2` text.placeholder / text.tertiary, `#555D6D` text.secondary, `#1570EF` primary.default, `#3393FA` primary.hover, `#E1F0FE` primary.light_focus, `#F0F8FF` primary.light_hover, `#E3E5E8` secondary.light_hover, `#D4D6DB` secondary.light_default, `#D92D20` error.default, `#F04438` error.hover, `#FEE4E2` error.light_hover, `#EBE9FE` purple.light_focus.

Typography: Figma `body/body 4 - SB` is variant `body4-sb`; `heading/H2 - M` (24px) is `heading2-m`; `heading/H4 - M` (18px) is `heading4-m`; `overline/overline 3 - SB` is `overline3-sb` (uppercase already). The full list is `TYPOGRAPHY` in `shared/ui-v2/src/lib/theme/components/mui-typography/mui-typography.ts`.

Icons: Figma icon frames are Phosphor icons. Identify them by comparing the path with `node_modules/@phosphor-icons/react/dist/defs/<Name>.es.js` (scale 256 -> 20 by 12.8). Sort is `SortAscending`-style, edit is `PencilSimple`. Only names in `shared/ui-v2/src/lib/icon/icon-registry.ts` work.

## Gotchas found while translating a real design

1. **Figma measures padding from the outer edge, CSS adds the border on top.** A card with 20px padding and a 1px border is 84px tall in Figma but 86px in the browser. Use `padding = design padding - 1px` on any Stack that has a `borderColor`.
2. **An empty Stack is 40px tall** (editor drop-target height). For dots, dividers and spacers add `customCss: 'min-height: 0;'`.
3. **Bordered icon button:** an `Icon` with `borderColor`, `borderRadius`, `bgColor` and `padding: '7px'` gives the 36px square (20px icon + 14px padding + 2px border).
4. **No overlay or chart blocks.** Overlay text on a shape with a parent `customCss: 'position: relative;'` and a child `customCss: 'position: absolute; top: 0; left: 0;'`. The editor canvas ignores `position`, `display` and `transform` from `customCss`, so it looks wrong in the editor and right in the viewer; judge by `render`. A progress ring or sparkline is an `Image` whose `src` is a data-URI SVG built in a script from the data. Use hex colours in that SVG: CSS variables do not resolve inside an `<img>`.
5. **Avatars:** leave `src` empty and set `fallback` to `man`, `woman` or `no_photo` (files under `assets/images/image/`). Do not copy Figma avatar art into the repo.
6. **Conditional rows:** `visible: "{{ !!currentItem.subtype }}"` hides a row per item.
7. **Plurals and formatting** that the design shows ("1 день", "4 дні", "20 днів") belong in the data script, not in the block.
8. **Design mock data is not data.** The same name repeated on every row is a placeholder; still use it as the mock, but say it is mock.
9. **Drawer header sits under the close button.** The Drawer draws its own close button in the top corner, so a title placed first overlaps it or sits too close to the content. Make the first child a full-width `Divider` (`orientation: 'horizontal'`, `borderWidth: '1px'`, `padding: '38px 0 24px'`, `margin: '0 -24px 0'`); the negative margin runs the line past the drawer's 24px padding. Put no top margin on the header after it. Same as `DrawerDetails` in taxonomies.
10. **Tab content sits flush under the tab strip.** The Tabs block adds no space between the strip and the content; put `margin: '12px 0 0'` on the first block of every tab (taxonomies does this on each Repeater/Table).
11. **Two blocks must not bind to each other's values.** A binding that reads `Other.value` subscribes to Other's whole merged state, including Other's own bound props. So `DatePickerStart.maxDate = {{ DatePickerEnd.value }}` together with `DatePickerEnd.minDate = {{ DatePickerStart.value }}` throws `Cycle detected` and the prop resolves empty. Keep the shared values on a script instead: each block's `onChange` writes them (`modalJs.onStartChange(value);` sets `this.startDate`), and the props read the script (`{{ modalJs.endDate }}`). Reset those script fields wherever the form resets.
12. **Clickable card:** put the action on the card Stack's `onClick` (`detailsJs.open(currentItem);`) and add `customCss: 'cursor: pointer;'`; `currentItem` is in scope there.
13. **Responsive widths:** the design's fixed columns (for example 304px, 240px, 300px) are `widthMode: 'fixed'` Stacks. Check the render at the design's content width, not the frame width: the frame includes the 200px sidebar and page margins.
14. **Table cells are top-aligned by default.** The cell slot takes its alignment from the Table's own `verticalAlign`, so set `verticalAlign: 'center'` on the Table, not on each cell, to centre names, badges and action icons in a row.
15. **Wrap each `Filter` category panel in one column Stack** (`direction: 'column'`, `gap: '12px'`, `heightMode: 'hug'`, `verticalAlign: 'start'`) holding the search `Input` and the `CheckboxGroup`. Two loose siblings in a `panel` are spread apart and the checkboxes float away from the search. Give every category its own search `Input` when the design shows one.
16. **Hide pagination when there is only one page, on every paginated `Table` and `List`.** Never leave `enablePagination: true` as a constant; bind it:
    - server-side: `enablePagination: "{{ (getX.data?.total?.aggregate?.count || 0) > 15 }}"`, the same expression as `totalCount`, with optional chaining so it does not throw before the first response;
    - client-side: `enablePagination: "{{ permsJs.getRows().length > 15 }}"`, the same call the `data` binding makes;
    - a table that switches mode (a server-paged list with a local "Selected" tab): `"{{ accessJs.tab === 'selected' ? accessJs.getCount() > 15 : (getEmployees.data?.total?.aggregate?.count || 0) > 15 }}"`.

    Compare against 15, the smallest page-size option, not `Table1.pageSize`: once a user picks a larger size the bar would vanish and they could not switch back.
17. **Check enum values against a real response before mapping them.** Hasura returned `status: "PUBLISHED"`, not the `publish` a design label suggested. Map case-insensitively in the script and send the real value in `_in` filters. Audit columns such as `audit_updated_by` can be `null`; render a dash, and do not build lookups from null ids.
18. **A filter option list that would need its own query can be static.** The roles Author filter is the letters A-Z and А-Я; on Apply a script resolves them to ids (principals whose second name starts with a letter or contains the search text) and the list query filters `audit_updated_by _in ids`. An empty match must filter to nothing, not be treated as "no filter".
19. **Never paste `x-hasura-admin-secret` into page JSON.** Page JSON ships to every browser. Headers are `Authorization: Bearer ${app.token}` only; if a table is not readable, fix the Hasura permission.
20. **`Tabs` used as a tab strip only (no panel content) needs `heightMode: 'fixed'` and `height: '33'`.** Left on `hug` it reserves a tall empty panel and pushes everything in the same row apart. Drive the table from `onChange` and `TabsScope.value`.
21. **Per-row checkboxes that depend on each other:** keep the rows in a script (`permsJs.rows`), bind each `Checkbox` `defaultValue` to `currentItem.<level>`, and in `onChange` call a script method that returns a **new** array (`this.rows = this.rows.map(...)`). Mutating a row in place does not refresh the table. Do not name a row field `parent` (blocked identifier): use `owner`.
22. **The `Modal` block draws its own close button and has a fixed width.** Do not add a second close `Icon`, and use `widthMode: 'fill'` for the content Stack, not a fixed width wider than the modal.
23. **Drawer with action buttons pinned to the bottom, a divider above them, and scrolling content.** `margin: 'auto 0 0'` on the footer does not push it down, and negative side margins on it were not applied either, so do not build it that way. What works (`DrawerRole` and `DrawerAccess` in `security-service/schemas/security-roles.json`):
    - Drawer: `padding: '68px 24px 24px'` and `customCss: 'overflow: hidden'`. The 68px top keeps the scroll area below the close arrow, so rows never scroll under it; this replaces the divider trick of gotcha 9 in a scrolling drawer. With the Drawer's default scroll the footer scrolls away with the content.
    - Content Stack (the Drawer's only child): `heightMode: 'fill'`, no padding, and `customCss: 'overflow-y: auto;\n\n& > div {\n  align-self: flex-start;\n  padding-bottom: 72px;\n}'`. The Stack's inner slot is stretched to the visible height, so padding on the Stack ends up behind the footer and hides the last rows; `align-self: flex-start` lets the slot take its content height and the padding goes after the last row. The footer is about 73px tall and the Drawer already has 24px of bottom padding, so 72px leaves a gap above the divider.
    - Footer Stack (last child of the content Stack): `padding: '16px 24px'`, `horizontalAlign: 'end'`, `customCss: 'position: absolute;\nleft: 0;\nright: 0;\nbottom: 0;\nbackground-color: #fff;\nborder-top: 1px solid rgba(0, 0, 0, 0.08)'`. The Drawer paper is the positioned ancestor, so the footer and its divider run edge to edge. The editor ignores `position` (gotcha 4), so judge it in the viewer.
24. **One drawer opens another: close the first, then open the second.** Two open drawers stack their backdrops. Keep what the second one needs before closing: `const role = this.role; DrawerRole.setOpen(false); accessJs.open(role);`.
25. **Levels that include each other (View < Edit < Admin) must cascade on read-only screens too,** not only in the editing form. The API stores only the highest level, so a details drawer that sets just `row[action] = true` shows Admin without Edit and View. Set every level up to the stored one: `LEVELS.slice(0, LEVELS.indexOf(action) + 1).forEach((level) => (row[level] = true))`.
26. **Gate actions on the record's status in every place they appear.** "Assign to employee" is valid only for published roles: hide the drawer button with `visible: "{{ tableJs.isActive(drawerJs.role?.status) }}"`, drop it from the row menu in the same script that builds the menu items, and return early in the script method that opens the flow.
