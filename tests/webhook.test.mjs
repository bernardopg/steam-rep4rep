import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));

async function invoke(scenario) {
  const directory = await mkdtemp(join(tmpdir(), 'rep4rep-webhook-'));
  const evidence = join(directory, 'requests.json');
  try {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        './tests/fixtures/webhook-transport.mjs',
        'scripts/sync-greasyfork.mjs',
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          GREASYFORK_WEBHOOK_URL:
            'https://api.greasyfork.org/en/users/811534-bernardopg/webhook',
          GREASYFORK_WEBHOOK_SECRET: 'synthetic-test-secret',
          GITHUB_SHA: 'a'.repeat(40),
          WEBHOOK_SCENARIO: scenario,
          WEBHOOK_EVIDENCE: evidence,
        },
      },
    );
    assert(
      !`${result.stdout}${result.stderr}`.includes('synthetic-test-secret'),
      'Secrets must not be logged',
    );
    const calls = JSON.parse(await readFile(evidence, 'utf8'));
    return { ...result, calls };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('signed release and README events use the released commit; public bytes are verified', async () => {
  const result = await invoke('success');
  assert.equal(result.status, 0, result.stderr);
  const events = result.calls.filter((call) => call.event);
  assert.deepEqual(
    events.map((call) => call.event),
    ['release', 'push'],
  );
  assert.equal(events[0].payload.release.tag_name, `v${version}`);
  assert.equal(events[0].payload.repository.default_branch, 'main');
  assert.equal(events[1].payload.commits[0].id, 'a'.repeat(40));
  assert.deepEqual(events[1].payload.commits[0].modified, ['README.md']);
  assert(result.calls.some((call) => call.code));
});

test('a distribution retry skips the already published code event', async () => {
  const result = await invoke('repeat');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    result.calls.filter((call) => call.event).map((call) => call.event),
    ['push'],
  );
});

test('waits for download propagation after the API already reports the new version', async () => {
  const result = await invoke('stale-code');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.calls.filter((call) => call.code).length, 2);
  assert.equal(result.calls.filter((call) => call.sleep).length, 1);
});

for (const scenario of [
  'failed',
  'missing',
  'wrong-id',
  'different-code',
  'newer',
]) {
  test(`distribution rejects ${scenario} instead of reporting success`, async () => {
    const result = await invoke(scenario);
    assert.notEqual(result.status, 0);
    if (scenario === 'newer')
      assert.equal(result.calls.filter((call) => call.event).length, 0);
  });
}
