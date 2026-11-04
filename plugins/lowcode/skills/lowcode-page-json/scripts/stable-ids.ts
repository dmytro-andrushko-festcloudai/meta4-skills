type Json = Record<string, any>;

const isNode = (value: Json) => typeof value.type === 'string' && value.props?.id && value.props?.name;

const walk = (value: unknown, visit: (node: Json) => void) => {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, visit));

  if (!value || typeof value !== 'object') return;

  if (isNode(value as Json)) visit(value as Json);

  Object.values(value).forEach((item) => walk(item, visit));
};

/**
 * Copies the ids of an already written page onto a freshly built one, so rebuilding a page from its
 * `page.ts` does not rename its nodes. A block is matched by type and name, a query, script, module and
 * folder by name; anything with no match is new and keeps the id the builder minted. Folder ids are
 * rewritten in the `folderId` of the queries and scripts that point at them.
 */
export const keepIds = (next: Json, previous: Json | null): Json => {
  if (!previous) return next;

  const blocks = new Map<string, string>();

  walk(previous.content, (node) => blocks.set(`${node.type}:${node.props.name}`, node.props.id));
  walk(next.content, (node) => {
    const known = blocks.get(`${node.type}:${node.props.name}`);

    if (known) node.props.id = known;
  });

  const before = previous.root?.props ?? {};
  const props = next.root.props;
  const folders = new Map<string, string>();

  for (const folder of props.folders ?? []) {
    const known = (before.folders ?? []).find((item: Json) => item.name === folder.name);

    if (known) {
      folders.set(folder.id, known.id);
      folder.id = known.id;
    }
  }

  for (const key of ['queries', 'scripts', 'modules']) {
    const known = new Map<string, string>((before[key] ?? []).map((item: Json) => [item.name, item.id]));

    for (const item of props[key] ?? []) {
      if (known.has(item.name)) item.id = known.get(item.name);

      if (item.folderId && folders.has(item.folderId)) item.folderId = folders.get(item.folderId);
    }
  }

  return next;
};
