import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const require = createRequire(path.join(root, 'package.json'));
const esbuild = require('esbuild');
const tsconfig = path.join(root, 'apps/lowcode/tsconfig.app.json');
const loaders = { '.svg': 'dataurl', '.png': 'dataurl', '.txt': 'text', '.webp': 'dataurl' };
const work = path.join(tmpdir(), 'lowcode-page-json');
const usage = `usage:
  node tool.mjs build <page.ts> <out.json>
  node tool.mjs validate <page.json>
  node tool.mjs app <name> <viewsDir> [--out apps/lowcode/src/pages]
    build + validate every <viewsDir>/<view>/page.ts into <out>/<name>/schemas/<view>.json,
    create the schemas index and view wrapper if missing, print the routes to register
  node tool.mjs props <BlockType>
  node tool.mjs render <route | page.json> <out.png> [--width 1232] [--height 1000] [--token <jwt>]
    a .json argument renders that page directly, no route registration needed`;

const bundleNode = async (options) => {
  mkdirSync(work, { recursive: true });

  const outfile = path.join(work, `${path.basename(options.name)}.cjs`);

  await esbuild.build({
    ...options.build,
    bundle: true,
    format: 'cjs',
    loader: loaders,
    logLevel: 'error',
    outfile,
    platform: 'node',
    tsconfig,
  });

  return outfile;
};

const run = (file, args) => {
  const result = spawnSync(process.execPath, [file, ...args], { stdio: 'inherit' });

  process.exitCode = result.status ?? 1;
};

const runSync = (file, args) => spawnSync(process.execPath, [file, ...args], { stdio: 'inherit' }).status ?? 1;

const buildPage = async (entry, out) => {
  const outfile = await bundleNode({
    name: 'build',
    build: {
      stdin: {
        contents: `import page from ${JSON.stringify(path.resolve(entry))};
            import { writeFileSync } from 'node:fs';
            writeFileSync(process.argv[2], JSON.stringify(page, null, 2) + '\\n');
            console.log('written', process.argv[2]);`,
        loader: 'ts',
        resolveDir: root,
      },
    },
  });

  return runSync(outfile, [path.resolve(out)]);
};

const validatePage = async (file) => {
  const outfile = await bundleNode({ name: 'validate', build: { entryPoints: [path.join(here, 'validate.ts')] } });

  return runSync(outfile, [path.resolve(file)]);
};

const pascal = (name) => name.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
const camel = (name) => pascal(name).replace(/^\w/, (c) => c.toLowerCase());

const routesOf = (name, view) => {
  const base = `/${name}`;
  const known = {
    list: [base],
    form: [`${base}/create`, `${base}/:id/edit`],
    create: [`${base}/create`],
    edit: [`${base}/:id/edit`],
    preview: [`${base}/:id`],
  };

  return known[view] ?? [`${base}/${view}`];
};

const commands = {
  async build([entry, out]) {
    if (!entry || !out) throw new Error(usage);

    process.exitCode = await buildPage(entry, out);
  },

  async validate([file]) {
    if (!file) throw new Error(usage);

    process.exitCode = await validatePage(file);
  },

  async app([name, viewsDir, ...rest]) {
    if (!name || !viewsDir) throw new Error(usage);

    const outFlag = rest.indexOf('--out');
    const pagesDir = path.resolve(root, outFlag === -1 ? 'apps/lowcode/src/pages' : rest[outFlag + 1]);
    const appDir = path.join(pagesDir, name);
    const schemasDir = path.join(appDir, 'schemas');
    const views = readdirSync(viewsDir).filter((v) => existsSync(path.join(viewsDir, v, 'page.ts')));

    if (views.length === 0) throw new Error(`no <view>/page.ts found in ${viewsDir}`);

    mkdirSync(schemasDir, { recursive: true });

    const failed = [];

    for (const view of views) {
      const out = path.join(schemasDir, `${view}.json`);

      if ((await buildPage(path.join(viewsDir, view, 'page.ts'), out)) !== 0 || (await validatePage(out)) !== 0) {
        failed.push(view);
      }
    }

    if (failed.length > 0) throw new Error(`fix and re-run, invalid views: ${failed.join(', ')}`);

    const Name = pascal(name);
    const schemas = `${camel(name)}Schemas`;
    const indexFile = path.join(schemasDir, 'index.ts');
    const wrapperFile = path.join(appDir, `${Name}.tsx`);

    if (!existsSync(indexFile)) {
      const imports = views.map((v) => `import ${camel(v)}Schema from './${v}.json';`).join('\n');
      const entries = views.map((v) => `  ${camel(v)}: ${camel(v)}Schema as unknown as Data,`).join('\n');

      writeFileSync(
        indexFile,
        `import { type Data } from '@puckeditor/core';\n\n${imports}\n\nexport const ${schemas} = {\n${entries}\n};\n\nexport type ${Name}View = keyof typeof ${schemas};\n`
      );
    }

    if (!existsSync(wrapperFile)) {
      writeFileSync(
        wrapperFile,
        `import { useParams } from 'react-router';\n\nimport { JsonView } from '../json-view/JsonView';\nimport { ${schemas}, type ${Name}View } from './schemas';\n\ntype ${Name}Props = {\n  view: ${Name}View;\n};\n\nexport const ${Name} = ({ view }: ${Name}Props) => {\n  const { id } = useParams();\n\n  return <JsonView data={${schemas}[view]} viewKey={\`${name}:\${view}:\${id ?? ''}\`} />;\n};\n`
      );
    }

    const routes = views.flatMap((v) => routesOf(name, v).map((r) => `    { path: '${r}', element: <${Name} view='${camel(v)}' /> },`));

    console.log(`\nbuilt ${views.length} views into ${path.relative(root, schemasDir)}`);
    console.log(`add to apps/lowcode/src/app/router.tsx:\n`);
    console.log(`const ${Name} = lazy(() => import('../pages/${name}/${Name}').then((m) => ({ default: m.${Name} })));\n`);
    console.log(routes.join('\n'));
  },

  async props([type]) {
    if (!type) throw new Error(usage);

    const outfile = await bundleNode({ name: 'props', build: { entryPoints: [path.join(here, 'props.ts')] } });

    run(outfile, [type]);
  },

  async render([route, out, ...rest]) {
    if (!route || !out) throw new Error(usage);

    const flag = (name, fallback) => {
      const index = rest.indexOf(`--${name}`);

      return index === -1 ? fallback : rest[index + 1];
    };
    const dist = path.join(work, 'harness');
    const jsonMode = route.endsWith('.json');
    const emptyPage = path.join(work, 'empty-page.json');

    rmSync(dist, { force: true, recursive: true });
    mkdirSync(dist, { recursive: true });
    writeFileSync(emptyPage, '{}');

    await esbuild.build({
      banner: { js: "globalThis.process=globalThis.process||{env:{NODE_ENV:'development'}};" },
      bundle: true,
      define: {
        'process.env.NODE_ENV': '"development"',
        __JSON_MODE__: String(jsonMode),
        __ROUTE__: JSON.stringify(jsonMode ? '/' : route),
        __TOKEN__: JSON.stringify(flag('token', '')),
      },
      entryPoints: [path.join(here, 'harness/main.tsx')],
      format: 'esm',
      jsx: 'automatic',
      loader: loaders,
      logLevel: 'error',
      outdir: dist,
      platform: 'browser',
      plugins: [
        {
          name: 'page-json',
          setup(build) {
            build.onResolve({ filter: /^page-json$/ }, () => ({ path: jsonMode ? path.resolve(route) : emptyPage }));
          },
        },
      ],
      splitting: true,
      tsconfig,
    });

    writeFileSync(
      path.join(dist, 'index.html'),
      `<!DOCTYPE html><html lang="uk"><head><meta charset="utf-8"/><base href="/"/>
<link href="https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Geologica:wght@100..900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/main.css"/></head><body style="margin:0"><div id="root"></div>
<script type="module" src="/main.js"></script></body></html>`
    );

    const mounts = [
      ['/assets/images/', path.join(root, 'shared/assets/src/lib/images')],
      ['/assets/icons/', path.join(root, 'shared/assets/src/lib/icons')],
      ['/', dist],
    ];
    const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
    const server = createServer((request, response) => {
      const url = decodeURIComponent((request.url ?? '/').split('?')[0]);
      const [prefix, dir] = mounts.find(([p]) => url.startsWith(p)) ?? mounts[2];
      const file = path.join(dir, url === '/' ? 'index.html' : url.slice(prefix.length));

      if (!file.startsWith(dir) || !existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404).end();

        return;
      }

      response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(response);
    });

    await new Promise((resolve) => server.listen(0, resolve));

    const { chromium } = require('playwright');
    const cache = path.join(homedir(), 'Library/Caches/ms-playwright');
    const shells = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')) : [];
    const executablePath = shells
      .map((d) => path.join(cache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'))
      .find(existsSync);
    const browser = await chromium.launch(executablePath ? { executablePath } : {});
    const page = await browser.newPage({
      viewport: { height: Number(flag('height', 1000)), width: Number(flag('width', 1232)) },
    });
    const logs = [];

    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text().slice(0, 240)}`));
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message.slice(0, 240)}`));

    await page.goto(`http://localhost:${server.address().port}/`, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3500);
    await page.screenshot({ fullPage: true, path: path.resolve(out) });
    await browser.close();
    server.close();

    console.log(logs.length ? `console problems:\n${logs.slice(0, 12).join('\n')}` : 'no console errors');
    console.log('screenshot', path.resolve(out));
  },
};

const [command, ...args] = process.argv.slice(2);

if (!commands[command]) {
  console.error(usage);
  process.exit(1);
}

commands[command](args).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
