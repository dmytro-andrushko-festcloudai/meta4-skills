# Blocks, layout and design translation

Contents: how layout works, blocks worth knowing, mapping Figma values to tokens, and the gotchas that cost time when translating a design.

## Read a block's real props first

```bash
node .claude/skills/lowcode-page-json/scripts/tool.mjs props <Block>
```

prints the props and defaults, the slot keys and the methods, straight from the declaration. Block folders are in `apps/lowcode/src/blocks/`: badge, breadcrumbs, button, checkbox, checkbox-group, date-picker, divider, drag-and-drop, dropzone, filter, icon, icon-picker, image, input, list, menu, modal, phone-input, popover, radio-group, repeater, select, stack, switch, switcher, table, tabs, tag, text, tree. Only the blocks below were read in detail when this skill was written; use `props` for the rest.

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
| Menus, filters, inputs, selects | `Menu`, `Filter`, `Input`, `Select`, ... | copy them from `legal-entities` |

Table pagination props: `enablePagination`, `serverSidePagination`, `pageSize`, `totalCount`, `onPageChange`, `onPageSizeChange`. **Repeater has no pagination and there is no standalone pagination block.** If a design needs pagination on a card list, that is a gap to report, not something to fake.

## Figma values to ui-v2 tokens

Colours are CSS variables `var(--color-<palette>-<step>)`, for example `primary.light_hover` becomes `var(--color-primary-light_hover)`. The `v('primary-light_hover')` helper in `scripts/builder.ts` builds that string.

Figma's variable names do not always equal ui-v2's semantic names (`text/lable` in Figma is `text.label` in code). Match by **hex**: find the hex in `shared/ui-v2/src/lib/theme/design-system/color/primitives.ts`, then the semantic key that points at it in `semantics.ts`. Verified pairs: `#161A22` text.title, `#3F4653` text.label, `#A3A8B2` text.placeholder / text.tertiary, `#555D6D` text.secondary, `#1570EF` primary.default, `#3393FA` primary.hover, `#E1F0FE` primary.light_focus, `#F0F8FF` primary.light_hover, `#E3E5E8` secondary.light_hover, `#D4D6DB` secondary.light_default, `#D92D20` error.default, `#F04438` error.hover, `#FEE4E2` error.light_hover, `#EBE9FE` purple.light_focus.

Typography: Figma `body/body 4 - SB` is variant `body4-sb`; `heading/H2 - M` (24px) is `heading2-m`; `heading/H4 - M` (18px) is `heading4-m`; `overline/overline 3 - SB` is `overline3-sb` (uppercase already). The full list is `TYPOGRAPHY` in `shared/ui-v2/src/lib/theme/components/mui-typography/mui-typography.ts`.

Icons: Figma icon frames are Phosphor icons. Identify them by comparing the path with `node_modules/@phosphor-icons/react/dist/defs/<Name>.es.js` (scale 256 -> 20 by 12.8). Vacation luggage is `SuitcaseRolling`, first aid is `FirstAid`. Only names in `shared/ui-v2/src/lib/icon/icon-registry.ts` work.

## Gotchas found while translating a real design

1. **Figma measures padding from the outer edge, CSS adds the border on top.** A card with 20px padding and a 1px border is 84px tall in Figma but 86px in the browser. Use `padding = design padding - 1px` on any Stack that has a `borderColor`.
2. **An empty Stack is 40px tall** (editor drop-target height). For dots, dividers and spacers add `customCss: 'min-height: 0;'`.
3. **Bordered icon button:** an `Icon` with `borderColor`, `borderRadius`, `bgColor` and `padding: '7px'` gives the 36px square (20px icon + 14px padding + 2px border).
4. **No overlay or chart blocks.** Overlay text on a shape with a parent `customCss: 'position: relative;'` and a child `customCss: 'position: absolute; top: 0; left: 0;'`. The editor canvas ignores `position`, `display` and `transform` from `customCss`, so it looks wrong in the editor and right in the viewer; judge by `render`. A progress ring or sparkline is an `Image` whose `src` is a data-URI SVG built in a script from the data. Use hex colours in that SVG: CSS variables do not resolve inside an `<img>`.
5. **Avatars:** leave `src` empty and set `fallback` to `man`, `woman` or `no_photo` (files under `assets/images/image/`). Do not copy Figma avatar art into the repo.
6. **Conditional rows:** `visible: "{{ !!currentItem.subtype }}"` hides a row per item.
7. **Plurals and formatting** that the design shows ("1 день", "4 дні", "20 днів") belong in the data script, not in the block.
8. **Design mock data is not data.** The same name repeated on every row is a placeholder; still use it as the mock, but say it is mock.
9. **Responsive widths:** the design's fixed columns (for example 304px, 240px, 300px) are `widthMode: 'fixed'` Stacks. Check the render at the design's content width, not the frame width: the frame includes the 200px sidebar and page margins.
