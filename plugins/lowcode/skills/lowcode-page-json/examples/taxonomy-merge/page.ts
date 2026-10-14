import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsCode from './scripts/constants.txt';
import initCode from './scripts/init.txt';
import breadcrumbsCode from './scripts/breadcrumbs.txt';
import treeCode from './scripts/tree.txt';
import mergeCode from './scripts/merge.txt';
import previewCode from './scripts/preview.txt';

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
  breadcrumbs.getBreadcrumbs()
}}`,
                  onBack: `{{
  breadcrumbs.onBack()
}}`,
                  onNavigate: `{{
  breadcrumbs.onNavigate(id)
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
  !merge.canMerge()
}}`,
              onClick: `{{
  merge.onMerge()
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
  merge.getDuplicatesTitle()
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
  merge.getDuplicatesList()
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
  merge.getDuplicates().length > 0
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
  merge.loading
}}`,
                  label: 'Джерельна таксономія',
                  onChange: `{{
  merge.onSourceTaxonomyChange(value)
}}`,
                  options: `{{
  tree.getRootOptions(merge.targetId)
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
  tree.getNodes(merge.sourceId)
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
  merge.loading
}}`,
                  label: 'Цільова таксономія',
                  onChange: `{{
  merge.onTargetTaxonomyChange(value)
}}`,
                  options: `{{
  tree.getRootOptions(merge.sourceId)
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
  tree.getNodes(merge.targetId)
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
  preview.getLines()
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
  merge.canPreview()
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
  scripts: [script('constants', constantsCode), script('init', initCode), script('breadcrumbs', breadcrumbsCode), script('tree', treeCode), script('merge', mergeCode), script('preview', previewCode)],
});
