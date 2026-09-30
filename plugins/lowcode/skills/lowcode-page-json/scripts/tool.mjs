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

const commands = {
  async build([entry, out]) {
    if (!entry || !out) throw new Error(usage);

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

    run(outfile, [path.resolve(out)]);
  },

  async validate([file]) {
    if (!file) throw new Error(usage);

    const outfile = await bundleNode({ name: 'validate', build: { entryPoints: [path.join(here, 'validate.ts')] } });

    run(outfile, [path.resolve(file)]);
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
