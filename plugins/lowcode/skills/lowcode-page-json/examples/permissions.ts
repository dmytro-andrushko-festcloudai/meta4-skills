import { button, graphqlQuery, page, script, stack, text } from '../scripts/builder';
import permissionsScript from './permissions.script.txt';

const constantsScript = `return {
  GRAPHQL_URL: 'https://hasura-qa.srv.festcloud.ai/v1/graphql',
};`;

const getPermissions = graphqlQuery(
  'getPermissions',
  `query GetPermissions {
  permissions: securityservice_person_effective_permissions_v_v1 {
    action
    data_component
    name
  }
}`
);

export default page({
  content: [
    stack({ direction: 'row', gap: '12px', verticalAlign: 'center' }, [
      text('Example', 'heading2-m', 'text-title'),
      button('Create', { variant: 'contained', widthMode: 'hug', visible: "{{ permissionsJs.can('create') }}" }),
      button('Delete', {
        color: 'error',
        variant: 'outlined',
        widthMode: 'hug',
        visible: "{{ permissionsJs.can('remove') }}",
      }),
    ]),
  ],
  queries: [getPermissions],
  scripts: [script('constantsJs', constantsScript), script('permissionsJs', permissionsScript)],
});
