import { fixed, hug, icon, node, type Props, page, script, stack, text, v } from '../scripts/builder';
import vacanciesScript from './vacancies.script.txt';

const panel: Props = {
  bgColor: v('base-white'),
  borderColor: v('secondary-light_hover'),
  borderRadius: '8px',
  padding: '19px',
};

const balanceCard = (key: 'sick' | 'vacation') => {
  const data = `vacanciesJs.balances.${key}`;
  const dot = (token: string) =>
    stack({ ...fixed('12px', '12px'), bgColor: v(token), borderRadius: '50%', customCss: 'min-height: 0;' });
  const arcToken = key === 'sick' ? 'error-hover' : 'primary-hover';
  const trackToken = key === 'sick' ? 'error-light_hover' : 'primary-light_focus';
  const legendRow = (token: string, label: string, valueKey: string) =>
    stack({ direction: 'row', gap: '8px', verticalAlign: 'center', widthMode: 'hug' }, [
      dot(token),
      text(label, 'body4-r', 'text-placeholder', fixed('92px')),
      text(`{{ ${data}.${valueKey} }}`, 'body4-m', 'text-label', fixed('60px')),
    ]);

  return stack({ ...panel, ...fixed('0', '228px'), widthMode: 'fill', gap: '12px' }, [
    stack({ direction: 'row', gap: '12px', verticalAlign: 'center' }, [
      text(`{{ ${data}.title }}`, 'body4-sb', 'text-title'),
      icon('Info', hug),
    ]),
    stack({ horizontalAlign: 'center' }, [
      stack({ ...fixed('100px', '100px'), customCss: 'position: relative;' }, [
        node('Image', { src: `{{ ${data}.ring }}`, size: '100', fit: 'contain', widthMode: 'hug' }),
        stack(
          {
            ...fixed('100px', '100px'),
            customCss: 'position: absolute; top: 0; left: 0; pointer-events: none;',
            gap: '0px',
            horizontalAlign: 'center',
            verticalAlign: 'center',
          },
          [
            text(`{{ ${data}.remaining }}`, 'body1-sb', 'text-label', { ...hug, customCss: 'text-align: center;' }),
            text('Доступно', 'body6-r', 'text-placeholder', { ...hug, customCss: 'text-align: center;' }),
          ]
        ),
      ]),
    ]),
    stack({ gap: '4px', horizontalAlign: 'center' }, [
      legendRow(arcToken, 'Використано:', 'usedText'),
      legendRow(trackToken, 'Залишилося:', 'remainingText'),
    ]),
  ]);
};

const listPanel = (title: string, rows: Node) =>
  stack({ ...panel, ...fixed('0', '228px'), widthMode: 'fill', gap: '12px' }, [
    text(title, 'body4-sb', 'text-title'),
    stack({ gap: '20px', horizontalAlign: 'center' }, [
      rows,
      node('Button', { text: 'Дивитись усі', variant: 'text', size: 'sm', ...hug }),
    ]),
  ]);

const rowsRepeater = (data: string, item: Node[]) =>
  node('Repeater', { data: `{{ ${data} }}`, direction: 'column', gap: '12px', showAddButton: false, children: item });

const details = (title: string, caption: string) =>
  stack({ gap: '4px', verticalAlign: 'center' }, [
    text(title, 'body5-m', 'text-label'),
    text(caption, 'body6-r', 'text-tertiary'),
  ]);

const upcomingLeaves = listPanel(
  'Найближчі відпустки',
  rowsRepeater('vacanciesJs.upcomingLeaves', [
    stack({ direction: 'row', gap: '12px', verticalAlign: 'center' }, [
      node('Image', { src: '', fallback: '{{ currentItem.fallback }}', size: '48', radius: '6px', widthMode: 'hug' }),
      details('{{ currentItem.name }}', '{{ currentItem.dates }}'),
    ]),
  ])
);

const holidays = listPanel(
  'Найближчі вихідні',
  rowsRepeater('vacanciesJs.holidays', [
    stack({ direction: 'row', gap: '12px', verticalAlign: 'center' }, [
      stack(
        {
          ...fixed('48px', '48px'),
          bgColor: v('base-white'),
          borderColor: v('secondary-light_hover'),
          borderRadius: '6px',
          gap: '0px',
          horizontalAlign: 'center',
          verticalAlign: 'center',
        },
        [
          text('{{ currentItem.day }}', 'body4-sb', 'text-title', hug),
          text('{{ currentItem.month }}', 'overline3-sb', 'text-secondary', {
            ...hug,
            customCss: 'letter-spacing: 0.6px;',
          }),
        ]
      ),
      details('{{ currentItem.title }}', '{{ currentItem.weekday }}'),
    ]),
  ])
);

const field = (label: string, value: string) =>
  stack({ direction: 'row', gap: '8px', widthMode: 'hug' }, [
    text(label, 'body4-r', 'text-placeholder', hug),
    text(value, 'body4-m', 'text-label', hug),
  ]);

const requestRow = stack(
  { ...panel, direction: 'row', gap: '12px', verticalAlign: 'start' },
  [
    stack({ direction: 'row', gap: '24px', verticalAlign: 'start' }, [
      stack({ ...fixed('304px'), direction: 'row', gap: '12px', verticalAlign: 'center' }, [
        stack(
          {
            ...fixed('44px', '44px'),
            bgColor: '{{ currentItem.tileBg }}',
            borderColor: '{{ currentItem.tileBorder }}',
            borderRadius: '4px',
            horizontalAlign: 'center',
            verticalAlign: 'center',
          },
          [icon('{{ currentItem.icon }}', { color: '{{ currentItem.iconColor }}', ...hug })]
        ),
        stack({ gap: '4px', widthMode: 'hug', verticalAlign: 'center' }, [
          stack({ direction: 'row', gap: '8px', verticalAlign: 'center', widthMode: 'hug' }, [
            text('{{ currentItem.title }}', 'body4-sb', 'text-title', hug),
            node('Badge', { text: 'Підтверджено', color: 'success', dot: true, size: 'md', ...hug }),
          ]),
          text('{{ currentItem.subtype }}', 'body5-r', 'text-placeholder', {
            ...hug,
            visible: '{{ !!currentItem.subtype }}',
          }),
        ]),
      ]),
      stack({ direction: 'row', gap: '24px', verticalAlign: 'start' }, [
        stack({ ...fixed('240px'), gap: '4px', verticalAlign: 'center' }, [
          field('Початок:', '{{ currentItem.start }}'),
          field('Кінець:', '{{ currentItem.end }}'),
        ]),
        stack({ ...fixed('300px'), gap: '4px', verticalAlign: 'center' }, [
          field('Кадровик:', '{{ currentItem.hr }}'),
          field('Менеджер:', '{{ currentItem.manager }}'),
        ]),
      ]),
    ]),
    icon('Info', hug),
  ]
);

const iconAction = (name: string) =>
  icon(name, {
    ...hug,
    bgColor: v('base-white'),
    borderColor: v('secondary-light_default'),
    borderRadius: '6px',
    padding: '7px',
  });

const content = stack({ gap: '14px' }, [
  stack({ direction: 'row', gap: '12px', verticalAlign: 'start' }, [
    text('Відсутності', 'heading2-m', 'text-title', { padding: '4px 0 0' }),
    node('Button', {
      text: 'Календар відпусток',
      variant: 'outlined',
      startIcon: 'CalendarBlank',
      size: 'lg',
      ...hug,
    }),
    node('Button', { text: 'Подати запит', variant: 'contained', endIcon: 'CaretDown', size: 'lg', ...hug }),
  ]),
  stack({ gap: '16px' }, [
    stack({ direction: 'row', gap: '8px' }, [balanceCard('vacation'), balanceCard('sick'), upcomingLeaves, holidays]),
    stack({ gap: '12px' }, [
      stack({ direction: 'row', gap: '8px', verticalAlign: 'center' }, [
        text('Мої запити', 'heading4-m', 'text-title'),
        iconAction('MagnifyingGlass'),
        iconAction('Funnel'),
      ]),
      node('Repeater', {
        data: '{{ vacanciesJs.requests }}',
        direction: 'column',
        gap: '4px',
        showAddButton: false,
        children: [requestRow],
      }),
    ]),
  ]),
]);

export default page({
  content: [content],
  scripts: [script('vacanciesJs', vacanciesScript)],
});
