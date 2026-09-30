import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsJsCode from './scripts/constantsJs.txt';
import initJsCode from './scripts/initJs.txt';
import nomenclatureJsCode from './scripts/nomenclatureJs.txt';
import breadcrumbsJsCode from './scripts/breadcrumbsJs.txt';
import navigationJsCode from './scripts/navigationJs.txt';
import mainInfoJsCode from './scripts/mainInfoJs.txt';
import storageJsCode from './scripts/storageJs.txt';
import regulatedJsCode from './scripts/regulatedJs.txt';
import clientJsCode from './scripts/clientJs.txt';
import financeJsCode from './scripts/financeJs.txt';

export default page({
  content: [
    node('Breadcrumbs', {
      name: 'BreadcrumbsNomenclature',
      forwardDisabled: true,
      items: `{{
  breadcrumbsJs.getBreadcrumbs()
}}`,
      onBack: `{{
  navigationJs.goToList()
}}`,
      onNavigate: `{{
  breadcrumbsJs.onNavigate(id)
}}`,
    }),
    node('Stack', {
      name: 'StackHeader',
      children: [
        node('Text', {
          name: 'TextTitle',
          text: `{{
  nomenclatureJs.getItem()?.name || ''
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
  !nomenclatureJs.getItem()
}}`,
              onClick: `{{
  navigationJs.goToEdit()
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
  navigationJs.isFromCreate()
}}`,
            }),
            node('Button', {
              name: 'ButtonBack',
              widthMode: 'hug',
              onClick: `{{
  navigationJs.goToList()
}}`,
              text: 'Повернутись до товарів',
              variant: 'outlined',
              visible: `{{
  navigationJs.isFromCreate()
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
  mainInfoJs.getData()
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
  storageJs.getData()
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
  regulatedJs.getData()
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
  clientJs.getData()
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
  financeJs.getData()
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
  scripts: [script('constantsJs', constantsJsCode), script('initJs', initJsCode), script('nomenclatureJs', nomenclatureJsCode), script('breadcrumbsJs', breadcrumbsJsCode), script('navigationJs', navigationJsCode), script('mainInfoJs', mainInfoJsCode), script('storageJs', storageJsCode), script('regulatedJs', regulatedJsCode), script('clientJs', clientJsCode), script('financeJs', financeJsCode)],
});
