# Tabs

Rules for the `Tabs` block, a tab strip used alone, and search next to tabs.

## Every tab's content is one Stack with padding

The Tabs block puts the content flush under the tab strip, so wrap the content of every tab in a single Stack with `padding: '8px 0 0'` (`tabContent(children)` in the builder). Do not put the space as a margin on the first block of each tab. `tool.mjs validate` reports a tab whose content is not one padded Stack. A tab strip with no panel content is exempt, see "`Tabs` used as a tab strip only" below.

## `Tabs` used as a tab strip only (no panel content) needs `heightMode: 'fixed'` and `height: '33'`

Left on `hug` it reserves a tall empty panel and pushes everything in the same row apart. Drive the table from `onChange` and `TabsScope.value`.

## Search next to tabs is a `SearchInput`, not an `Input`, and it must push the tabs aside, not overlay them

Put it in the same row Stack as the `Tabs` (`widthMode: 'fill'`), with `width: '32px'`, `widthMode: 'fixed'`, `height: '32px'`, `heightMode: 'fixed'` and this `customCss`, so the wrapper itself grows from 32px to 200px and the tab strip shrinks:
```css
flex-shrink: 0;
transition: width 300ms ease;

& > div {
  width: 100%;
}

&:focus-within,
&:has(input:not(:placeholder-shown)) {
  width: 200px;
}
```
Do not use the older `position: absolute` overlay (`& > div { position: absolute; right: 0; ... }`): the open box covers the end of the tab underline. Reference: `InputAccessSearch` and `InputDrawerSearch` in `security-service/schemas/access.json`. Scripts keep working: SearchInput has `.value`, `setValue()`, `clearValue()`. In a Drawer set `size: 'sm'` on the `SearchInput` (the page-level toolbar keeps the default `md`).

This applies to a search in the same row as a `Tabs`: beside it in a row Stack (the drawer's "Всі працівники / Обрані" row) or inside its `toolbar` slot (`showToolbar`, the drawer's "Права / Працівники" row with search, sort and filter), where the toolbar Stack hugs and the tab strip gives up the space. A search inside a right-aligned cluster of buttons and menus (toolbar controls with no tabs) must not grow in place: it would push the buttons past the container edge. Keep the overlay there, anchored to the right edge: `position: relative;` on the wrapper, and `& > div { position: absolute; top: 0; right: 0; z-index: 1; background: #fff; }` with the `:focus-within` / `:has(input:not(:placeholder-shown))` rule setting `width: 200px` on the inner `div`.

## A search shared by several tabs must work on every tab

If one `SearchInput` sits above tabs that show different data (a server-loaded "all" tab and a client-side "selected" tab), each tab's rows must honour it, or the input must be hidden on the tab where it does nothing (`visible: "{{ !drawer.isRights() }}"`). A server query is re-run only for the tab it feeds (`if (this.tab === 'all') await this.load()`), while the other tab filters its rows in the script by the same terms. The empty state, the pagination condition and the empty hint then use the filtered rows, not the raw count.

## Tabs in a white panel

give the panel `borderRadius: '8px'` and `padding: '19px'` (20px minus the 1px border). Header cards above the tabs keep `12px`. The space under the strip comes from the tab content Stack, see the first rule above.
