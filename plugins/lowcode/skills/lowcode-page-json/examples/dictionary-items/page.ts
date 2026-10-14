import { graphqlQuery, node, page, script, stack } from '../../scripts/builder';
import constantsCode from './scripts/constants.txt';
import initCode from './scripts/init.txt';
import dictionaryCode from './scripts/dictionary.txt';
import breadcrumbsCode from './scripts/breadcrumbs.txt';
import itemsCode from './scripts/items.txt';
import sortingCode from './scripts/sorting.txt';
import itemModalCode from './scripts/itemModal.txt';
import deleteItemCode from './scripts/deleteItem.txt';
import dictEditCode from './scripts/dictEdit.txt';
import dictDeleteCode from './scripts/dictDelete.txt';
import filterCode from './scripts/filter.txt';

export default page({
  content: [
    node('Breadcrumbs', {
      name: 'BreadcrumbsItems',
      forwardDisabled: true,
      items: `{{
  breadcrumbs.getBreadcrumbs()
}}`,
      onBack: `{{
  dictionary.goToList()
}}`,
      onNavigate: `{{
  breadcrumbs.onNavigate(id)
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
  dictionary.getDictionary()?.name || ''
}}`,
              variant: 'heading2-m',
            }),
            node('Text', {
              name: 'TextSubtitle',
              color: '#858C99',
              text: `{{
  dictionary.getDictionary()?.description || ''
}}`,
              visible: `{{
  Boolean(dictionary.getDictionary()?.description)
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
  !dictionary.getDictionary()
}}`,
              onClick: `{{
  dictEdit.toggleModal()
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
  !dictionary.getDictionary()
}}`,
              onClick: `{{
  dictDelete.toggleModal()
}}`,
              startIcon: 'Trash',
              text: '',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonAddItem',
              widthMode: 'hug',
              disabled: `{{
  !dictionary.canAddItems()
}}`,
              onClick: `{{
  itemModal.toggleModal()
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
  items.getData()
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
  sorting.getItems(MenuSorting.selectedValue)
}}`,
              onItemClick: `{{
  sorting.onSort()
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
  filter.onClearCategory(id)
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
  filter.onLetterSearch()
}}`,
                      placeholder: 'Пошук',
                      startIcon: 'MagnifyingGlass',
                    }),
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupName',
                      label: '',
                      options: '{{ filter.getLetterOptions(\'name\') }}',
                    }),
                  ],
                },
                {
                  id: 'status',
                  label: 'Статус',
                  onClear: `{{
  filter.onClearCategory(id)
}}`,
                  onSelect: '',
                  tag: `{{
  CheckboxGroupStatus.values.length || ''
}}`,
                  panel: [
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupStatus',
                      label: '',
                      options: '{{ filter.getStatusOptions() }}',
                    }),
                  ],
                },
              ],
              defaultCategory: 'name',
              disableApply: `{{
  !filter.isChanged()
}}`,
              disableClear: `{{
  filter.isEmpty()
}}`,
              onApply: `{{
  filter.onApply()
}}`,
              onClear: `{{
  filter.onClear()
}}`,
              onClose: `{{
  filter.onClose()
}}`,
              onQuickClear: `{{
  filter.onQuickClear()
}}`,
              startIcon: `{{
  filter.isActive() ? "FCFunnelActive" : "Funnel"
}}`,
              triggerTag: `{{
  filter.isActive() ? filter.selectedQty() : ''
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
  itemModal.toggleModal(currentItem)
}}`,
                }),
                node('Icon', {
                  name: 'IconRowDelete',
                  widthMode: 'hug',
                  icon: 'Trash',
                  onClick: `{{
  deleteItem.toggleModal(currentItem)
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
  items.getData()
}}`,
      serverSidePagination: true,
      totalCount: `{{
  getDictionaryItems.data?.total?.aggregate?.count || 0
}}`,
    }),
    node('Modal', {
      name: 'ModalItem',
      children: [
        stack({ direction: 'column', widthMode: 'fill', customCss: 'max-height: calc(90vh - 48px); overflow: hidden;' }, [
        node('Text', {
          name: 'TextItemTitle',
          padding: '0 32px 0 0',
          customCss: 'overflow-wrap: anywhere;',
          color: '#161A22',
          text: `{{
  itemModal.currentItem ? \`Редагувати "\${itemModal.currentItem.name || ''}"\` : 'Створення значення'
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
  !itemModal.currentItem
}}`,
        }),
        stack({ direction: 'column', widthMode: 'fill', customCss: 'flex: 1 1 auto; min-height: 0; overflow-y: auto;' }, [
        node('Input', {
          name: 'InputItemName',
          margin: '24px 0 0 ',
          defaultValid: `{{
  itemModal.notBlank(InputItemName)
}}`,
          required: true,
          validationMessage: 'Обов\'язкове поле',
          marker: true,
          defaultValue: `{{
  itemModal.currentItem?.name ?? ''
}}`,
          disabled: `{{
  itemModal.loading
}}`,
          label: 'Назва',
          placeholder: 'name',
        }),
        node('Input', {
          name: 'InputItemCode',
          margin: '16px 0 0',
          defaultValue: `{{
  itemModal.currentItem?.code ?? ''
}}`,
          disabled: `{{
  itemModal.loading
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
  itemModal.currentItem?.is_active === false ? 'inactive' : 'active'
}}`,
          disabled: `{{
  itemModal.loading
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
  itemModal.currentItem?.description ?? ''
}}`,
          disabled: `{{
  itemModal.loading
}}`,
          label: 'Опис',
          placeholder: 'Enter a description...',
          type: 'textarea',
        }),
        ]),
        node('Stack', {
          name: 'StackItemActions',
          children: [
            node('Button', {
              name: 'ButtonItemCancel',
              widthMode: 'hug',
              onClick: `{{
  itemModal.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonItemSubmit',
              widthMode: 'hug',
              disabled: `{{
  itemModal.getDisableSubmit() || itemModal.loading
}}`,
              onClick: `{{
  itemModal.onSubmit()
}}`,
              text: `{{
  itemModal.currentItem ? 'Зберегти' : 'Створити'
}}`,
            }),
          ],
          horizontalAlign: 'end',
          margin: '24px 0 0',
          direction: 'row',
          gap: '12px',
        }),
        ]),
      ],
      height: '',
      maxHeight: '90vh',
    }),
    node('Modal', {
      name: 'ModalDeleteItem',
      children: [
        node('Text', {
          name: 'TextDeleteItemTitle',
          padding: '0 32px 0 0',
          customCss: 'overflow-wrap: anywhere;',
          color: '#161A22',
          text: `{{
  \`Видалити значення "\${deleteItem.getLabel()}"?\`
}}`,
          variant: 'heading4-sb',
        }),
        node('Text', {
          name: 'TextDeleteItemDescription',
          customCss: 'overflow-wrap: anywhere;',
          margin: '8px 0 0',
          color: '#858C99',
          text: `{{
  deleteItem.getDescription()
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
  deleteItem.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonDeleteItemSubmit',
              widthMode: 'hug',
              color: 'error',
              disabled: `{{
  deleteItem.loading
}}`,
              onClick: `{{
  deleteItem.onSubmit()
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
      maxHeight: '90vh',
    }),
    node('Modal', {
      name: 'ModalEditDictionary',
      children: [
        stack({ direction: 'column', widthMode: 'fill', customCss: 'max-height: calc(90vh - 48px); overflow: hidden;' }, [
        node('Text', {
          name: 'TextEditDictTitle',
          padding: '0 32px 0 0',
          customCss: 'overflow-wrap: anywhere;',
          color: '#161A22',
          text: `{{
  \`Редагувати "\${dictionary.getDictionary()?.name || ''}"\`
}}`,
          variant: 'heading4-sb',
        }),
        stack({ direction: 'column', widthMode: 'fill', customCss: 'flex: 1 1 auto; min-height: 0; overflow-y: auto;' }, [
        node('Input', {
          name: 'InputEditDictName',
          margin: '24px 0 0 ',
          defaultValid: `{{
  dictEdit.notBlank(InputEditDictName)
}}`,
          required: true,
          validationMessage: 'Обов\'язкове поле',
          marker: true,
          defaultValue: `{{
  dictionary.getDictionary()?.name ?? ''
}}`,
          disabled: `{{
  dictEdit.loading
}}`,
          label: 'Назва',
          placeholder: '',
        }),
        node('Input', {
          name: 'InputEditDictCode',
          margin: '16px 0 0',
          defaultValue: `{{
  dictionary.getDictionary()?.code ?? ''
}}`,
          disabled: `{{
  dictEdit.loading
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
  dictionary.getDictionary()?.is_extensible ? 'yes' : 'no'
}}`,
          disabled: `{{
  dictEdit.loading
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
  dictionary.getDictionary()?.description ?? ''
}}`,
          disabled: `{{
  dictEdit.loading
}}`,
          label: 'Опис',
          placeholder: '',
          type: 'textarea',
        }),
        ]),
        node('Stack', {
          name: 'StackEditDictActions',
          children: [
            node('Button', {
              name: 'ButtonEditDictCancel',
              widthMode: 'hug',
              onClick: `{{
  dictEdit.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonEditDictSubmit',
              widthMode: 'hug',
              disabled: `{{
  dictEdit.getDisableSubmit() || dictEdit.loading
}}`,
              onClick: `{{
  dictEdit.onSubmit()
}}`,
              text: 'Зберегти',
            }),
          ],
          horizontalAlign: 'end',
          margin: '24px 0 0',
          direction: 'row',
          gap: '12px',
        }),
        ]),
      ],
      height: '',
      maxHeight: '90vh',
    }),
    node('Modal', {
      name: 'ModalDeleteDictionary',
      children: [
        node('Text', {
          name: 'TextDeleteDictTitle',
          padding: '0 32px 0 0',
          customCss: 'overflow-wrap: anywhere;',
          color: '#161A22',
          text: `{{
  \`Видалити словник "\${dictionary.getDictionary()?.name || ''}"?\`
}}`,
          variant: 'heading4-sb',
        }),
        node('Text', {
          name: 'TextDeleteDictDescription',
          customCss: 'overflow-wrap: anywhere;',
          margin: '8px 0 0',
          color: '#858C99',
          text: `{{
  dictDelete.getDescription()
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
  dictDelete.close()
}}`,
              text: 'Скасувати',
              variant: 'outlined',
            }),
            node('Button', {
              name: 'ButtonDeleteDictSubmit',
              widthMode: 'hug',
              color: 'error',
              disabled: `{{
  dictDelete.loading
}}`,
              onClick: `{{
  dictDelete.onSubmit()
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
      maxHeight: '90vh',
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
  "order_by": {{ sorting.getOrderBy() }},
  "where": {{ items.getWhere() }}
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
  scripts: [script('constants', constantsCode), script('init', initCode), script('dictionary', dictionaryCode), script('breadcrumbs', breadcrumbsCode), script('items', itemsCode), script('sorting', sortingCode), script('itemModal', itemModalCode), script('deleteItem', deleteItemCode), script('dictEdit', dictEditCode), script('dictDelete', dictDeleteCode), script('filter', filterCode)],
});
