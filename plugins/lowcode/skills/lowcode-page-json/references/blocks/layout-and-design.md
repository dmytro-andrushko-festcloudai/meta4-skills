# Layout and design translation

Turning a Figma frame into blocks: spacing, sizes, avatars, icons, and what to do about long values.

## Figma measures padding from the outer edge, CSS adds the border on top

A card with 20px padding and a 1px border is 84px tall in Figma but 86px in the browser. Use `padding = design padding - 1px` on any Stack that has a `borderColor`.

## An empty Stack is 40px tall

(editor drop-target height). For dots, dividers and spacers add `customCss: 'min-height: 0;'`.

## Bordered icon button

an `Icon` with `borderColor`, `borderRadius`, `bgColor` and `padding: '7px'` gives the 36px square (20px icon + 14px padding + 2px border).

## No overlay or chart blocks

Overlay text on a shape with a parent `customCss: 'position: relative;'` and a child `customCss: 'position: absolute; top: 0; left: 0;'`. The editor canvas ignores `position`, `display` and `transform` from `customCss`, so it looks wrong in the editor and right in the viewer; judge by `render`. A progress ring or sparkline is an `Image` whose `src` is a data-URI SVG built in a script from the data. Use hex colours in that SVG: CSS variables do not resolve inside an `<img>`.

## Avatars

Leave `src` empty and set `fallback` to `man`, `woman` or `no_photo` (files under `assets/images/image/`). Do not copy Figma avatar art into the repo.

### Person and employee avatar

Every place that shows a person (employee rows, managers, responsible people, contact cards) uses the same rule: the photo from the database first, otherwise the coloured avatar for the person's gender (woman pink, man purple), otherwise the neutral `no_photo`. Bind `src` to the photo and `fallback` to the gender avatar; the Image block shows `fallback` only when `src` is empty.

- **Get the gender with the person.** Select `gender` next to `first_name` and `second_name` on the person (`employees_fcp_id_persons { first_name second_name gender }`) and the photo from the principal contacts (`contact_principal_fcp_id_array(where: { contact_source: { _in: ["phone", "email", "photo"] } })`, `contact_source` `photo`). Never hardcode the avatar.
- **Map the value in a script, not in the binding.** `gender` is free text, so lower-case and trim it, then match lists: male `m, male, man, ч, чоловік, чоловіча` gives `man`; female `f, female, woman, ж, жінка, жіноча` gives `woman`; anything else, including empty, gives `no_photo`. Expose the result as `avatar` (or `gender`) on the row and bind `fallback` to it. Reference: `employees.getAvatar` and `workgroups.avatarOf` in `mdm-workgroups/schemas/workgroups.json`.
- **A name or photo can live in a different schema than the relation.** A `mdm_principal_relationship` target principal often has no `name`, `photo` or contacts in the `mdm_*` tables, and `mdm_principal_v1_principals` has no `persons` relation. Read the person from the people schema (`fest_people_employee_v1_employees(where: { fcp_id: { _in: $ids } })`, the employee id equals the principal id), run that second query with the ids from the first one, and fall back to the principal data when the person has no employee record.
- **Size and radius follow the design** (`size: '20'`, `radius: '2'` in a management row, the table avatar size in a list row). Keep a person row hidden when there is no person, instead of rendering a placeholder with `-`.

## Conditional rows

`visible: "{{ !!currentItem.subtype }}"` hides a row per item.

## Plurals and formatting

that the design shows ("1 день", "4 дні", "20 днів") belong in the data script, not in the block.

## Design mock data is not data

The same name repeated on every row is a placeholder; still use it as the mock, but say it is mock.

## Clickable card

put the action on the card Stack's `onClick` (`details.open(currentItem);`) and add `customCss: 'cursor: pointer;'`; `currentItem` is in scope there.

## Responsive widths

the design's fixed columns (for example 304px, 240px, 300px) are `widthMode: 'fixed'` Stacks. Check the render at the design's content width, not the frame width: the frame includes the 200px sidebar and page margins.

## Disable the breadcrumbs forward arrow

(`forwardDisabled: true`) and bind `onBack` to the same navigation as the parent crumb; an empty `onBack` leaves a dead arrow.

## Custom icons

that are not Phosphor names live in `shared/ui-v2/src/lib/icon/custom-icons.ts`: `Duplicate` (the "duplicate/copy row" icon in the designs), `Copy`, `FCFunnelActive`, `FCSortAscendingActive`, `Diia`. Use `Duplicate` for a duplicate action, not Phosphor `Copy`.

## Rendering a route with an id

`tool.mjs render /people/profile/employee-5 shot.png` renders the registered route with that param, so detail pages can be checked per record. Modals and drawers are closed in a render, so check them by reading the JSON (size, `height`, `maxHeight`) or in the running app.

## Long values without spaces break the layout wherever data is shown

A role, person or file name such as `xcxsaxasxasxffffff…` is one word: padding does not help and it spills out of its box, under a close button, or widens a table column. Decide per place and set it on the Text (or the cell's Text):
- **Wrap** where the full value matters (titles, descriptions, confirmation texts, card rows): `customCss: 'overflow-wrap: anywhere;'`. In a Modal this is required (`references/blocks/overlays.md`).
- **Truncate** where one line is the design (table cells, list rows, breadcrumbs): `customCss: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'` and give the container `min-width: 0` (a flex child does not shrink below its content otherwise). Put the full value in a tooltip when it matters.
- **Reserve room next to fixed controls** (a Modal or Drawer close button, a row action): right padding of at least 32px on the title next to the button.
Check every Text that binds user data by rendering it once with a 40-character value without spaces.
