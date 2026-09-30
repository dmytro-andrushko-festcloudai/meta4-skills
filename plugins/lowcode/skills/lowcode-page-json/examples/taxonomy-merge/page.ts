import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsJsCode from './scripts/constantsJs.txt';
import initJsCode from './scripts/initJs.txt';
import breadcrumbsJsCode from './scripts/breadcrumbsJs.txt';
import treeJsCode from './scripts/treeJs.txt';
import mergeJsCode from './scripts/mergeJs.txt';
import previewJsCode from './scripts/previewJs.txt';

export default page({
  content: [
    node('Stack', {
      name: 'StackPage',
      children: [
        node('Stack', {
          name: 'StackHeader',
          children: [
            node('Stack', {
              name: 'StackHeaderInfo',
              children: [
                node('Breadcrumbs', {
                  name: 'BreadcrumbsMerge',
                  margin: '0 0 8px',
                  forwardDisabled: true,
                  items: `{{
  breadcrumbsJs.getBreadcrumbs()
}}`,
                  onBack: `{{
  breadcrumbsJs.onBack()
}}`,
                  onNavigate: `{{
  breadcrumbsJs.onNavigate(id)
}}`,
                }),
                node('Text', {
                  name: 'TextTitle',
                  color: '#161A22',
                  text: 'Об’єднати таксономії',
                  variant: 'heading2-m',
                }),
                node('Text', {
                  name: 'TextSubtitle',
                  color: '#858C99',
                  text: 'Скласти кілька таксономій в одне ієрархічне дерево',
                }),
              ],
              gap: '4px',
            }),
            node('Button', {
              name: 'ButtonMerge',
              widthMode: 'hug',
              disabled: `{{
  !mergeJs.canMerge()
}}`,
              onClick: `{{
  mergeJs.onMerge()
}}`,
              size: 'lg',
              text: 'Об’єднати',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '16px',
        }),
        node('Stack', {
          name: 'StackDuplicates',
          children: [
            node('Icon', {
              name: 'IconDuplicates',
              widthMode: 'hug',
              color: 'warning',
              icon: 'Warning',
            }),
            node('Stack', {
              name: 'StackDuplicatesInfo',
              children: [
                node('Text', {
                  name: 'TextDuplicatesTitle',
                  color: '#DD9126',
                  text: `{{
  mergeJs.getDuplicatesTitle()
}}`,
                  variant: 'body3-m',
                }),
                node('Text', {
                  name: 'TextDuplicatesDescription',
                  color: '#555D6D',
                  text: 'Наступні вузли існують в обох таксономіях з однаковою назвою/типом:',
                  variant: 'body4-r',
                }),
                node('Text', {
                  name: 'TextDuplicatesList',
                  customCss: 'white-space: pre-line;',
                  color: '#555D6D',
                  text: `{{
  mergeJs.getDuplicatesList()
}}`,
                  variant: 'body4-r',
                }),
              ],
              gap: '4px',
            }),
          ],
          padding: '16px',
          bgColor: '#FFFCF5',
          borderColor: '#FEC84B',
          borderRadius: '8px',
          direction: 'row',
          gap: '12px',
          visible: `{{
  mergeJs.getDuplicates().length > 0
}}`,
        }),
        node('Stack', {
          name: 'StackTaxonomies',
          children: [
            node('Stack', {
              name: 'StackColumnSource',
              children: [
                node('Select', {
                  name: 'SelectSource',
                  required: true,
                  marker: true,
                  disabled: `{{
  mergeJs.loading
}}`,
                  label: 'Джерельна таксономія',
                  onChange: `{{
  mergeJs.onSourceTaxonomyChange(value)
}}`,
                  options: `{{
  treeJs.getRootOptions(mergeJs.targetId)
}}`,
                  placeholder: 'Оберіть таксономію',
                }),
                node('Tree', {
                  name: 'TreeSource',
                  customCss: `margin: 0 -16px;
width: calc(100% + 32px);
max-height: 560px;
overflow: auto;`,
                  heightMode: 'fill',
                  nodes: `{{
  treeJs.getNodes(mergeJs.sourceId)
}}`,
                }),
              ],
              customCss: 'border-right: 1px solid #E3E5E8;',
              heightMode: 'fill',
              padding: '16px',
              gap: '12px',
            }),
            node('Stack', {
              name: 'StackColumnTarget',
              children: [
                node('Select', {
                  name: 'SelectTarget',
                  required: true,
                  marker: true,
                  disabled: `{{
  mergeJs.loading
}}`,
                  label: 'Цільова таксономія',
                  onChange: `{{
  mergeJs.onTargetTaxonomyChange(value)
}}`,
                  options: `{{
  treeJs.getRootOptions(mergeJs.sourceId)
}}`,
                  placeholder: 'Оберіть таксономію',
                }),
                node('Tree', {
                  name: 'TreeTarget',
                  customCss: `margin: 0 -16px;
width: calc(100% + 32px);
max-height: 560px;
overflow: auto;`,
                  heightMode: 'fill',
                  nodes: `{{
  treeJs.getNodes(mergeJs.targetId)
}}`,
                }),
              ],
              heightMode: 'fill',
              padding: '16px',
              gap: '12px',
            }),
          ],
          customCss: `& > * {
  flex: 1 1 0;
  min-width: 0;
}`,
          minHeight: '480',
          bgColor: '#ffffff',
          borderColor: '#E3E5E8',
          borderRadius: '8px',
          direction: 'row',
          gap: '0px',
        }),
        node('Stack', {
          name: 'StackPreview',
          children: [
            node('Text', {
              name: 'TextPreviewTitle',
              text: 'Об’єднана структура дерева',
              variant: 'heading4-sb',
            }),
            node('Stack', {
              name: 'StackPreviewCode',
              children: [
                node('Repeater', {
                  name: 'RepeaterPreview',
                  children: [
                    node('Stack', {
                      name: 'StackPreviewLine',
                      children: [
                        node('Text', {
                          name: 'TextPreviewNumber',
                          customCss: 'text-align: right;',
                          minWidth: '24',
                          widthMode: 'hug',
                          color: '#A3A8B2',
                          text: '{{ currentItem.id }}',
                          variant: 'body4-r',
                        }),
                        node('Text', {
                          name: 'TextPreviewLine',
                          customCss: 'white-space: pre;',
                          color: `{{
  currentItem.highlighted ? '#1570EF' : '#3F4653'
}}`,
                          text: '{{ currentItem.text }}',
                          variant: 'body4-r',
                        }),
                      ],
                      verticalAlign: 'center',
                      direction: 'row',
                      gap: '16px',
                    }),
                  ],
                  data: `{{
  previewJs.getLines()
}}`,
                  gap: '2px',
                  showAddButton: false,
                }),
              ],
              customCss: `max-height: 400px;
overflow: auto;`,
              padding: '16px',
              bgColor: '#F7F8F8',
              borderRadius: '8px',
            }),
          ],
          padding: '24px',
          bgColor: '#ffffff',
          borderColor: '#E3E5E8',
          borderRadius: '8px',
          gap: '16px',
          visible: `{{
  mergeJs.canPreview()
}}`,
        }),
      ],
      gap: '16px',
    }),
  ],
  queries: [
    graphqlQuery(
  'getTaxonomies',
  `query GetTaxonomies {
  taxonomies: businessmngt_taxonomies_v1 {
    name
    external_id_cbd_code
    parent_fcp_id
    type
    fcp_id
  }
}`,
  { runOnPageLoad: false }
),
    graphqlQuery(
  'mergeTaxonomy',
  `mutation MergeTaxonomy(
  $id: String!
  $object: businessmngt_taxonomies_v1_set_input!
) {
  taxonomy: update_businessmngt_taxonomies_v1_by_pk(
    pk_columns: { fcp_id: $id }
    _set: $object
  ) {
    fcp_id
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
  ],
  scripts: [script('constantsJs', constantsJsCode), script('initJs', initJsCode), script('breadcrumbsJs', breadcrumbsJsCode), script('treeJs', treeJsCode), script('mergeJs', mergeJsCode), script('previewJs', previewJsCode)],
});
