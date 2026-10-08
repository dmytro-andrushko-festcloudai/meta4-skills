# Permissions in a lowcode page

Two separate layers exist. Only the second is in the page JSON.

1. **Which pages a user sees in the workspace menu.** The shell filters pages by the permissions attached to each page/widget row in Hasura. That is data, managed in Hasura, not in the page JSON. The workspace query drafted on the `feat/fed-3915-remove-static-content` branch selected `widgetpermission_widget_fcp_id_array { dc_action dc_name }` on widgets, but that relation was never verified against the live schema.
2. **What a user can do inside a page** (show the Create button, hide Delete, hide the button that opens a create or edit page). This is what a page author adds, and it is client-side UX only: Hasura row-level permissions remain the real enforcement.

## Model

A permission is a data component plus a level: `{ data_component, action }` with `action` one of `view` < `edit` < `admin`. A higher level satisfies a lower requirement (admin satisfies edit and view), exactly as the shell's `hasRequiredPermissions` does. A requirement is written as one string, `<data_component>_<action>` (`legal_entity_edit`); the action is whatever follows the last underscore, which is how the shell's `parsePermissionRequirements` splits it.

A list of requirements means **every** one must hold (`app.hasPermission(['role_edit', 'permission_edit'])`), and an empty list is true.

## Getting the real requirements from Hasura

Do not guess component names (they are not table names: `unit_of_measure` is `uom`, a role assignment is `role`, a workgroup condition value is `permission`). **Propose to the user to share the Hasura URL and an admin secret for the dev environment before you write any `REQUIREMENTS`**, and say exactly what you will read and why (see "Reading live Hasura" in `data-and-queries.md`). With that access the answer is in two read-only requests; no mutation is involved:

1. **The data components that exist.** One query:

   ```graphql
   query { permissions: securityservice_permissions_v1(distinct_on: [data_component], limit: 500) { data_component } }
   ```

   For the full picture of a component, select `data_component entity_name action name` filtered by `data_component: { _in: [...] }`.

2. **What Hasura itself requires for each write.** Export the metadata (`POST /v1/metadata` with `{"type":"export_metadata","version":2,"args":{}}`, which only reads) and, for each table the page mutates, read its insert, update and delete permission `check` for the `user` role. Every table in the security service checks `person_effective_permissions_v` for a `data_component`, an `entity_name` and an `action` list. That gives the exact requirement per mutation instead of a guess. In the security service the rule is uniform:

   | Write | Needs |
   |---|---|
   | insert, update | `edit` or `admin` of the table's component |
   | delete | `admin` of the table's component |

   Tables to component (security service): `roles`, `person_roles` -> `role`; `role_permissions`, `person_condition_values` -> `permission`; `principals` -> `principal`; `service_users` -> `service_user`; `refresh_tokens` -> `token`; `persons` -> `person`. Other services have their own names, so read them.

   The metadata export is large and holds the schema of every source. Write it to a scratch file, extract only what you need, then delete the file. Never put the admin secret in a page, a script, a skill, memory or a commit.

Hasura actions and REST endpoints (`securityservice_deleteRole`, activating a role, issuing a token) are not covered by table rules. Ask what they require, assume the nearest equivalent and say so in the report.

## Map every action to a requirement

For each user action decide which kind it is, because the gate goes on the control that **starts** the flow, not on the final confirm:

- **Direct mutation** (a delete icon, a deactivate toggle): gate the icon.
- **Navigation to a form** (a "Create" or "Edit" button that only does `app.navigate(...)` to a page where the mutation happens): this is not a mutation on the spot, but it must be hidden too, with the requirement of the mutation the target page performs. The target page's own save buttons get the same gate, so a user who types the URL still cannot save.
- **Opens a modal or drawer that mutates** (grant access, manage roles): gate the opener with the requirement of what the modal writes.
- **Menu items** (a row actions menu): filter the items in the script that builds them, and hide the menu itself when no item is left.
- **Delete is `admin`; create and edit are `edit`.** An action that does several writes needs all their requirements. When one write only happens sometimes (removing a role also deletes workgroup condition values only if the role has a workgroup), put that in a script function (`canRemoveRole(role)`) instead of requiring the stricter permission everywhere.
- View-only things (an info drawer, a read-only table) are not gated by this.

## Pattern

The current user's grants are already in `app.user.permissions`, and `app.hasPermission(requirements)` checks them. Prefer it over fetching `securityservice_person_effective_permissions_v_v1` again: it needs no query, no loading state and works in bindings.

The agreed shape of `permissionsJs` is **one requirement array per capability and one method per capability, and nothing else**: no dispatcher taking an action name, no `ENTITY` constant, no per-entity accessor. Only define a capability the page actually gates on.

```js
const EDIT_ROLE_REQUIREMENTS = ['role_edit', 'permission_edit'];
const DELETE_ROLE_REQUIREMENTS = ['role_admin', 'permission_admin'];
const REMOVE_CONDITIONS_REQUIREMENTS = ['permission_admin'];

return {
  canEditRole() {
    return app.hasPermission(EDIT_ROLE_REQUIREMENTS);
  },

  canDeleteRole() {
    return app.hasPermission(DELETE_ROLE_REQUIREMENTS);
  },

  canRemoveRole(role) {
    return this.canDeleteRole() && (!role?.field || app.hasPermission(REMOVE_CONDITIONS_REQUIREMENTS));
  },
};
```

- A capability whose requirement depends on the row (`canRemoveRole(role)`: a role with a workgroup condition also needs `permission_admin`) takes the row as an argument; keep it a method of the same script.
- Gate by binding. `visible: "{{ permissionsJs.canEditRole() }}"` for things that should not appear; combine with an existing condition as `{{ <existing> && permissionsJs.canEditRole() }}`. Use `disabled: "{{ !permissionsJs.canEditRole() }}"` only for things that should show but not act.
- A row menu: `getRowActions(role)` returns the items filtered with `permissionsJs.canX()`, and the menu block's `visible` is `{{ tableJs.getRowActions(currentItem).length > 0 }}`.
- Give the script no comments. State the source of each requirement in the report.

`examples/permissions.ts` shows an older variant that fetches `getPermissions` and denies until it returns, with a `can(action)` dispatcher. Use it only when `app.hasPermission` is not available, and prefer the shape above.

## Verify

1. `tool.mjs validate` compiles the script and every binding.
2. Test the script by evaluating it with a stubbed `app.hasPermission` that implements the waterfall (`view` < `edit` < `admin`, every requirement must hold) for: no grants, view only, edit of one component only, edit of all required components, and admin. Check that a delete needs `admin`, not `edit`, and that a row-dependent capability behaves for both kinds of row.
3. With a real token, open the page in the shell as users with different levels; the render harness has no user permissions and shows gated blocks hidden.
4. In the report list every requirement string and where it came from: a Hasura table rule, or an assumption for an action or REST endpoint.
