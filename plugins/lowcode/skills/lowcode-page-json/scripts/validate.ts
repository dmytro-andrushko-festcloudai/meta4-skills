import { readFileSync } from 'node:fs';

import { compileFailure } from '../../../../apps/lowcode/src/engine/core/eval/compile';
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

const visit = (n: PageNode, path: string) => {
  nodes += 1;

  const shape = shapeOf(n.type);

  if (!shape) return void problems.push(`${path}: unknown block "${n.type}"`);

  const info = shapeInfo(shape);
  const known = new Set(Object.keys(info.defaults));
  const slots = new Set(slotsOf(shape));
  const where = `${path}/${n.type}(${n.props.name})`;

  if (referenced.has(String(n.props.name))) problems.push(`${where}: duplicate name "${n.props.name}"`);

  referenced.add(String(n.props.name));

  for (const key of Object.keys(n.props)) {
    if (key !== 'id' && key !== 'name' && !known.has(key) && !slots.has(key)) problems.push(`${where}: unknown prop "${key}"`);
  }

  for (const key of Object.keys(info.defaults)) {
    if (!(key in n.props) && !slots.has(key)) problems.push(`${where}: missing prop "${key}"`);
  }

  for (const [key, value] of Object.entries(n.props)) {
    if (typeof value === 'string') checkBinding(value, `${where}.${key}`);
  }

  for (const key of slots) {
    const value = n.props[key];

    if (value === undefined) continue;

    if (!Array.isArray(value)) {
      problems.push(`${where}: slot "${key}" is not an array`);
      continue;
    }

    value.forEach((child) => visit(child, `${where}.${key}`));
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
]);
const blockPrefix = new RegExp(`^(${Object.keys(blocks).join('|')})[A-Za-z0-9]*$`);
const queryCall = /\b([A-Za-z_]\w*)\.(?:run|data|loading|error)\b/g;
const scriptCall = /\b([A-Za-z_]\w*Js)\./g;
const blockCall =
  /\b([A-Z]\w*)\.(?:value|values|setValue|setValues|reset|valid|dirty|page|pageSize|setPage|open|setOpen|selectedValue|setSelectedValue|selectedRow)\b/g;

const checkReferences = (code: string, where: string) => {
  const flag = (pattern: RegExp, kind: string, accept: (name: string) => boolean) => {
    for (const match of code.matchAll(pattern)) {
      if (accept(match[1]) && !defined.has(match[1])) problems.push(`${where}: ${kind} "${match[1]}" is not defined on this page`);
    }
  };

  flag(scriptCall, 'script', () => true);
  flag(queryCall, 'query', (name) => /^(get|create|update|delete|save|remove|fetch|load)[A-Z]/.test(name));
  flag(blockCall, 'block', (name) => blockPrefix.test(name));
};

const scan = (value: unknown, where: string) => {
  if (typeof value === 'string' && value.includes('{{')) {
    for (const match of value.matchAll(/\{\{([\s\S]*?)\}\}/g)) checkReferences(match[1], where);
  } else if (Array.isArray(value)) {
    value.forEach((item) => scan(item, where));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => scan(item, where));
  }
};

scan(data.content, 'content');

for (const s of root.scripts ?? []) checkReferences(s.code, `script ${s.name}`);

for (const q of root.queries ?? []) {
  for (const field of ['endpoint', 'headers', 'variables', 'url', 'body']) scan(q[field], `query ${q.name}.${field}`);
}

console.log(`nodes: ${nodes}, bindings: ${bindings}, scripts: ${(root.scripts ?? []).length}, queries: ${(root.queries ?? []).length}`);
console.log(problems.length ? `PROBLEMS (${problems.length}):\n${problems.join('\n')}` : 'no problems');
process.exitCode = problems.length ? 1 : 0;
