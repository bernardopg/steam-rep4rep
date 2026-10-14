import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('release publishes exact source, installable metadata and valid checksums', async () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const source = await readFile('rep4rep.user.js', 'utf8');
  assert.equal(await readFile('dist/rep4rep.user.js', 'utf8'), source);
  const meta = await readFile('dist/rep4rep.meta.js', 'utf8');
  assert(source.startsWith(meta));
  assert(meta.endsWith('// ==/UserScript==\n'));
  for (const line of (await readFile('dist/SHA256SUMS', 'utf8'))
    .trim()
    .split('\n')) {
    const [expected, file] = line.split('  ');
    assert.equal(
      createHash('sha256')
        .update(await readFile(`dist/${file}`))
        .digest('hex'),
      expected,
      file,
    );
  }
});

test('release rejects a tag that does not match the package', () => {
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    env: { ...process.env, GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: 'v0.0.0' },
  });
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr.toString(),
    /Tag must match the userscript version/,
  );
});
