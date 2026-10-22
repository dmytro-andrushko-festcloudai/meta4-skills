# Blocks, layout and design translation

Contents: how layout works, blocks worth knowing, mapping Figma values to tokens, and the rules by topic (one file per hard block).

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
| Multi-category filter | `Filter` + `CheckboxGroup` + `Input` | draft selection vs applied selection kept in `filter`, see `nomenclatures-list` |
| Paginated card list | `List` | like Repeater plus the Table pagination props; no `gap` prop, so space rows with `customCss: 'gap: 4px;'` |
| Create/edit dialog, delete confirm | `Modal` | one js file per modal; fields reset after close, see `dictionary-items`. A form dialog is built with `formModal({ title, body, footer })` from the builder: the title and the actions stay fixed and only the fields scroll (`references/blocks/overlays.md`). A confirmation is a small Modal (`width: '448'`, `height: ''`, `maxHeight: '90vh'`) with a title, a text and the actions, and needs no scroll |
| Tabs over a list | `Tabs` | `tabs: [{ id, label, value, content: [] }]`, `defaultValue`, `onChange`; `showToolbar` + `toolbar` slot for the icons on the right. Only the active tab's `content` renders and an empty content is still 250px tall, so each tab holds its own List (unique names) and one query filters on `Tabs.value`. Give the first block in each tab `margin: '12px 0 0'` for the gap under the tab strip, as in taxonomies (`TabsView`) |
| Details side panel | `Drawer` | `anchor: 'right'`, `width`, `setOpen()`; a script keeps the opened item (`details.item`) and the drawer binds to it. Start it with the header divider below. Live example: `taxonomies/schemas/list.json` (`DrawerDetails`). With bottom action buttons and a long list, use `references/blocks/overlays.md` instead (`security-roles.json`, `DrawerRole`, `DrawerAccess`) |
| Page trail | `Breadcrumbs` | items come from a script, `onNavigate(id)` |
| Hierarchy | `Tree` | see `taxonomy-merge` |
| Form fields | `Input`, `Select`, `Checkbox`, `RadioGroup` | `valid` / `dirty` / `reset()` feed the submit state, see `nomenclatures-form` |

Pagination props on `Table` and `List`: `enablePagination`, `serverSidePagination`, `pageSize`, `totalCount`, `onPageChange`, `onPageSizeChange`. **Repeater has no pagination**: use `List` for a paginated card list. To hide pagination when everything fits on one page, bind `enablePagination` to `total > <smallest page size>` (15); comparing against the selected `pageSize` hides the size picker after the user picks a larger size, and they cannot switch back.

## Figma values to ui-v2 tokens

Colours are CSS variables `var(--color-<palette>-<step>)`, for example `primary.light_hover` becomes `var(--color-primary-light_hover)`. The `v('primary-light_hover')` helper in `scripts/builder.ts` builds that string.

Figma's variable names do not always equal ui-v2's semantic names (`text/lable` in Figma is `text.label` in code). Match by **hex**: find the hex in `shared/ui-v2/src/lib/theme/design-system/color/primitives.ts`, then the semantic key that points at it in `semantics.ts`. Verified pairs: `#161A22` text.title, `#3F4653` text.label, `#A3A8B2` text.placeholder / text.tertiary, `#555D6D` text.secondary, `#1570EF` primary.default, `#3393FA` primary.hover, `#E1F0FE` primary.light_focus, `#F0F8FF` primary.light_hover, `#E3E5E8` secondary.light_hover, `#D4D6DB` secondary.light_default, `#D92D20` error.default, `#F04438` error.hover, `#FEE4E2` error.light_hover, `#EBE9FE` purple.light_focus.

Typography: Figma `body/body 4 - SB` is variant `body4-sb`; `heading/H2 - M` (24px) is `heading2-m`; `heading/H4 - M` (18px) is `heading4-m`; `overline/overline 3 - SB` is `overline3-sb` (uppercase already). The full list is `TYPOGRAPHY` in `shared/ui-v2/src/lib/theme/components/mui-typography/mui-typography.ts`.

Icons: Figma icon frames are Phosphor icons. Identify them by comparing the path with `node_modules/@phosphor-icons/react/dist/defs/<Name>.es.js` (scale 256 -> 20 by 12.8). Sort is `SortAscending`-style, edit is `PencilSimple`. Only names in `shared/ui-v2/src/lib/icon/icon-registry.ts` work.

## Rules by topic

Read the file of every block the page uses before building it; each rule is a short section with its reason.

| Topic | File | Covers |
|---|---|---|
| Layout and Figma translation | `blocks/layout-and-design.md` | spacing, sizes, avatars (person and employee avatar by gender), clickable cards, breadcrumbs, custom icons, long values, rendering a route |
| Table and List | `blocks/table.md` | cell alignment, pagination, read-only tables, row highlight, empty state, header row, hover actions, checkbox matrices |
| Modal and Drawer | `blocks/overlays.md` | close button, fixed header and actions with scrolling fields, pinned drawer footer, opening one from another |
| Filter | `blocks/filter.md` | category panels, static option lists, draft vs applied state, resetting search |
| Tabs | `blocks/tabs.md` | content padding, a tab strip alone, search next to tabs |
| Forms and inputs | `blocks/forms.md` | blocks that must not bind to each other, textarea |
| Localization | `blocks/localization.md` | `app.libraries.i18n`, dictionaries |
| Data and queries | `data-and-queries.md` | enum values, no secret in page JSON, script state and mock lists |
| Permissions | `permissions.md` | gating actions by status |
| Names, folders | `scripts-and-queries.md` | naming blocks, js files and queries |
