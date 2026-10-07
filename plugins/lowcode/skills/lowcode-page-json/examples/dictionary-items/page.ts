import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsJsCode from './scripts/constantsJs.txt';
import initJsCode from './scripts/initJs.txt';
import dictionaryJsCode from './scripts/dictionaryJs.txt';
import breadcrumbsJsCode from './scripts/breadcrumbsJs.txt';
import itemsJsCode from './scripts/itemsJs.txt';
import sortingJsCode from './scripts/sortingJs.txt';
import itemModalJsCode from './scripts/itemModalJs.txt';
import deleteItemJsCode from './scripts/deleteItemJs.txt';
import dictEditJsCode from './scripts/dictEditJs.txt';
import dictDeleteJsCode from './scripts/dictDeleteJs.txt';
import filterJsCode from './scripts/filterJs.txt';

export default page({
  content: [
    node('Breadcrumbs', {
      name: 'BreadcrumbsItems',
      forwardDisabled: true,
      items: `{{
  breadcrumbsJs.getBreadcrumbs()
}}`,
      onBack: `{{
  dictionaryJs.goToList()
}}`,
      onNavigate: `{{
  breadcrumbsJs.onNavigate(id)
}}`,
    }),
    node('Stack', {
      name: 'StackHeader',
      children: [
        node('Stack', {
          name: 'StackHeaderInfo',
          children: [
            node('Text', {
              name: 'TextTitle',
              color: '#161A22',
              text: `{{
  dictionaryJs.getDictionary()?.name || ''
}}`,
              variant: 'heading2-m',
            }),
            node('Text', {
              name: 'TextSubtitle',
              color: '#858C99',
              text: `{{
  dictionaryJs.getDictionary()?.description || ''
}}`,
              visible: `{{
  Boolean(dictionaryJs.getDictionary()?.description)
}}`,
            }),
          ],
          gap: '4px',
        }),
        node('Stack', {
          name: 'StackHeaderActions',
          children: [
            node('Button', {
              name: 'ButtonEditDictionary',
              widthMode: 'hug',
              color: 'secondary',
              disabled: `{{
  !dictionaryJs.getDictionary()
}}`,
              onClick: `{{
  dictEditJs.toggleModal()
}}`,
              startIcon: 'PencilSimple',
              text: '',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonDeleteDictionary',
              widthMode: 'hug',
              color: 'secondary',
              disabled: `{{
  !dictionaryJs.getDictionary()
}}`,
              onClick: `{{
  dictDeleteJs.toggleModal()
}}`,
              startIcon: 'Trash',
              text: '',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonAddItem',
              widthMode: 'hug',
              disabled: `{{
  !dictionaryJs.canAddItems()
}}`,
              onClick: `{{
  itemModalJs.toggleModal()
}}`,
              size: 'lg',
              startIcon: 'Plus',
              text: 'Додати значення',
            }),
          ],
          verticalAlign: 'center',
          widthMode: 'hug',
          direction: 'row',
        }),
      ],
      margin: '4px 0 14px',
      verticalAlign: 'center',
      direction: 'row',
      gap: '16px',
    }),
    node('Stack', {
      name: 'StackToolbar',
      children: [
        node('Input', {
          name: 'InputSearch',
          maxWidth: '296',
          width: '296',
          widthMode: 'fixed',
          debounce: true,
          debounceDelay: '400',
          label: '',
          onChange: `{{
  itemsJs.getData()
}}`,
          placeholder: 'Пошук',
          startIcon: 'MagnifyingGlass',
        }),
        node('Stack', {
          name: 'StackToolbarActions',
          children: [
            node('Menu', {
              name: 'MenuSorting',
              trigger: [
                node('Button', {
                  name: 'ButtonSorting',
                  widthMode: 'hug',
                  color: 'secondary',
                  startIcon: '{{ MenuSorting.selectedValue ? "FCSortAscendingActive" : "SortAscending" }}',
                  text: 'Сортування',
                  variant: 'outlined',
                }),
              ],
              horizontalAlign: 'end',
              widthMode: 'hug',
              items: `{{
  sortingJs.getItems(MenuSorting.selectedValue)
}}`,
              onItemClick: `{{
  sortingJs.onSort()
}}`,
              selectable: true,
            }),
            node('Filter', {
              name: 'FilterItems',
              widthMode: 'hug',
              categories: [
                {
                  id: 'name',
                  label: 'Назва',
                  onClear: `{{
  filterJs.onClearCategory(id)
}}`,
                  onSelect: '',
                  tag: `{{
  CheckboxGroupName.values.length || ''
}}`,
                  panel: [
                    node('Input', {
                      name: 'InputFilterName',
                      label: '',
                      onChange: `{{
  filterJs.onLetterSearch()
}}`,
                      placeholder: 'Пошук',
                      startIcon: 'MagnifyingGlass',
                    }),
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupName',
                      label: '',
                      options: '{{ filterJs.getLetterOptions(\'name\') }}',
                    }),
                  ],
                },
                {
                  id: 'status',
                  label: 'Статус',
                  onClear: `{{
  filterJs.onClearCategory(id)
}}`,
                  onSelect: '',
                  tag: `{{
  CheckboxGroupStatus.values.length || ''
}}`,
                  panel: [
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupStatus',
                      label: '',
                      options: '{{ filterJs.getStatusOptions() }}',
                    }),
                  ],
                },
              ],
              defaultCategory: 'name',
              disableApply: `{{
  !filterJs.isChanged()
}}`,
              disableClear: `{{
  filterJs.isEmpty()
}}`,
              onApply: `{{
  filterJs.onApply()
}}`,
              onClear: `{{
  filterJs.onClear()
}}`,
              onClose: `{{
  filterJs.onClose()
}}`,
              onQuickClear: `{{
  filterJs.onQuickClear()
}}`,
              startIcon: `{{
  filterJs.isActive() ? "FCFunnelActive" : "Funnel"
}}`,
              triggerTag: `{{
  filterJs.isActive() ? filterJs.selectedQty() : ''
}}`,
            }),
          ],
          horizontalAlign: 'end',
          widthMode: 'hug',
          direction: 'row',
        }),
      ],
      horizontalAlign: 'space-between',
      margin: '0 0 8px',
      direction: 'row',
    }),
    node('Table', {
      name: 'TableItems',
      customCss: `& tbody button {
  opacity: 0;
  transition: opacity 120ms ease;
}

& tbody tr:hover button {
  opacity: 1;
}`,
      heightMode: 'fill',
      horizontalAlign: 'end',
      columns: [
        {
          align: 'start',
          cell: [
            node('Text', {
              name: 'TextCellName',
              heightMode: 'fill',
              verticalAlign: 'center',
              text: '{{ currentItem?.name || \'\' }}',
              variant: 'body4-m',
            }),
          ],
          id: 'col2',
          key: 'name',
          maxWidth: '',
          minWidth: '',
          title: 'Назва',
          width: '',
          widthMode: 'fill',
        },
        {
          align: 'start',
          cell: [
            node('Text', {
              name: 'TextCellCode',
              heightMode: 'fill',
              verticalAlign: 'center',
              text: '{{ currentItem?.code || \'\' }}',
              variant: 'body4-r',
            }),
          ],
          id: 'col3',
          key: 'code',
          maxWidth: '',
          minWidth: '',
          title: 'Код',
          width: '',
          widthMode: 'fill',
        },
        {
          align: 'start',
          cell: [
            node('Text', {
              name: 'TextCellDescription',
              heightMode: 'fill',
              verticalAlign: 'center',
              color: '#858C99',
              text: '{{ currentItem?.description || \'\' }}',
              variant: 'body4-r',
            }),
          ],
          id: 'col4',
          key: 'description',
          maxWidth: '',
          minWidth: '',
          title: 'Опис',
          width: '',
          widthMode: 'fill',
        },
        {
          align: 'center',
          cell: [
            node('Badge', {
              name: 'BadgeStatus',
              heightMode: 'fill',
              horizontalAlign: 'center',
              verticalAlign: 'center',
              color: `{{
  currentItem?.is_active === false ? 'secondary' : 'success'
}}`,
              size: 'sm',
              text: `{{
  currentItem?.is_active === false ? 'Не активний' : 'Активний'
}}`,
            }),
          ],
          id: 'col5',
          key: 'is_active',
          maxWidth: '',
          minWidth: '',
          title: 'Статус',
          width: '140px',
          widthMode: 'fixed',
        },
        {
          align: 'start',
          id: 'col7',
          key: 'fcp_id',
          title: 'FCP ID',
          width: '260px',
          widthMode: 'fixed',
          minWidth: '',
          maxWidth: '',
          cell: [
            node('Text', {
              name: 'TextCellFcpId',
              customCss: `overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;`,
              heightMode: 'fill',
              verticalAlign: 'center',
              color: '#858C99',
              text: '{{ currentItem?.fcp_id || \'\' }}',
              variant: 'body4-r',
            }),
          ],
        },
        {
          align: 'end',
          cell: [
            node('Stack', {
              name: 'StackRowActions',
              children: [
                node('Icon', {
                  name: 'IconRowEdit',
                  widthMode: 'hug',
                  icon: 'PencilSimple',
                  onClick: `{{
  itemModalJs.toggleModal(currentItem)
}}`,
                }),
                node('Icon', {
                  name: 'IconRowDelete',
                  widthMode: 'hug',
                  icon: 'Trash',
                  onClick: `{{
  deleteItemJs.toggleModal(currentItem)
}}`,
                }),
              ],
              heightMode: 'fill',
              horizontalAlign: 'end',
              verticalAlign: 'center',
              direction: 'row',
            }),
          ],
          id: 'col6',
          key: 'actions',
          maxWidth: '',
          minWidth: '',
          title: '',
          width: '72px',
          widthMode: 'fixed',
        },
      ],
      data: `{{
  getDictionaryItems.data?.items || []
}}`,
      enableSorting: false,
      itemKey: 'fcp_id',
      enablePagination: '{{ (getDictionaryItems.data?.total?.aggregate?.count || 0) > 15 }}',
      onPageChange: `{{
  getDictionaryItems.run()
}}`,
      onPageSizeChange: `{{
  itemsJs.getData()
}}`,
      serverSidePagination: true,
      totalCount: `{{
  getDictionaryItems.data?.total?.aggregate?.count || 0
}}`,
    }),
    node('Modal', {
      name: 'ModalItem',
      children: [
        node('Text', {
          name: 'TextItemTitle',
          color: '#161A22',
          text: `{{
  itemModalJs.currentItem ? \`Редагувати "\${itemModalJs.currentItem.name || ''}"\` : 'Створення значення'
}}`,
          variant: 'heading4-sb',
        }),
        node('Text', {
          name: 'TextItemSubtitle',
          margin: '4px 0 0',
          color: '#858C99',
          text: 'Створення значення до словника',
          variant: 'body4-r',
          visible: `{{
  !itemModalJs.currentItem
}}`,
        }),
        node('Input', {
          name: 'InputItemName',
          margin: '24px 0 0 ',
          defaultValid: `{{
  itemModalJs.notBlank(InputItemName)
}}`,
          required: true,
          validationMessage: 'Обов\'язкове поле',
          marker: true,
          defaultValue: `{{
  itemModalJs.currentItem?.name ?? ''
}}`,
          disabled: `{{
  itemModalJs.loading
}}`,
          label: 'Назва',
          placeholder: 'name',
        }),
        node('Input', {
          name: 'InputItemCode',
          margin: '16px 0 0',
          defaultValue: `{{
  itemModalJs.currentItem?.code ?? ''
}}`,
          disabled: `{{
  itemModalJs.loading
}}`,
          label: 'Код',
          placeholder: 'dictionary.name',
        }),
        node('RadioGroup', {
          name: 'RadioItemStatus',
          margin: '16px 0 0',
          required: true,
          marker: true,
          defaultValue: `{{
  itemModalJs.currentItem?.is_active === false ? 'inactive' : 'active'
}}`,
          disabled: `{{
  itemModalJs.loading
}}`,
          label: 'Статус',
          options: `{{
  [{ value: 'active', label: 'Активний' }, { value: 'inactive', label: 'Не активний' }]
}}`,
        }),
        node('Input', {
          name: 'InputItemDescription',
          margin: '16px 0 0',
          defaultValue: `{{
  itemModalJs.currentItem?.description ?? ''
}}`,
          disabled: `{{
  itemModalJs.loading
}}`,
          label: 'Опис',
          placeholder: 'Enter a description...',
          type: 'textarea',
        }),
        node('Stack', {
          name: 'StackItemActions',
          children: [
            node('Button', {
              name: 'ButtonItemCancel',
              widthMode: 'hug',
              onClick: `{{
  itemModalJs.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonItemSubmit',
              widthMode: 'hug',
              disabled: `{{
  itemModalJs.getDisableSubmit() || itemModalJs.loading
}}`,
              onClick: `{{
  itemModalJs.onSubmit()
}}`,
              text: `{{
  itemModalJs.currentItem ? 'Зберегти' : 'Створити'
}}`,
            }),
          ],
          horizontalAlign: 'end',
          margin: '24px 0 0',
          direction: 'row',
          gap: '12px',
        }),
      ],
      height: '',
    }),
    node('Modal', {
      name: 'ModalDeleteItem',
      children: [
        node('Text', {
          name: 'TextDeleteItemTitle',
          color: '#161A22',
          text: `{{
  \`Видалити значення "\${deleteItemJs.getLabel()}"?\`
}}`,
          variant: 'heading4-sb',
        }),
        node('Text', {
          name: 'TextDeleteItemDescription',
          margin: '8px 0 0',
          color: '#858C99',
          text: `{{
  deleteItemJs.getDescription()
}}`,
          variant: 'body4-r',
        }),
        node('Stack', {
          name: 'StackDeleteItemActions',
          children: [
            node('Button', {
              name: 'ButtonDeleteItemCancel',
              widthMode: 'hug',
              onClick: `{{
  deleteItemJs.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonDeleteItemSubmit',
              widthMode: 'hug',
              color: 'error',
              disabled: `{{
  deleteItemJs.loading
}}`,
              onClick: `{{
  deleteItemJs.onSubmit()
}}`,
              text: 'Видалити',
            }),
          ],
          horizontalAlign: 'end',
          margin: '48px 0 0',
          direction: 'row',
          gap: '12px',
        }),
      ],
      height: '',
    }),
    node('Modal', {
      name: 'ModalEditDictionary',
      children: [
        node('Text', {
          name: 'TextEditDictTitle',
          color: '#161A22',
          text: `{{
  \`Редагувати "\${dictionaryJs.getDictionary()?.name || ''}"\`
}}`,
          variant: 'heading4-sb',
        }),
        node('Input', {
          name: 'InputEditDictName',
          margin: '24px 0 0 ',
          defaultValid: `{{
  dictEditJs.notBlank(InputEditDictName)
}}`,
          required: true,
          validationMessage: 'Обов\'язкове поле',
          marker: true,
          defaultValue: `{{
  dictionaryJs.getDictionary()?.name ?? ''
}}`,
          disabled: `{{
  dictEditJs.loading
}}`,
          label: 'Назва',
          placeholder: '',
        }),
        node('Input', {
          name: 'InputEditDictCode',
          margin: '16px 0 0',
          defaultValue: `{{
  dictionaryJs.getDictionary()?.code ?? ''
}}`,
          disabled: `{{
  dictEditJs.loading
}}`,
          label: 'Код',
          placeholder: '',
        }),
        node('RadioGroup', {
          name: 'RadioEditDictExtensible',
          margin: '16px 0 0',
          required: true,
          marker: true,
          defaultValue: `{{
  dictionaryJs.getDictionary()?.is_extensible ? 'yes' : 'no'
}}`,
          disabled: `{{
  dictEditJs.loading
}}`,
          label: 'Дозволено додавати записи',
          options: `{{
  [{ value: 'yes', label: 'Так' }, { value: 'no', label: 'Ні' }]
}}`,
        }),
        node('Input', {
          name: 'InputEditDictDescription',
          margin: '16px 0 0',
          defaultValue: `{{
  dictionaryJs.getDictionary()?.description ?? ''
}}`,
          disabled: `{{
  dictEditJs.loading
}}`,
          label: 'Опис',
          placeholder: '',
          type: 'textarea',
        }),
        node('Stack', {
          name: 'StackEditDictActions',
          children: [
            node('Button', {
              name: 'ButtonEditDictCancel',
              widthMode: 'hug',
              onClick: `{{
  dictEditJs.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonEditDictSubmit',
              widthMode: 'hug',
              disabled: `{{
  dictEditJs.getDisableSubmit() || dictEditJs.loading
}}`,
              onClick: `{{
  dictEditJs.onSubmit()
}}`,
              text: 'Зберегти',
            }),
          ],
          horizontalAlign: 'end',
          margin: '24px 0 0',
          direction: 'row',
          gap: '12px',
        }),
      ],
      height: '',
    }),
    node('Modal', {
      name: 'ModalDeleteDictionary',
      children: [
        node('Text', {
          name: 'TextDeleteDictTitle',
          color: '#161A22',
          text: `{{
  \`Видалити словник "\${dictionaryJs.getDictionary()?.name || ''}"?\`
}}`,
          variant: 'heading4-sb',
        }),
        node('Text', {
          name: 'TextDeleteDictDescription',
          margin: '8px 0 0',
          color: '#858C99',
          text: `{{
  dictDeleteJs.getDescription()
}}`,
          variant: 'body4-r',
        }),
        node('Stack', {
          name: 'StackDeleteDictActions',
          children: [
            node('Button', {
              name: 'ButtonDeleteDictCancel',
              widthMode: 'hug',
              onClick: `{{
  dictDeleteJs.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonDeleteDictSubmit',
              widthMode: 'hug',
              color: 'error',
              disabled: `{{
  dictDeleteJs.loading
}}`,
              onClick: `{{
  dictDeleteJs.onSubmit()
}}`,
              text: 'Видалити',
            }),
          ],
          horizontalAlign: 'end',
          margin: '48px 0 0',
          direction: 'row',
          gap: '12px',
        }),
      ],
      height: '',
    }),
  ],
  queries: [
    graphqlQuery(
  'getDictionary',
  `query GetDictionary($id: String!) {
  dictionaries: businessmngt_dictionaries_v1(where: { fcp_id: { _eq: $id } }, limit: 1) {
    fcp_id
    code
    name
    description
    is_extensible
    total: dictionaryitem_dictionary_fcp_id_array_aggregate {
      aggregate {
        count
      }
    }
  }
}`,
  { runOnPageLoad: false, variables: `{
  "id": {{ JSON.stringify(params?.id ?? app.URL.params?.id ?? '') }}
}` }
),
    graphqlQuery(
  'getDictionaryItems',
  `query GetDictionaryItems(
  $offset: Int
  $limit: Int
  $order_by: [businessmngt_dictionary_items_v1_order_by!]
  $where: businessmngt_dictionary_items_v1_bool_exp
) {
  items: businessmngt_dictionary_items_v1(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
    fcp_id
    code
    name
    description
    is_active
    dictionary_fcp_id
  }
  total: businessmngt_dictionary_items_v1_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}`,
  { runOnPageLoad: false, variables: `{
  "offset": {{ ((TableItems.page || 1) - 1) * (TableItems.pageSize || 15) }},
  "limit": {{ TableItems.pageSize || 15 }},
  "order_by": {{ sortingJs.getOrderBy() }},
  "where": {{ itemsJs.getWhere() }}
}` }
),
    graphqlQuery(
  'createDictionaryItem',
  `mutation CreateDictionaryItem($object: businessmngt_dictionary_items_v1_insert_input!) {
  item: insert_businessmngt_dictionary_items_v1_one(object: $object) {
    fcp_id
    name
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
    graphqlQuery(
  'updateDictionaryItem',
  `mutation UpdateDictionaryItem($id: String!, $object: businessmngt_dictionary_items_v1_set_input!) {
  item: update_businessmngt_dictionary_items_v1_by_pk(pk_columns: { fcp_id: $id }, _set: $object) {
    fcp_id
    name
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
    graphqlQuery(
  'deleteDictionaryItem',
  `mutation DeleteDictionaryItem($id: String!) {
  item: delete_businessmngt_dictionary_items_v1_by_pk(fcp_id: $id) {
    fcp_id
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
    graphqlQuery(
  'updateDictionary',
  `mutation UpdateDictionary($id: String!, $object: businessmngt_dictionaries_v1_set_input!) {
  dictionary: update_businessmngt_dictionaries_v1_by_pk(pk_columns: { fcp_id: $id }, _set: $object) {
    fcp_id
    name
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
    graphqlQuery(
  'deleteDictionaryItems',
  `mutation DeleteDictionaryItems($id: String!) {
  items: delete_businessmngt_dictionary_items_v1(where: { dictionary_fcp_id: { _eq: $id } }) {
    affected_rows
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
    graphqlQuery(
  'deleteDictionary',
  `mutation DeleteDictionary($id: String!) {
  dictionary: delete_businessmngt_dictionaries_v1_by_pk(fcp_id: $id) {
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
  scripts: [script('constantsJs', constantsJsCode), script('initJs', initJsCode), script('dictionaryJs', dictionaryJsCode), script('breadcrumbsJs', breadcrumbsJsCode), script('itemsJs', itemsJsCode), script('sortingJs', sortingJsCode), script('itemModalJs', itemModalJsCode), script('deleteItemJs', deleteItemJsCode), script('dictEditJs', dictEditJsCode), script('dictDeleteJs', dictDeleteJsCode), script('filterJs', filterJsCode)],
});
