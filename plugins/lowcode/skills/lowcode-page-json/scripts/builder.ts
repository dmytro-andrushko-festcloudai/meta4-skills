import { randomUUID } from 'node:crypto';

import { shapeOf } from '../../../../apps/lowcode/src/runtime/registry/blocks';
import { withDefaults } from '../../../../apps/lowcode/src/runtime/shape-info';

export type Node = { props: Record<string, unknown>; type: string };
export type Props = Record<string, unknown>;

export type Script = { code: string; folderId?: string; name: string };
export type Module = { code: string; name: string };
export type Query = {
  body?: string;
  endpoint?: string;
  folderId?: string;
  headers: string;
  kind: 'graphql' | 'rest';
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  name: string;
  operation?: 'mutation' | 'query' | 'subscription';
  query?: string;
  runOnPageLoad: boolean;
  url?: string;
  variables?: string;
};

const counters: Record<string, number> = {};
const folderIds = new Map<string, string>();

/** Id of the code-panel folder with this name, created on first use. Folders are flat and shared by scripts and queries. */
export const folderId = (name: string): string => {
  const known = folderIds.get(name);

  if (known) return known;

  const id = randomUUID();

  folderIds.set(name, id);

  return id;
};

export const v = (token: string) => `var(--color-${token})`;

export const node = (type: string, props: Props = {}): Node => {
  const shape = shapeOf(type);

  if (!shape) throw new Error(`Unknown block "${type}"`);

  counters[type] = (counters[type] ?? 0) + 1;

  const { name, ...rest } = props;

  return {
    type,
    props: { ...withDefaults(rest, shape), id: `${type}-${randomUUID()}`, name: name ?? `${type}${counters[type]}` },
  };
};

export const stack = (props: Props, children: Node[] = []) => node('Stack', { children, ...props });

export const text = (value: string, variant: string, color: string, props: Props = {}) =>
  node('Text', { text: value, variant, color: v(color), ...props });

export const icon = (name: string, props: Props = {}) => node('Icon', { icon: name, ...props });

export const button = (label: string, props: Props = {}) => node('Button', { text: label, ...props });

export const hug: Props = { widthMode: 'hug' };

export const fixed = (width: string, height?: string): Props => ({
  widthMode: 'fixed',
  width,
  ...(height ? { heightMode: 'fixed', height } : {}),
});

export const graphqlQuery = (
  name: string,
  query: string,
  options: { folder?: string; runOnPageLoad?: boolean; variables?: string } = {}
): Query & { id: string } => ({
  id: randomUUID(),
  ...(options.folder ? { folderId: folderId(options.folder) } : {}),
  kind: 'graphql',
  name,
  endpoint: '{{ constantsJs.GRAPHQL_URL }}',
  operation: query.trimStart().startsWith('mutation') ? 'mutation' : 'query',
  query,
  variables: options.variables ?? '{}',
  headers: '{{ { "Authorization": `Bearer ${app.token}` } }}',
  runOnPageLoad: options.runOnPageLoad ?? true,
});

export const script = (name: string, code: string, folder?: string): Script & { id: string } => ({
  id: randomUUID(),
  name,
  code,
  ...(folder ? { folderId: folderId(folder) } : {}),
});

export const page = (parts: {
  content: Node[];
  modules?: Module[];
  queries?: Array<Query & { id: string }>;
  scripts?: Array<Script & { id: string }>;
}) => ({
  root: {
    props: {
      queries: parts.queries ?? [],
      modules: parts.modules ?? [],
      scripts: parts.scripts ?? [],
      ...(folderIds.size > 0 ? { folders: [...folderIds].map(([name, id]) => ({ id, name })) } : {}),
    },
  },
  content: parts.content,
  zones: {},
});
