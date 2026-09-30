import { graphqlQuery, node, page, script } from '../../scripts/builder';
import constantsJsCode from './scripts/constantsJs.txt';
import initJsCode from './scripts/initJs.txt';
import breadcrumbsJsCode from './scripts/breadcrumbsJs.txt';
import optionsJsCode from './scripts/optionsJs.txt';
import formJsCode from './scripts/formJs.txt';

export default page({
  content: [
    node('Breadcrumbs', {
      name: 'BreadcrumbsForm',
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
    node('Stack', {
      name: 'StackHeader',
      children: [
        node('Text', {
          name: 'TextTitle',
          verticalAlign: 'center',
          text: `{{
  initJs.id ? 'Редагування товару' : 'Створення товару'
}}`,
          variant: 'heading2-m',
        }),
        node('Button', {
          name: 'ButtonSubmit',
          verticalAlign: 'center',
          widthMode: 'hug',
          disabled: `{{
  formJs.isSubmitDisabled() || formJs.isSubmitting
}}`,
          onClick: `{{
  formJs.onSubmit()
}}`,
          text: `{{
  initJs.id ? 'Зберегти' : 'Створити товар'
}}`,
          size: 'lg',
        }),
      ],
      margin: '4px 0 14px',
      verticalAlign: 'center',
      direction: 'row',
      gap: '16px',
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
              bgColor: '#F5FAFF',
              borderRadius: '4px',
              color: 'primary',
              icon: 'Info',
            }),
            node('Text', {
              name: 'TextCardMainTitle',
              verticalAlign: 'center',
              text: 'Основна інформація',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Stack', {
          name: 'StackMainSku',
          children: [
            node('Input', {
              name: 'InputSku',
              defaultValue: `{{
  formJs.getItem()?.sku ?? ''
}}`,
              description: 'Цей код автоматично генерується для цього продукту, щоб унікально ідентифікувати його в системі',
              label: 'SKU',
              placeholder: 'Згенерується автоматично',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Stack', {
          name: 'StackMainName',
          children: [
            node('Input', {
              name: 'InputName',
              defaultValid: `{{
  formJs.notBlank(InputName)
}}`,
              required: true,
              validationMessage: 'Обов\'язкове поле',
              marker: true,
              defaultValue: `{{
  formJs.getItem()?.name ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Назва продукту',
              placeholder: 'Молоко ультрапастеризоване 2,5%',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Stack', {
          name: 'StackMainManufacturer',
          children: [
            node('Input', {
              name: 'InputManufacturer',
              defaultValue: `{{
  formJs.getItem()?.manufacturer_name ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Виробник',
              placeholder: 'Оберіть виробника',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Stack', {
          name: 'StackMainCountry',
          children: [
            node('Input', {
              name: 'InputCountry',
              defaultValue: `{{
  formJs.getItem()?.country_of_origin ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Країна походження',
              placeholder: 'Введіть країну',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
      gap: '16px',
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
              bgColor: '#F5FAFF',
              borderRadius: '4px',
              color: 'primary',
              icon: 'Thermometer',
            }),
            node('Text', {
              name: 'TextCardStorageTitle',
              verticalAlign: 'center',
              text: 'Інформація про зберігання',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Stack', {
          name: 'StackStorageBarcode',
          children: [
            node('Input', {
              name: 'InputBarcode',
              defaultValue: `{{
  formJs.getItem()?.barcode ?? ''
}}`,
              description: 'Цей код автоматично генерується для цього продукту, щоб унікально ідентифікувати його в системі',
              label: 'Штрих код',
              placeholder: 'Згенерується автоматично',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Stack', {
          name: 'StackStorageUnit',
          children: [
            node('Select', {
              name: 'SelectUnit',
              required: true,
              marker: true,
              defaultValue: `{{
  formJs.getItem()?.unit_of_measure_fcp_id ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Одиниці виміру',
              options: `{{
  optionsJs.getUnitOptions()
}}`,
              placeholder: 'Оберіть одиницю виміру',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Stack', {
          name: 'StackStorageTerms',
          children: [
            node('Input', {
              name: 'InputShelfLife',
              defaultValue: `{{
  formJs.getItem()?.shelf_life ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Термін придатності',
              placeholder: '12 місяців',
            }),
            node('Input', {
              name: 'InputTemperatureFrom',
              defaultValue: `{{
  formJs.getItem()?.storing_temperature_from ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Температура зберігання від',
              placeholder: '0 (°C)',
            }),
            node('Input', {
              name: 'InputTemperatureTo',
              defaultValue: `{{
  formJs.getItem()?.storing_temperature_to ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Температура зберігання до',
              placeholder: '0 (°C)',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
      gap: '16px',
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
              bgColor: '#F5FAFF',
              borderRadius: '4px',
              color: 'primary',
              icon: 'FileText',
            }),
            node('Text', {
              name: 'TextCardRegulatedTitle',
              verticalAlign: 'center',
              text: 'Регламентований облік',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Stack', {
          name: 'StackRegulatedCodes',
          children: [
            node('Select', {
              name: 'SelectUktzed',
              defaultValue: `{{
  formJs.getItem()?.code_uktzed_fcp_id ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Код УКТЗЕД',
              options: `{{
  optionsJs.getUktzedOptions()
}}`,
              placeholder: '0401201100',
            }),
            node('Select', {
              name: 'SelectVatRate',
              defaultValue: `{{
  formJs.getItem()?.vat_rate ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Ставка ПДВ',
              options: `{{
  optionsJs.getVatRateOptions()
}}`,
              placeholder: 'Оберіть ставку ПДВ',
            }),
            node('Input', {
              name: 'InputVatRelief',
              defaultValue: `{{
  formJs.getItem()?.vat_relief ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Пільга по ПДВ',
              placeholder: 'Код або опис пільги',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Checkbox', {
          name: 'CheckboxExcise',
          defaultValue: `{{
  Boolean(formJs.getItem()?.excise_applicable)
}}`,
          disabled: `{{
  formJs.isSubmitting
}}`,
          label: 'Акцизний товар',
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
      gap: '16px',
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
              bgColor: '#F5FAFF',
              borderRadius: '4px',
              color: 'primary',
              icon: 'UserCircle',
            }),
            node('Text', {
              name: 'TextCardClientTitle',
              verticalAlign: 'center',
              text: 'Клієнтська інформація',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Stack', {
          name: 'StackClientFields',
          children: [
            node('Input', {
              name: 'InputKind',
              defaultValue: `{{
  formJs.getItem()?.nomenclature_kind ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Вид номенклатури',
              placeholder: 'Введіть вид номенклатури',
            }),
            node('Input', {
              name: 'InputPosKind',
              defaultValue: `{{
  formJs.getItem()?.pos_nomenclature_kind ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Вид номенклатури для ФКА',
              placeholder: 'Введіть вид номенклатури для ФКА',
            }),
            node('Input', {
              name: 'InputFoodCost',
              defaultValue: `{{
  formJs.getItem()?.food_cost_type ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Фудкост',
              placeholder: '35.50',
            }),
            node('Select', {
              name: 'SelectType',
              defaultValue: `{{
  formJs.getItem()?.nomenclature_type_fcp_id ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Тип номенклатури',
              options: `{{
  optionsJs.getTypeOptions()
}}`,
              placeholder: 'Оберіть тип номенклатури',
            }),
            node('Input', {
              name: 'InputManager',
              defaultValue: `{{
  formJs.getItem()?.responsible_manager ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Відповідальний менеджер',
              placeholder: 'Оберіть менеджера',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
        node('Checkbox', {
          name: 'CheckboxOwnProduction',
          defaultValue: `{{
  Boolean(formJs.getItem()?.own_production)
}}`,
          disabled: `{{
  formJs.isSubmitting
}}`,
          label: 'Продукція власного виробництва',
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
      gap: '16px',
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
              bgColor: '#F5FAFF',
              borderRadius: '4px',
              color: 'primary',
              icon: 'Calculator',
            }),
            node('Text', {
              name: 'TextCardFinanceTitle',
              verticalAlign: 'center',
              text: 'Фінансовий облік',
              variant: 'heading4-m',
            }),
          ],
          verticalAlign: 'center',
          direction: 'row',
          gap: '6px',
        }),
        node('Stack', {
          name: 'StackFinanceFields',
          children: [
            node('Select', {
              name: 'SelectTaxBenefit',
              defaultValue: `{{
  formJs.getItem()?.tax_benefit_code ?? ''
}}`,
              disabled: `{{
  formJs.isSubmitting
}}`,
              label: 'Код додаткової пільги',
              options: `{{
  optionsJs.getTaxBenefitOptions()
}}`,
              placeholder: '101',
            }),
          ],
          customCss: `& > div {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}`,
          direction: 'row',
          gap: '16px',
        }),
      ],
      margin: '0 0 12px',
      padding: '20px',
      bgColor: '#ffffff',
      borderColor: '#E3E5E8',
      borderRadius: '12px',
      gap: '16px',
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
  }
}`,
  { runOnPageLoad: false, variables: `{{
  {
    ...params
  }
}}` }
),
    graphqlQuery(
  'getDictionaries',
  `query GetNomenclatureDictionaries {
  units: businessmngt_units_of_measure_v0(order_by: { full_name: asc }) {
    fcp_id
    name
    full_name
  }
  uktzed: businessmngt_codes_uktzed_v0(order_by: { code: asc }) {
    fcp_id
    code
    name
  }
  types: businessmngt_nomenclature_types_v0(order_by: { name: asc }) {
    fcp_id
    name
  }
  taxBenefits: businessmngt_nomenclatures_v0(
    where: { tax_benefit_code: { _is_null: false } }
    distinct_on: tax_benefit_code
    order_by: { tax_benefit_code: asc }
  ) {
    tax_benefit_code
  }
}`,
  {  }
),
    graphqlQuery(
  'createNomenclature',
  `mutation CreateNomenclature($object: businessmngt_nomenclatures_v0_insert_input!) {
  nomenclature: insert_businessmngt_nomenclatures_v0_one(object: $object) {
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
  'updateNomenclature',
  `mutation UpdateNomenclature($id: String!, $object: businessmngt_nomenclatures_v0_set_input!) {
  nomenclature: update_businessmngt_nomenclatures_v0_by_pk(pk_columns: { fcp_id: $id }, _set: $object) {
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
  scripts: [script('constantsJs', constantsJsCode), script('initJs', initJsCode), script('breadcrumbsJs', breadcrumbsJsCode), script('optionsJs', optionsJsCode), script('formJs', formJsCode)],
});
