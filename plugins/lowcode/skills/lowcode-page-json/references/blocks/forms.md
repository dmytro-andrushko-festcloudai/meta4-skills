# Forms and inputs

Rules for inputs, and for blocks that depend on each other.

## Two blocks must not bind to each other's values

A binding that reads `Other.value` subscribes to Other's whole merged state, including Other's own bound props. So `DatePickerStart.maxDate = {{ DatePickerEnd.value }}` together with `DatePickerEnd.minDate = {{ DatePickerStart.value }}` throws `Cycle detected` and the prop resolves empty. Keep the shared values on a script instead: each block's `onChange` writes them (`modal.onStartChange(value);` sets `this.startDate`), and the props read the script (`{{ modal.endDate }}`). Reset those script fields wherever the form resets.

## Multi-line text

`Input` with `type: 'textarea'` (placeholder, label and `setValue` work as for a text input). There is no separate Textarea block.
