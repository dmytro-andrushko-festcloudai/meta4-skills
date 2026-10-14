import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsCode from './scripts/constants.txt';
import tableCode from './scripts/table.txt';
import sortingCode from './scripts/sorting.txt';
import filterCode from './scripts/filter.txt';

export default page({
  content: [
    node('Stack', {
      name: 'StackHeader',
      children: [
        node('Text', {
          name: 'TextTitle',
          text: 'Товари',
          variant: 'heading2-m',
        }),
        node('Button', {
          name: 'ButtonCreate',
          widthMode: 'hug',
          onClick: `{{
  table.onCreate()
}}`,
          text: 'Створити товар',
          startIcon: 'Plus',
          size: 'lg',
        }),
      ],
      margin: '0 0 14px',
      direction: 'row',
    }),
    node('Stack', {
      name: 'StackToolbar',
      children: [
        node('Input', {
          name: 'InputSearch',
          heightMode: 'fill',
          margin: ' 0 auto 0 0',
          maxWidth: '296',
          width: '296',
          widthMode: 'fixed',
          debounce: true,
          debounceDelay: '400',
          label: '',
          onChange: `{{
  table.getData()
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
                  text: 'Сортування',
                  variant: 'outlined',
                  color: 'secondary',
                  widthMode: 'hug',
                  startIcon: '{{ MenuSorting.selectedValue? "FCSortAscendingActive":"SortAscending"}}',
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
              name: 'FilterNomenclatures',
              widthMode: 'hug',
              categories: [
                {
                  id: 'name',
                  label: 'Назва товару',
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
                      widthMode: 'hug',
                      debounce: true,
                      debounceDelay: '400',
                      label: '',
                      onChange: `{{
  filter.onSearch()
}}`,
                      placeholder: 'Пошук',
                      startIcon: 'MagnifyingGlass',
                    }),
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupName',
                      label: '',
                      options: '{{ filter.getNameOptions() }}',
                    }),
                  ],
                },
                {
                  id: 'manufacturer',
                  label: 'Виробник',
                  onClear: `{{
  filter.onClearCategory(id)
}}`,
                  onSelect: '',
                  tag: `{{
  CheckboxGroupManufacturer.values.length || ''
}}`,
                  panel: [
                    node('Input', {
                      name: 'InputFilterManufacturer',
                      widthMode: 'hug',
                      debounce: true,
                      debounceDelay: '400',
                      label: '',
                      onChange: `{{
  filter.onSearch()
}}`,
                      placeholder: 'Пошук',
                      startIcon: 'MagnifyingGlass',
                    }),
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupManufacturer',
                      label: '',
                      options: '{{ filter.getManufacturerOptions() }}',
                    }),
                  ],
                },
                {
                  id: 'country',
                  label: 'Країна походження',
                  onClear: `{{
  filter.onClearCategory(id)
}}`,
                  onSelect: '',
                  tag: `{{
  CheckboxGroupCountry.values.length || ''
}}`,
                  panel: [
                    node('Input', {
                      name: 'InputFilterCountry',
                      widthMode: 'hug',
                      debounce: true,
                      debounceDelay: '400',
                      label: '',
                      onChange: `{{
  filter.onSearch()
}}`,
                      placeholder: 'Пошук',
                      startIcon: 'MagnifyingGlass',
                    }),
                    node('CheckboxGroup', {
                      name: 'CheckboxGroupCountry',
                      label: '',
                      options: '{{ filter.getCountryOptions() }}',
                    }),
                  ],
                },
              ],
              defaultCategory: 'name',
              onApply: `{{
  filter.onApply()
}}`,
              onClear: `{{
  filter.onClear()
}}`,
              onClose: `{{
  filter.onClose()
}}`,
              triggerTag: `{{
  filter.isActive() ? filter.selectedQty() : ''
}}`,
              startIcon: `{{
  filter.isActive() ? "FCFunnelActive" : "Funnel"
}}`,
              disableClear: `{{
  filter.isEmpty()
}}`,
              disableApply: `{{
  !filter.isChanged()
}}`,
              onQuickClear: `{{
  filter.onQuickClear()
}}`,
            }),
          ],
          horizontalAlign: 'end',
          direction: 'row',
        }),
      ],
      margin: '0 0 8px',
      direction: 'row',
    }),
    node('Table', {
      name: 'TableNomenclatures',
      customCss: `& tbody button {
  opacity: 0;
  transition: opacity 120ms ease;
}

& tbody tr:hover button {
  opacity: 1;
}`,
      enablePagination: '{{ (getNomenclatures.data?.total?.aggregate?.count || 0) > 15 }}',
      onPageChange: `{{
  getNomenclatures.run()
}}`,
      onPageSizeChange: `{{
  table.getData()
}}`,
      serverSidePagination: true,
      totalCount: `{{
  getNomenclatures.data?.total?.aggregate?.count || 0
}}`,
      columns: [
        {
          id: 'Sku',
          key: 'sku',
          title: 'ID',
          width: '200px',
          widthMode: 'fixed',
          minWidth: '',
          maxWidth: '',
          cell: [
            node('Text', {
              name: 'TextCellSku',
              heightMode: 'fill',
              verticalAlign: 'center',
              text: '{{ currentItem?.sku || \'—\' }}',
              variant: 'body4-r',
            }),
          ],
        },
        {
          id: 'Name',
          key: 'name',
          title: 'Назва товару',
          width: '',
          widthMode: 'fill',
          minWidth: '',
          maxWidth: '',
          cell: [
            node('Text', {
              name: 'TextCellName',
              heightMode: 'fill',
              verticalAlign: 'center',
              text: '{{ currentItem?.name || \'\' }}',
              variant: 'body4-m',
            }),
          ],
        },
        {
          id: 'Manufacturer',
          key: 'manufacturer_name',
          title: 'Виробник',
          width: '',
          widthMode: 'fill',
          minWidth: '',
          maxWidth: '',
          cell: [
            node('Text', {
              name: 'TextCellManufacturer',
              heightMode: 'fill',
              verticalAlign: 'center',
              text: '{{ currentItem?.manufacturer_name?.trim() || \'—\' }}',
              variant: 'body4-r',
            }),
          ],
        },
        {
          id: 'Country',
          key: 'country_of_origin',
          title: 'Країна походження',
          width: '',
          widthMode: 'fill',
          minWidth: '',
          maxWidth: '',
          cell: [
            node('Text', {
              name: 'TextCellCountry',
              heightMode: 'fill',
              verticalAlign: 'center',
              text: '{{ currentItem?.country_of_origin || \'—\' }}',
              variant: 'body4-r',
            }),
          ],
        },
        {
          id: 'col6',
          key: 'actions',
          title: '',
          width: '72px',
          widthMode: 'fixed',
          minWidth: '',
          maxWidth: '',
          cell: [
            node('Stack', {
              name: 'StackRowActions',
              children: [
                node('Menu', {
                  name: 'MenuRowActions',
                  trigger: [
                    node('Icon', {
                      name: 'IconRowMenu',
                      color: 'primary',
                      icon: 'DotsThreeCircle',
                      onClick: `{{
  ()=>{}
}}`,
                    }),
                  ],
                  heightMode: 'fill',
                  verticalAlign: 'center',
                  items: `{{
  table.getRowActions()
}}`,
                  onItemClick: `{{
  table.onMenuClick(value, currentItem)
}}`,
                }),
                node('Icon', {
                  name: 'IconRowPreview',
                  horizontalAlign: 'center',
                  icon: 'CaretRight',
                  onClick: `{{
  table.onPreview(currentItem)
}}`,
                }),
              ],
              heightMode: 'fill',
              verticalAlign: 'center',
              direction: 'row',
            }),
          ],
        },
      ],
      data: `{{
  getNomenclatures.data?.nomenclatures || []
}}`,
      enableSorting: false,
      itemKey: 'fcp_id',
      onDoubleRowClick: `{{
  table.onPreview(currentItem)
}}`,
    }),
  ],
  queries: [
    graphqlQuery(
  'getNomenclatures',
  `query GetNomenclatures(
  $offset: Int
  $limit: Int
  $order_by: [businessmngt_nomenclatures_v0_order_by!]
  $where: businessmngt_nomenclatures_v0_bool_exp
) {
  nomenclatures: businessmngt_nomenclatures_v0(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
    fcp_id
    name
    sku
    manufacturer_name
    country_of_origin
  }
  total: businessmngt_nomenclatures_v0_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}`,
  { variables: `{{
  table.getVariables()
}}` }
),
    graphqlQuery(
  'getFilters',
  `query GetNomenclatureFilters($nameSearch: String!, $manufacturerSearch: String!, $countrySearch: String!) {
  names: businessmngt_nomenclatures_v0(
    where: { name: { _ilike: $nameSearch } }
    distinct_on: name
    order_by: { name: asc }
    limit: 100
  ) {
    name
  }
  manufacturers: businessmngt_nomenclatures_v0(
    where: { manufacturer_name: { _ilike: $manufacturerSearch } }
    distinct_on: manufacturer_name
    order_by: { manufacturer_name: asc }
    limit: 100
  ) {
    manufacturer_name
  }
  countries: businessmngt_nomenclatures_v0(
    where: { country_of_origin: { _ilike: $countrySearch } }
    distinct_on: country_of_origin
    order_by: { country_of_origin: asc }
    limit: 100
  ) {
    country_of_origin
  }
}`,
  { variables: `{{
  filter.getSearchVariables()
}}` }
),
  ],
  scripts: [script('constants', constantsCode), script('table', tableCode), script('sorting', sortingCode), script('filter', filterCode)],
});
