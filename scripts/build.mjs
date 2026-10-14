import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const source = await readFile('rep4rep.user.js', 'utf8');
const end = '// ==/UserScript==';
assert(
  source.startsWith('// ==UserScript==\n') && source.includes(end),
  'Missing userscript metadata',
);
const metadata = source.slice(0, source.indexOf(end) + end.length) + '\n';
const fields = new Map(
  [...metadata.matchAll(/^\/\/ @(\S+)[\t ]+(.+)$/gm)].map(([, key, value]) => [
    key,
    value.trim(),
  ]),
);
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.equal(
  fields.get('version'),
  version,
  'package and userscript versions differ',
);
assert.equal(
  fields.get('name'),
  'Steam Rep4Rep - Comment to Friends',
  'Preserve installed script identity',
);
assert.equal(
  fields.get('namespace'),
  'http://tampermonkey.net/',
  'Preserve installed script identity',
);
assert.equal(fields.get('license'), 'MIT');
assert.equal(fields.get('grant'), 'none');
if (process.env.GITHUB_REF_TYPE === 'tag') {
  assert.equal(
    process.env.GITHUB_REF_NAME,
    `v${version}`,
    'Tag must match the userscript version',
  );
}
const files = new Map([
  ['rep4rep.user.js', source],
  ['rep4rep.meta.js', metadata],
  ['README.md', await readFile('README.md', 'utf8')],
  ['LICENSE', await readFile('LICENSE', 'utf8')],
]);
await mkdir('dist', { recursive: true });
for (const [name, data] of files) await writeFile(`dist/${name}`, data);
await writeFile(
  'dist/SHA256SUMS',
  [...files]
    .map(
      ([name, data]) =>
        `${createHash('sha256').update(data).digest('hex')}  ${name}\n`,
    )
    .join(''),
);
console.log(`Built v${version}: ${[...files.keys()].join(', ')}, SHA256SUMS`);
