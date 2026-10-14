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
Do not use the older `position: absolute` overlay (`& > div { position: absolute; right: 0; ... }`): the open box covers the end of the tab underline. Reference: `InputAccessSearch` and `InputDrawerSearch` in `security-service/schemas/access.json`. Scripts keep working: SearchInput has `.value`, `setValue()`, `clearValue()`.

## Tabs in a white panel

give the panel `borderRadius: '8px'` and `padding: '19px'` (20px minus the 1px border). Header cards above the tabs keep `12px`. The space under the strip comes from the tab content Stack, see the first rule above.
