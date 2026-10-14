# Filter

Rules for the `Filter` block and the data behind its categories.

## Wrap each `Filter` category panel in one column Stack

(`direction: 'column'`, `gap: '12px'`, `heightMode: 'hug'`, `verticalAlign: 'start'`) holding the search `Input` and the `CheckboxGroup`. Two loose siblings in a `panel` are spread apart and the checkboxes float away from the search. Give every category its own search `Input` when the design shows one.

## A filter option list that would need its own query can be static

The roles Author filter is the letters A-Z and А-Я; on Apply a script resolves the ticked letters to ids (principals whose second name starts with one of them) and the list query filters `audit_updated_by _in ids`. An empty match must filter to nothing, not be treated as "no filter".

## A `Filter` category's search `Input` only narrows its option list; never put its text in the filter's draft state

If `isSame()`/`isChanged()` reads the search text, the first letter typed flips `disableApply`/`disableClear`. The Filter re-renders, the category panel is rebuilt, and the input loses focus after one character. Keep draft, `EMPTY`, `isSame()`, `selectedQty()` and `restore()` to the ticked values (`CheckboxGroupX.values`, `RadioGroupX.value`, dates). Apply filters by those values only, not by the typed text. Clear a search box only in `onClearCategory`/`resetSearch`. Same as `filter` in `security-service/schemas/access.json` and `security-roles.json`.

## Reset the search boxes when the user switches category

Bind the Filter's `onCategoryChange` to `{{ filter.resetSearch() }}`, which sets every category's search `Input` to `''`. Leave the ticked values alone, so switching tabs does not drop a selection.
