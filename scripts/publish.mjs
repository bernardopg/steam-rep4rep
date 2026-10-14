import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const tag = process.env.GITHUB_REF_NAME;
assert.equal(process.env.GITHUB_REF_TYPE, 'tag', 'Publish from a version tag');
assert.equal(tag, `v${version}`);
const gh = (args) =>
  execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const existing = spawnSync(
  'gh',
  ['release', 'view', tag, '--json', 'isDraft'],
  { encoding: 'utf8' },
);
const assets = (await readdir('dist')).map((file) => `dist/${file}`);
if (existing.status === 0 && !JSON.parse(existing.stdout).isDraft) {
  const directory = await mkdtemp(join(tmpdir(), 'rep4rep-release-'));
  try {
    gh(['release', 'download', tag, '--dir', directory]);
    for (const file of await readdir('dist')) {
      assert.deepEqual(
        await readFile(join(directory, file)),
        await readFile(`dist/${file}`),
        `Published asset differs: ${file}`,
      );
    }
    console.log(
      `${tag} already published with identical assets; retrying distribution only.`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
} else {
  if (existing.status !== 0) {
    gh([
      'release',
      'create',
      tag,
      '--verify-tag',
      '--draft',
      '--title',
      tag,
      '--notes-file',
      'CHANGELOG.md',
    ]);
  }
  gh(['release', 'upload', tag, ...assets, '--clobber']);
  gh(['release', 'edit', tag, '--draft=false', '--latest']);
  console.log(`Published ${tag} after uploading all release assets.`);
}
