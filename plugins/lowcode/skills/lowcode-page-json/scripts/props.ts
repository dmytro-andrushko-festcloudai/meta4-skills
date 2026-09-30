import { shapeOf } from '../../../../apps/lowcode/src/runtime/registry/blocks';
import { shapeInfo, slotsOf } from '../../../../apps/lowcode/src/runtime/shape-info';

const type = process.argv[2];
const shape = type ? shapeOf(type) : undefined;

if (!shape) {
  console.error(`Unknown block "${type}". Block folders are in apps/lowcode/src/blocks/ (PascalCase type, e.g. Stack, Text, Table).`);
  process.exit(1);
}

const info = shapeInfo(shape);

console.log(JSON.stringify({ type, slots: slotsOf(shape), methods: info.methods.map(([name]) => name), props: info.defaults }, null, 2));
