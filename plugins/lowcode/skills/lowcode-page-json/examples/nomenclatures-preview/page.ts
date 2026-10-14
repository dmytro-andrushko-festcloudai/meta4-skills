import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsCode from './scripts/constants.txt';
import initCode from './scripts/init.txt';
import nomenclatureCode from './scripts/nomenclature.txt';
import breadcrumbsCode from './scripts/breadcrumbs.txt';
import navigationCode from './scripts/navigation.txt';
import mainInfoCode from './scripts/mainInfo.txt';
import storageCode from './scripts/storage.txt';
import regulatedCode from './scripts/regulated.txt';
import clientCode from './scripts/client.txt';
import financeCode from './scripts/finance.txt';

export default page({
  content: [
    node('Breadcrumbs', {
      name: 'BreadcrumbsNomenclature',
      forwardDisabled: true,
      items: `{{
  breadcrumbs.getBreadcrumbs()
}}`,
      onBack: `{{
  navigation.goToList()
}}`,
      onNavigate: `{{
  breadcrumbs.onNavigate(id)
}}`,
    }),
    node('Stack', {
      name: 'StackHeader',
      children: [
        node('Text', {
          name: 'TextTitle',
          text: `{{
  nomenclature.getItem()?.name || ''
}}`,
          variant: 'heading2-m',
        }),
        node('Stack', {
          name: 'StackHeaderActions',
          children: [
            node('Button', {
              name: 'ButtonEdit',
              widthMode: 'hug',
              color: 'secondary',
              disabled: `{{
  !nomenclature.getItem()
}}`,
              onClick: `{{
  navigation.goToEdit()
}}`,
              startIcon: 'PencilSimple',
              text: '',
              variant: 'outlined',
            }),
            node('Divider', {
              name: 'DividerHeader',
              horizontalAlign: 'center',
              maxHeight: '16px',
              maxWidth: '20px',
              padding: '8px 0',
              verticalAlign: 'center',
              orientation: 'vertical',
              visible: `{{
  navigation.isFromCreate()
}}`,
            }),
            node('Button', {
              name: 'ButtonBack',
              widthMode: 'hug',
              onClick: `{{
  navigation.goToList()
}}`,
              text: 'Повернутись до товарів',
              variant: 'outlined',
              visible: `{{
  navigation.isFromCreate()
}}`,
            }),
          ],
          horizontalAlign: 'end',
          direction: 'row',
        }),
      ],
      margin: '4px 0 14px',
      direction: 'row',
    }),
    node('Stack', {
      name: 'StackCardMain',
      children: [
        node('Stack', {
          name: 'StackCardMainTitle',
          children: [
            node('Icon', {
              name: 'IconCardMain',
              padding: '4px',
              widthMode: 'hug',
              color: 'primary',
              icon: 'Info',
              bgColor: '#F5FAFF',
              borderRadius: '4px',
            }),
            node('Text', {
              name: 'TextCardMainTitle',
              text: 'Основна інформація',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Repeater', {
          name: 'RepeaterCardMain',
          children: [
            node('Text', {
              name: 'TextCardMainLabel',
              text: '{{ currentItem.label }}',
              variant: 'body4-r',
              color: '#A3A8B2',
              margin: '0 0 4px',
            }),
            node('Text', {
              name: 'TextCardMainValue',
              text: '{{ currentItem.value }}',
              variant: 'body4-m',
            }),
          ],
          data: `{{
  mainInfo.getData()
}}`,
          direction: 'row',
          gap: '16px',
          qty: '3',
          showAddButton: false,
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
    }),
    node('Stack', {
      name: 'StackCardStorage',
      children: [
        node('Stack', {
          name: 'StackCardStorageTitle',
          children: [
            node('Icon', {
              name: 'IconCardStorage',
              padding: '4px',
              widthMode: 'hug',
              color: 'primary',
              icon: 'Thermometer',
              bgColor: '#F5FAFF',
              borderRadius: '4px',
            }),
            node('Text', {
              name: 'TextCardStorageTitle',
              text: 'Інформація про зберігання',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Repeater', {
          name: 'RepeaterCardStorage',
          children: [
            node('Text', {
              name: 'TextCardStorageLabel',
              text: '{{ currentItem.label }}',
              variant: 'body4-r',
              color: '#A3A8B2',
              margin: '0 0 4px',
            }),
            node('Text', {
              name: 'TextCardStorageValue',
              text: '{{ currentItem.value }}',
              variant: 'body4-m',
            }),
          ],
          data: `{{
  storage.getData()
}}`,
          direction: 'row',
          gap: '16px',
          qty: '3',
          showAddButton: false,
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
    }),
    node('Stack', {
      name: 'StackCardRegulated',
      children: [
        node('Stack', {
          name: 'StackCardRegulatedTitle',
          children: [
            node('Icon', {
              name: 'IconCardRegulated',
              padding: '4px',
              widthMode: 'hug',
              color: 'primary',
              icon: 'FileText',
              bgColor: '#F5FAFF',
              borderRadius: '4px',
            }),
            node('Text', {
              name: 'TextCardRegulatedTitle',
              text: 'Регламентований облік',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Repeater', {
          name: 'RepeaterCardRegulated',
          children: [
            node('Text', {
              name: 'TextCardRegulatedLabel',
              text: '{{ currentItem.label }}',
              variant: 'body4-r',
              color: '#A3A8B2',
              margin: '0 0 4px',
            }),
            node('Text', {
              name: 'TextCardRegulatedValue',
              text: '{{ currentItem.value }}',
              variant: 'body4-m',
            }),
          ],
          data: `{{
  regulated.getData()
}}`,
          direction: 'row',
          gap: '16px',
          qty: '3',
          showAddButton: false,
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
    }),
    node('Stack', {
      name: 'StackCardClient',
      children: [
        node('Stack', {
          name: 'StackCardClientTitle',
          children: [
            node('Icon', {
              name: 'IconCardClient',
              padding: '4px',
              widthMode: 'hug',
              color: 'primary',
              icon: 'UserCircle',
              bgColor: '#F5FAFF',
              borderRadius: '4px',
            }),
            node('Text', {
              name: 'TextCardClientTitle',
              text: 'Клієнтська інформація',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Repeater', {
          name: 'RepeaterCardClient',
          children: [
            node('Text', {
              name: 'TextCardClientLabel',
              text: '{{ currentItem.label }}',
              variant: 'body4-r',
              color: '#A3A8B2',
              margin: '0 0 4px',
            }),
            node('Text', {
              name: 'TextCardClientValue',
              text: '{{ currentItem.value }}',
              variant: 'body4-m',
            }),
          ],
          data: `{{
  client.getData()
}}`,
          direction: 'row',
          gap: '16px',
          qty: '3',
          showAddButton: false,
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
    }),
    node('Stack', {
      name: 'StackCardFinance',
      children: [
        node('Stack', {
          name: 'StackCardFinanceTitle',
          children: [
            node('Icon', {
              name: 'IconCardFinance',
              padding: '4px',
              widthMode: 'hug',
              color: 'primary',
              icon: 'Calculator',
              bgColor: '#F5FAFF',
              borderRadius: '4px',
            }),
            node('Text', {
              name: 'TextCardFinanceTitle',
              text: 'Фінансовий облік',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Repeater', {
          name: 'RepeaterCardFinance',
          children: [
            node('Text', {
              name: 'TextCardFinanceLabel',
              text: '{{ currentItem.label }}',
              variant: 'body4-r',
              color: '#A3A8B2',
              margin: '0 0 4px',
            }),
            node('Text', {
              name: 'TextCardFinanceValue',
              text: '{{ currentItem.value }}',
              variant: 'body4-m',
            }),
          ],
          data: `{{
  finance.getData()
}}`,
          direction: 'row',
          gap: '16px',
          qty: '1',
          showAddButton: false,
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
    }),
  ],
  queries: [
    graphqlQuery(
  'getNomenclature',
  `query GetNomenclature($id: String!) {
  nomenclatures: businessmngt_nomenclatures_v0(where: { fcp_id: { _eq: $id } }, limit: 1) {
    fcp_id
    name
    vat_relief
    vat_rate
    unit_of_measure_fcp_id
    tax_benefit_code
    storing_temperature_to
    storing_temperature_from
    sku
    shelf_life
    responsible_manager
    product_fcp_id
    pos_nomenclature_kind
    own_production
    nomenclature_kind
    nomenclature_type_fcp_id
    manufacturer_name
    food_cost_type
    barcode
    code_uktzed_fcp_id
    country_of_origin
    excise_applicable
    nomenclatures_nomenclature_fcp_id_unit_of_measure_multipliers {
      is_active
      multiplier
      unit_of_measure_fcp_id
      unit_of_measure_name
    }
    nomenclatures_code_uktzed_fcp_id_codes_uktzed {
      code
      name
      type
    }
    nomenclatures_nomenclature_type_fcp_id_nomenclature_types {
      name
      meal_type
      nomenclature_kind
    }
    nomenclatures_unit_of_measure_fcp_id_units_of_measure {
      fcp_id
      name
      full_name
      code
    }
    nomenclatures_product_fcp_id_products {
      name
      external
    }
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
  ],
  scripts: [script('constants', constantsCode), script('init', initCode), script('nomenclature', nomenclatureCode), script('breadcrumbs', breadcrumbsCode), script('navigation', navigationCode), script('mainInfo', mainInfoCode), script('storage', storageCode), script('regulated', regulatedCode), script('client', clientCode), script('finance', financeCode)],
});
