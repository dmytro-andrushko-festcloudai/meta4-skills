# Modal and Drawer

Rules for the two overlay blocks: sizing, scrolling, the close button, footers and opening one from another.

## The `Modal` block draws its own close button, over the top-right corner, and has a fixed width

Do not add a second close `Icon`, and use `widthMode: 'fill'` for the content Stack, not a fixed width wider than the modal. The button covers the last ~32px of the first line, so give the modal title `padding: '0 32px 0 0'` (`formModal` does); without it a long title or a long name inside it runs under the button. `tool.mjs validate` reports a title with less than 32px of right padding. Padding does not help against a long value with no spaces (a role or person name such as `abcdefgh…`): the word cannot wrap and spills past the edge. Put `customCss: 'overflow-wrap: anywhere;'` on every Text in a Modal that shows data (`formModal` does for the title). `tool.mjs validate` reports a bound Text in a Modal without it. A Drawer has the same button, see "Drawer header sits under the close button" below.

## A Modal keeps its header and actions fixed and scrolls only its fields

Set `height: ''` (hug), `maxHeight: '90vh'`, `padding: '24'` and a `width` (`560` forms and info, `448` confirmations, `920` lists); the declaration default `height: '256'` is fixed and overflows. `maxHeight` alone does not scroll and neither does `overflow-y: auto` on the Modal itself (the slot wrapper shrinks to the surface). Build the content as one top column Stack with `customCss: 'max-height: calc(90vh - 48px); overflow: hidden;'` (90vh minus the 24px padding twice) holding three direct children: the title, one inner column Stack with the fields and `customCss: 'flex: 1 1 auto; min-height: 0; overflow-y: auto;'`, and the actions Stack. `formModal({ title, body, footer })` in the builder produces exactly this. `tool.mjs validate` reports a Modal without `height: ''` and `maxHeight`, one with three or more fields and no scrolling inner Stack, one whose top Stack scrolls (the header and the actions would scroll with it) and one with an extra close `Icon`, a title without right padding or a bound Text without `overflow-wrap` (see the close-button rule above).

**Footer buttons need `widthMode: 'hug'`.** `formModal` right-aligns the footer Stack (`horizontalAlign: 'end'`), but a `Button` defaults to `fill`, so each button takes an equal share of the row and the pair ends up spread from the left edge to the middle instead of at the right. Set `widthMode: 'hug'` on every footer button (Cancel, Save, Delete), as `ButtonItemCancel` and `ButtonItemSubmit` do in `examples/dictionary-items`. The same default applies to any `Text` or `Image` you want centred or right-aligned: hug it first.

## Drawer header sits under the close button

The Drawer draws its own close button in the top corner, so a title placed first overlaps it or sits too close to the content. Make the first child a full-width `Divider` (`orientation: 'horizontal'`, `borderWidth: '1px'`, `padding: '38px 0 24px'`, `margin: '0 -24px 0'`); the negative margin runs the line past the drawer's 24px padding. Put no top margin on the header after it. Same as `DrawerDetails` in taxonomies.

## Drawer with action buttons pinned to the bottom, a divider above them, and scrolling content

`margin: 'auto 0 0'` on the footer does not push it down, and negative side margins on it were not applied either, so do not build it that way. What works (`DrawerRole` and `DrawerAccess` in `security-service/schemas/security-roles.json`):
- Drawer: `padding: '68px 24px 24px'` and `customCss: 'overflow: hidden'`. The 68px top keeps the scroll area below the close arrow, so rows never scroll under it; this replaces the divider trick of "Drawer header sits under the close button" in a scrolling drawer. With the Drawer's default scroll the footer scrolls away with the content.
- Content Stack (the Drawer's only child): `heightMode: 'fill'`, no padding, and `customCss: 'overflow-y: auto;\n\n& > div {\n  align-self: flex-start;\n  padding-bottom: 72px;\n}'`. The Stack's inner slot is stretched to the visible height, so padding on the Stack ends up behind the footer and hides the last rows; `align-self: flex-start` lets the slot take its content height and the padding goes after the last row. The footer is about 73px tall and the Drawer already has 24px of bottom padding, so 72px leaves a gap above the divider.
- Footer Stack (last child of the content Stack): `padding: '16px 24px'`, `horizontalAlign: 'end'`, `customCss: 'position: absolute;\nleft: 0;\nright: 0;\nbottom: 0;\nbackground-color: #fff;\nborder-top: 1px solid rgba(0, 0, 0, 0.08)'`. The Drawer paper is the positioned ancestor, so the footer and its divider run edge to edge. The editor ignores `position` (`references/blocks/layout-and-design.md`), so judge it in the viewer.

## One drawer opens another: close the first, then open the second

Two open drawers stack their backdrops. Keep what the second one needs before closing: `const role = this.role; DrawerRole.setOpen(false); access.open(role);`.

## A drawer footer always has at least one button

When permissions or status hide every action, show `Закрити` (outlined, `lg`, `onClick: DrawerX.setOpen(false)`), visible on the negation of every other button's condition, and update that condition whenever a footer button is added.

## Status info message (e.g. "Роль у статусі “Чернетка”")

a row Stack under the drawer header, `bgColor: '#F5FAFF'`, `borderColor: '#88C3FF'`, `borderRadius: '8px'`, `padding: '12px 48px 12px 16px'`, `gap: '12px'`; an `Icon` `Info` with `color: 'primary'` and `margin: '2px 0 0'`; a text Stack (`gap: '2px'`) with title `body3-m` `#1570EF` and text `body4-r` `#555D6D`. Visible only in that status. An action that changes the status from a drawer reuses the list's confirm flow (`table.askActivate(drawer.role)`) and closes the drawer on success when it shows that record.
