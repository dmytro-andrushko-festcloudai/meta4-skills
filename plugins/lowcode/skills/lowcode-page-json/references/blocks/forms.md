# Forms and inputs

Rules for inputs, and for blocks that depend on each other.

## Two blocks must not bind to each other's values

A binding that reads `Other.value` subscribes to Other's whole merged state, including Other's own bound props. So `DatePickerStart.maxDate = {{ DatePickerEnd.value }}` together with `DatePickerEnd.minDate = {{ DatePickerStart.value }}` throws `Cycle detected` and the prop resolves empty. Keep the shared values in a state of a js file instead: each block's `onChange` writes them (`modal.onStartChange(value);` runs `update(startDate, value)`), and the props read the state (`{{ modal.endDate }}`). Reset those states wherever the form resets.

This applies to `required`, `defaultValid` and `disabled` as well, and also to passing a sibling block object into a script from a binding (`contacts.needsEmail(PhoneInputContact, InputContactEmail)`): it reads the whole sibling state. The page then fails with "CYCLING DETECTED" only once a field is edited, so neither `validate` nor a plain `render` catches it; type into the fields to check. A field may read its own `value` and `touched` (`form.notBlank(Input)`).

Put that store in its own js file, not in the one whose function feeds the `Repeater`'s `data` (`contacts.getData()`): writing the store state makes every binding that reads the file re-run, `getData()` returns a new array, the rows remount and an input loses focus after each keystroke ("only one letter can be typed").

For a `Repeater` row, key the store by `currentIndex`: `setField(index, field, value)` from each field's `onChange`, `read(index, field, item)` falling back to `currentItem`, and a `removeRow(index)` in the same js file that shifts the entries above the removed index before calling `Repeater.removeRow(index)`. The phone block's `onChange` payload carries `nationalNumber`; its `value` is `'+380'` even when empty.

Either-or rule (a contact needs a phone or an email): `phone.required = active && !read('email')` and `email.required = active && !read('phone')`, where a row is `active` once it has a saved id or any field is filled, so a fully empty new row is ignored.

## Multi-line text

`Input` with `type: 'textarea'` (placeholder, label and `setValue` work as for a text input). There is no separate Textarea block.
