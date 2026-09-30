# Permissions in a lowcode page

Two separate layers exist. Only the second is in the page JSON.

1. **Which pages a user sees in the workspace menu.** The shell filters pages by the permissions attached to each page/widget row in Hasura. That is data, managed in Hasura, not in the page JSON. The workspace query drafted on the `feat/fed-3915-remove-static-content` branch selected `widgetpermission_widget_fcp_id_array { dc_action dc_name }` on widgets, but that relation was never verified against the live schema.
2. **What a user can do inside a page** (show the Create button, enable Delete, hide a tab). This is what a page author adds, and it is client-side UX only: Hasura row-level permissions remain the real enforcement.

## Model

A permission is a data component plus a level: `{ data_component, action }` with `action` one of `view` < `edit` < `admin`. A higher level satisfies a lower requirement (admin satisfies edit and view), exactly as the shell's `hasRequiredPermissions` does. A requirement is written as one string, `<data_component>_<action>` (`legal_entity_edit`); the action is whatever follows the last underscore, which is how the shell's `parsePermissionRequirements` splits it.

The user's effective permissions come from this query, using the same token the page already sends:

```graphql
query GetPermissions {
  permissions: securityservice_person_effective_permissions_v_v1 {
    action
    data_component
    name
  }
}
```

## Pattern

`examples/permissions.ts` and `examples/permissions.script.txt` are a working, tested version. In short:

- a `getPermissions` query with `runOnPageLoad: true`;
- a `permissionsJs` script holding a `REQUIREMENTS` map from page action (`create`, `edit`, `remove`) to requirement strings, and a `can(action)` that is **false until the query has returned** and then checks the waterfall;
- blocks gated by binding: `visible: "{{ permissionsJs.can('create') }}"` for things that should not appear, `disabled: "{{ !permissionsJs.can('edit') }}"` for things that should show but not act.

Deny by default while loading. Otherwise a gated button flashes for users who should never see it.

`permissionsJs` takes **no comments**. State the source of each requirement in the report, not in the script.

## Ask, do not guess

The data-component names come from the security service, not from table names, and there is no in-repo list. Before writing `REQUIREMENTS`, get from the user, for each action on the page, the component name and the level. If they are not known yet, write the page with placeholder requirement strings and report exactly which ones need real values.

Check first for a live example: `grep -rl permissionsJs apps/lowcode/src/pages`. When this skill was written no page in this branch used the pattern, so its shape follows the project's earlier `permissionsJs` + `*_REQUIREMENTS` convention and the shell's permission functions, verified by unit-testing the waterfall (not-loaded and other-component grants deny; `view` does not satisfy `edit`; `admin` satisfies `edit`). If a live page exists, match it instead.

## Verify

1. `tool.mjs validate` compiles the script and every binding.
2. Test each level: not loaded, no grants, another component's grant, view, edit, admin. Evaluate the script with a stubbed `getPermissions.data` for each case.
3. With a real token, run the page in the shell as users with different levels; the render harness has no permission data and shows gated blocks hidden.
