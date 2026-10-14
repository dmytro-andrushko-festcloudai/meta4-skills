import { readFileSync } from 'node:fs';

import { analyzeCode, compileFailure } from '../../../../apps/lowcode/src/engine/core/eval/compile';
import { blocks, shapeOf } from '../../../../apps/lowcode/src/runtime/registry/blocks';
import { shapeInfo, slotsOf } from '../../../../apps/lowcode/src/runtime/shape-info';

type PageNode = { props: Record<string, unknown>; type: string };

const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const problems: string[] = [];
const referenced = new Set<string>();
let nodes = 0;
let bindings = 0;

const checkBinding = (value: string, where: string) => {
  for (const match of value.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
    bindings += 1;

    const failure = compileFailure(match[1], 'expression', {});

    if (failure) problems.push(`${where}: binding "${match[1].trim()}" -> ${JSON.stringify(failure)}`);
  }
};

const FIELD_BLOCKS = new Set([
  'Checkbox',
  'CheckboxGroup',
  'DatePicker',
  'Dropzone',
  'Input',
  'MultiSelect',
  'PhoneInput',
  'RadioGroup',
  'Select',
  'Switch',
]);
const SCROLLS = /overflow-y:\s*auto/;

const collectNodes = (value: unknown, out: PageNode[] = []): PageNode[] => {
  if (isNode(value)) {
    out.push(value);
    collectNodes(value.props, out);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectNodes(item, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectNodes(item, out));
  }

  return out;
};

// The right padding in px of a CSS padding shorthand ('8px', '0 32px 0 0', ...); 0 when unset or not in px.
const rightPadding = (padding: string): number => {
  const parts = padding.trim().split(/\s+/).filter(Boolean);
  const right = parts.length === 1 ? parts[0] : parts[1];

  return Number.parseFloat(right ?? '') || 0;
};

// A Modal keeps its header and actions fixed and scrolls only the fields, gotcha 36 in blocks-and-layout.md.
const checkModal = (n: PageNode, where: string) => {
  const { height, maxHeight } = n.props;
  const inner = collectNodes(n.props.children);
  const scrollers = inner.filter((item) => item.type === 'Stack' && SCROLLS.test(String(item.props.customCss ?? '')));
  const top = Array.isArray(n.props.children) ? (n.props.children as PageNode[])[0] : undefined;

  if (height !== '' || !maxHeight) problems.push(`${where}: a Modal needs height '' and a maxHeight such as '90vh'`);

  if (inner.filter((item) => FIELD_BLOCKS.has(item.type)).length >= 3 && scrollers.length === 0) {
    problems.push(`${where}: a Modal with several fields must scroll them in an inner Stack (customCss "overflow-y: auto")`);
  }

  if (top && scrollers.includes(top)) {
    problems.push(`${where}: the top Stack scrolls, so the header and the actions scroll too; scroll only an inner Stack`);
  }

  const title = top ? collectNodes(top).find((item) => item.type === 'Text') : undefined;

  if (title && rightPadding(String(title.props.padding ?? '')) < 32) {
    problems.push(`${where}: the title "${title.props.name}" needs padding: '0 32px 0 0' so it wraps before the close button`);
  }

  const unbreakable = inner.find(
    (item) => item.type === 'Text' && String(item.props.text ?? '').includes('{{') && !/overflow-wrap/.test(String(item.props.customCss ?? ''))
  );

  if (unbreakable) {
    problems.push(`${where}: the bound text "${unbreakable.props.name}" needs customCss "overflow-wrap: anywhere;" so a long name without spaces wraps`);
  }

  if (inner.some((item) => item.type === 'Icon' && item.props.icon === 'X' && /close/i.test(String(item.props.onClick ?? '')))) {
    problems.push(`${where}: the Modal draws its own close button, remove the extra close Icon`);
  }
};

// Every tab's content is one Stack with padding, so it never sits flush under the tab strip (gotcha 10).
const checkTabs = (n: PageNode, where: string) => {
  const tabs = Array.isArray(n.props.tabs) ? (n.props.tabs as Array<{ content?: PageNode[]; label?: string }>) : [];

  tabs.forEach((tab) => {
    const content = Array.isArray(tab.content) ? tab.content : [];

    if (content.length === 0) return;

    const [first] = content;

    if (content.length !== 1 || first.type !== 'Stack' || !String(first.props.padding ?? '').trim()) {
      problems.push(`${where}: tab "${tab.label}" content must be one Stack with padding (for example '8px 0 0')`);
    }
  });
};

const visit = (n: PageNode, path: string) => {
  nodes += 1;

  const shape = shapeOf(n.type);

  if (!shape) return void problems.push(`${path}: unknown block "${n.type}"`);

  const info = shapeInfo(shape);
  const known = new Set(Object.keys(info.defaults));
  const slotInfos = slotsOf(shape);
  // A slot inside an array field (Tabs `tabs[].content`) is keyed by its container.
  const slots = new Set(slotInfos.map((slot) => slot.container ?? slot.key));
  const where = `${path}/${n.type}(${n.props.name})`;

  if (referenced.has(String(n.props.name))) problems.push(`${where}: duplicate name "${n.props.name}"`);

  referenced.add(String(n.props.name));

  if (n.type === 'Modal') checkModal(n, where);

  if (n.type === 'Tabs') checkTabs(n, where);

  for (const key of Object.keys(n.props)) {
    if (key !== 'id' && key !== 'name' && !known.has(key) && !slots.has(key)) problems.push(`${where}: unknown prop "${key}"`);
  }

  for (const key of Object.keys(info.defaults)) {
    if (!(key in n.props) && !slots.has(key)) problems.push(`${where}: missing prop "${key}"`);
  }

  for (const [key, value] of Object.entries(n.props)) {
    if (typeof value === 'string') checkBinding(value, `${where}.${key}`);
  }

  for (const { container, key } of slotInfos) {
    const values = container
      ? (Array.isArray(n.props[container]) ? (n.props[container] as Record<string, unknown>[]) : []).map((item) => item?.[key])
      : [n.props[key]];

    for (const value of values) {
      if (value === undefined) continue;

      if (!Array.isArray(value)) {
        problems.push(`${where}: slot "${container ? `${container}[].` : ''}${key}" is not an array`);
        continue;
      }

      value.forEach((child) => visit(child, `${where}.${key}`));
    }
  }

  for (const [key, value] of Object.entries(n.props)) {
    if (!slots.has(key)) visitEmbedded(value, `${where}.${key}`);
  }
};

const isNode = (value: unknown): value is PageNode =>
  Boolean(value) && typeof value === 'object' && typeof (value as PageNode).type === 'string' && 'props' in (value as object);

const visitEmbedded = (value: unknown, path: string) => {
  if (isNode(value)) visit(value, path);
  else if (Array.isArray(value)) value.forEach((item) => visitEmbedded(item, path));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => visitEmbedded(item, `${path}.${key}`));
};

data.content.forEach((n: PageNode) => visit(n, 'content'));

const root = data.root?.props ?? {};

for (const s of root.scripts ?? []) {
  const failure = compileFailure(s.code, 'statement', { async: false });

  if (failure) problems.push(`script ${s.name}: ${JSON.stringify(failure)}`);
}

for (const m of root.modules ?? []) {
  const failure = compileFailure(m.code, 'statement', { async: false });

  if (failure) problems.push(`module ${m.name}: ${JSON.stringify(failure)}`);
}

for (const q of root.queries ?? []) {
  for (const field of ['endpoint', 'headers', 'variables', 'url', 'body']) {
    if (typeof q[field] === 'string') checkBinding(q[field], `query ${q.name}.${field}`);
  }
}

const defined = new Set<string>([
  ...referenced,
  ...(root.scripts ?? []).map((s: { name: string }) => s.name),
  ...(root.queries ?? []).map((q: { name: string }) => q.name),
  ...(root.modules ?? []).map((m: { name: string }) => m.name),
]);
const blockPrefix = new RegExp(`^(${Object.keys(blocks).join('|')})[A-Za-z0-9]*$`);
const queryCall = /\b([A-Za-z_]\w*)\.(?:run|data|loading|error)\b/g;
// Names the engine provides to every expression and js file, besides the page's own blocks, queries and js files.
const SCOPE_NAMES = new Set(['app', 'computed', 'currentIndex', 'currentItem', 'effect', 'inputs', 'params', 'signal']);
const blockCall =
  /\b([A-Z]\w*)\.(?:value|values|setValue|setValues|reset|valid|dirty|page|pageSize|setPage|open|setOpen|selectedValue|setSelectedValue|selectedRow)\b/g;

// `strict` is off for event handlers: their payload (`id`, `value`, ...) is a free name the page does not declare.
const checkReferences = (code: string, where: string, mode: 'expression' | 'statement', strict = true) => {
  const flag = (pattern: RegExp, kind: string, accept: (name: string) => boolean) => {
    for (const match of code.matchAll(pattern)) {
      if (accept(match[1]) && !defined.has(match[1])) problems.push(`${where}: ${kind} "${match[1]}" is not defined on this page`);
    }
  };

  if (strict) {
    const analyzed = analyzeCode(code, mode, mode === 'statement' ? { async: false } : {});

    if ('refs' in analyzed) {
      for (const name of analyzed.refs) {
        if (!SCOPE_NAMES.has(name) && !defined.has(name)) problems.push(`${where}: "${name}" is not defined on this page`);
      }
    }
  }

  flag(queryCall, 'query', (name) => /^(get|create|update|delete|save|remove|fetch|load)[A-Z]/.test(name));
  flag(blockCall, 'block', (name) => blockPrefix.test(name));
};

const scan = (value: unknown, where: string, key = '') => {
  if (typeof value === 'string' && value.includes('{{')) {
    for (const match of value.matchAll(/\{\{([\s\S]*?)\}\}/g)) checkReferences(match[1], where, 'expression', !/^on[A-Z]/.test(key));
  } else if (Array.isArray(value)) {
    value.forEach((item) => scan(item, where, key));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([name, item]) => scan(item, where, name));
  }
};

scan(data.content, 'content');

for (const s of root.scripts ?? []) checkReferences(s.code, `script ${s.name}`, 'statement');

for (const q of root.queries ?? []) {
  for (const field of ['endpoint', 'headers', 'variables', 'url', 'body']) scan(q[field], `query ${q.name}.${field}`);
}

console.log(`nodes: ${nodes}, bindings: ${bindings}, scripts: ${(root.scripts ?? []).length}, queries: ${(root.queries ?? []).length}`);
console.log(problems.length ? `PROBLEMS (${problems.length}):\n${problems.join('\n')}` : 'no problems');
process.exitCode = problems.length ? 1 : 0;
