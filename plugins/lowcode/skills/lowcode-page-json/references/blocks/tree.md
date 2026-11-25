# Tree

Rules for the `Tree` block used as a Filter Tree: a panel on the left that filters the list on the right (workgroups on the specification and position lists). They follow the design-system spec "Tree View" (Figma file `cVUdaf5Qr9YX3HdYDxJOvy`, node `4751:8032`): section 3 (Filter Tree), 5 (Search) and 6 (panel expansion). Live examples: `people/specification/list.json` and `people/position/list.json` (the `workgroups` js file and the `StackWorkgroups` panel in both). Use these two pages as the reference, not the taxonomy pages.

## A Filter Tree opens with the first root selected and cannot be deselected

Spec 3.1: the first root item is selected on load, the list is filtered by it, and no branch is expanded. Set `actionVariant: 'select'` and `unselect: false`, and select the first root in a js file called from the page `init`, after the data has loaded:

```js
export async function init() {
  await load();

  const first = roots()[0];

  if (first) {
    TreeWorkgroups.selectNode(first.id);
    await select(first.id);

    return;
  }

  await table.getData();
}
```

`select(id)` writes the id into state and reloads the table, whose query reads it. Call `workgroups.init()` from the page `init` instead of running the table load next to it, otherwise the first table load runs before the selection and is unfiltered. With no tree data the table loads unfiltered.

## Search is a magnifier icon that opens a SearchInput under the panel header

Spec 5: search is required. The header row holds the title, a magnifier `Icon` (`onClick: toggleSearch()`, `color` bound to the open state) and the expand icon. Under it, a Stack with `padding: '0 15px 8px'`, `customCss: 'position: relative;'` and `visible: {{ workgroups.searchOpen }}` holds a `SearchInput` (`size: 'sm'`, `debounce: true`, `debounceDelay: 300`, `onChange: workgroups.onSearch()`) and an `Icon` `X` (`customCss: 'position: absolute; right: 23px; top: 6px; cursor: pointer;'`, `visible: {{ Boolean(Input.value) }}`, `onClick: workgroups.clearSearch()`). The X position is calculated for a 32px field in a 15px padded panel, so judge it in the viewer.

A `SearchInput` collapses to an icon when it is empty and not focused, so on its own it would open as a 32px square. Until the block has a persistent open state, give it this `customCss`, which also hides the component's own X (the page draws its own so it can clear the text through the script). **Unverified in the app**, check it in the viewer:

```css
& .MuiInputBase-root {
  width: 100% !important;
  height: 32px !important;
  min-height: 32px !important;
  padding-left: 6px !important;
  gap: 6px !important;
  cursor: text !important;
}

& .MuiInputBase-input {
  width: 100% !important;
  flex-grow: 1 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

& .MuiInputAdornment-root {
  padding: 0 !important;
}

& .MuiInputAdornment-positionEnd {
  display: none !important;
}
```

## Search shows the matches and their parents, expands them, and restores the tree when cleared

Spec 5.1: match the node names on every level, collapsed ones included; show the found items and their parents for context (a matching parent does not bring its non-matching children); clearing the search returns the tree to the state before the search. Spec 5.2: no match is an empty result and never resets the selected item.

```js
const matches = (label, search) => String(label || '').toLowerCase().includes(String(search || '').trim().toLowerCase());

const filterNodes = (nodes, search) =>
  nodes.reduce((result, node) => {
    const children = filterNodes(node.children || [], search);

    if (!matches(node.label, search) && children.length === 0) return result;

    const { children: omitted, ...rest } = node;

    return [...result, children.length > 0 ? { ...rest, children } : rest];
  }, []);

export function treeNodes() {
  const nodes = roots().map((item) => toNode(item));
  const search = InputWorkgroupSearch.value;

  return search && search.trim() ? filterNodes(nodes, search) : nodes;
}

export const searchOpen = state(false);
export const savedExpanded = state(null);

export function isSearching() {
  return Boolean((InputWorkgroupSearch.value || '').trim());
}

export function isSearchEmpty() {
  return isSearching() && treeNodes().length === 0;
}

function restoreExpanded() {
  if (savedExpanded === null) return;

  const before = savedExpanded;

  update(savedExpanded, null);
  TreeWorkgroups.setExpanded([...before]);
}

export function clearSearch() {
  InputWorkgroupSearch.clearValue();
  restoreExpanded();
}

export function toggleSearch() {
  if (searchOpen) {
    InputWorkgroupSearch.clearValue();
    restoreExpanded();
  }

  update(searchOpen, !searchOpen);
}

export async function onSearch() {
  await Promise.resolve();

  if (isSearching()) {
    if (savedExpanded === null) update(savedExpanded, [...(TreeWorkgroups.expandedIds || [])]);

    TreeWorkgroups.expandAll();

    return;
  }

  restoreExpanded();
}
```

Bind the Tree `nodes` to `treeNodes()`. Show a "nothing found" Text (`visible: {{ workgroups.isSearchEmpty() }}`) between the divider and the Tree. The first `onSearch` after the field is cleared by typing restores the tree through `restoreExpanded`; closing with the icon and the X restore it directly, because the cleared value reaches the Input state a moment later.

## Never put the Tree's own arrays into another state slot

The engine refuses to hold one object in two places of state (`role would hold an object already at role — an object sits in one place of state`). `TreeWorkgroups.expandedIds` and `checkedIds` belong to the Tree, so copy them when you save them (`[...(TreeWorkgroups.expandedIds || [])]`) and when you hand them back (`setExpanded([...before])`). The same applies to the arrays a Filter draft reads from its CheckboxGroups: `getDraft()` returns copies (`[...(CheckboxGroupX.values || [])]`), see `blocks/filter.md`.

## Panel expansion floats over the content and does not push it

Spec 6 (design system "Tree collapsed" `4751:29555`, "Tree expanded" `4751:30138`): the expand icon widens the Tree panel from 278px and the panel covers the content on its right. The content keeps its place and width. The selected item, the expanded branches and the search text stay as they are, and a second click returns the panel to 278px.

A flex row cannot do that with `min-width` on the panel: the panel then takes room from the content and pushes it. Take the panel out of the flow instead. Live examples: `mdm/taxonomies/list.json` and `mdm/workgroups/list.json` (blocks `StackTreeSlot`, `Stack5`, `StackTreeBackdrop`).

**1. A slot that keeps the width.** Wrap the panel card in a Stack `StackTreeSlot`: `widthMode: 'fixed'`, `width: '278'`, `heightMode: 'fill'`, `customCss: 'position: relative;'`. The slot is the only thing that takes space in the row, so the content never moves.

**2. The card is absolute inside the slot.** On the card (`Stack5`) set `widthMode: 'hug'`, empty `width`, `minWidth` and `maxWidth` (a leftover `maxWidth: 278` would cap the expanded width) and this `customCss`:

```css
position: absolute;
top: 0;
bottom: 0;
left: 0;
z-index: 5;
overflow: hidden;
width: 278px;
transition: width 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
{{ tree.expand && app.mode !== 'editor' ? 'width: 400px; max-width: calc(100vw - 260px); box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);' : '' }}
```

- The card is positioned in both states, so the width animates (a switch from static to absolute cannot be animated).
- `z-index` stays set in the collapsed state too. If it exists only when expanded, it disappears at the start of the closing animation and the tabs and lists to the right paint over the card while it shrinks.
- The expanded width is 400px on these pages (the design frame draws 600px); `max-width: calc(100vw - 260px)` keeps it inside a narrow window.
- Expansion works in the viewer only. The editor canvas drops `position` from `customCss` (`references/blocks/layout-and-design.md`, "No overlay or chart blocks"), so there the card is an ordinary block: a wider card would overflow its slot, and the in-flow backdrop (below) would push the card down by about 40px (an empty Stack is 40px tall). That is why the width and the shadow are bound with `&& app.mode !== 'editor'` and the backdrop is hidden in the editor: the editor always shows the collapsed 278px card, and the icon only changes. Judge the overlay in the viewer (or `tool.mjs render`, which renders the viewer).

**3. Close it with a click outside.** `onClick` on a parent Stack does not work: a Stack calls `onClick` without the event and does not stop bubbling, so a click inside the tree reaches the parent and the expand icon would open the panel and close it again in the same click. Add a transparent backdrop as the first child of the slot, below the card:

```
StackTreeBackdrop  visible: {{ tree.expand && app.mode !== 'editor' }}
                   onClick: {{ tree.onExpand() }}
                   customCss: position: fixed; inset: 0; z-index: 4; background: transparent;
```

A click on the card goes to the card (`z-index: 5`), a click anywhere else goes to the backdrop and collapses the panel. It does not click through to the element underneath. Modals and drawers render in their own layer above it.

**4. The icon.** Use the custom icons `ExpandTree` (collapsed) and `CollapseTree` (expanded): `icon: {{ tree.expand ? 'CollapseTree' : 'ExpandTree' }}`, `size: 'sm'` (16px, as in the design). Its colour and the colour of the neighbouring header icons: `references/blocks/layout-and-design.md`, "Icon colour".

**5. A long tree scrolls inside the card.** Give the Tree `customCss: 'min-height: 0;\noverflow-y: auto;\nscrollbar-width: thin;'` and keep the space under the last item as `padding: '0 0 16px'` on the card. Padding on the Tree itself has no effect: the scrolling element is inside the block.

Do not use the older `min-width: 400px` binding on a panel in a flex row: it pushes the content and makes the content jump while the panel animates.
