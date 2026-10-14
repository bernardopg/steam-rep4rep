import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const secret = process.env.GREASYFORK_WEBHOOK_SECRET;
const webhook = process.env.GREASYFORK_WEBHOOK_URL;
assert(
  secret && webhook,
  'Configure GREASYFORK_WEBHOOK_SECRET and GREASYFORK_WEBHOOK_URL before releasing',
);
const url = new URL(webhook);
assert(
  ['https://greasyfork.org', 'https://api.greasyfork.org'].includes(url.origin),
);
assert.match(
  url.pathname,
  /^\/(?:[a-zA-Z-]+\/)?users\/811534(?:-[\w-]+)?\/webhook$/,
);
assert.equal(url.search, '');
const repository = 'https://github.com/bernardopg/steam-rep4rep';
assert.match(process.env.GITHUB_SHA || '', /^[a-f0-9]{40}$/);
const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Steam-Rep4Rep-release',
};
async function send(event, payload) {
  const body = JSON.stringify(payload);
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(90000),
    body,
    headers: {
      ...headers,
      'X-GitHub-Event': event,
      'X-Hub-Signature': `sha1=${createHmac('sha1', secret).update(body).digest('hex')}`,
    },
  });
  assert(response.ok, `Greasy Fork webhook returned HTTP ${response.status}`);
  const result = await response.json();
  assert.equal(
    result.updated_failed?.length,
    0,
    'Greasy Fork reported failed synchronization',
  );
  assert(
    result.updated_scripts?.some((script) => {
      try {
        return /^\/(?:[a-zA-Z-]+\/)?scripts\/540752(?:-|$)/.test(
          new URL(script).pathname,
        );
      } catch {
        return false;
      }
    }),
    'Greasy Fork did not acknowledge script 540752',
  );
}
async function publicVersion() {
  const response = await fetch(
    'https://api.greasyfork.org/en/scripts/540752.json',
    { headers, signal: AbortSignal.timeout(30000) },
  );
  assert(response.ok, `Greasy Fork API returned HTTP ${response.status}`);
  return (await response.json()).version;
}
const current = await publicVersion();
assert.match(current, /^\d+\.\d+(?:\.\d+)?$/);
const expectedParts = version.split('.').map(Number);
const currentParts = current.split('.').map(Number);
const difference =
  expectedParts
    .map((part, index) => part - (currentParts[index] || 0))
    .find((part) => part !== 0) || 0;
assert(difference >= 0, 'Refusing to replace a newer Greasy Fork version');
// Replaying a release event creates history entries; skip it when this version is already live.
if (difference > 0)
  await send('release', {
    action: 'published',
    repository: {
      html_url: repository,
      clone_url: `${repository}.git`,
      default_branch: 'main',
    },
    release: {
      tag_name: `v${version}`,
      name: `v${version}`,
      target_commitish: process.env.GITHUB_SHA,
    },
  });
await send('push', {
  ref: 'refs/heads/main',
  repository: {
    html_url: repository,
    clone_url: `${repository}.git`,
    default_branch: 'main',
  },
  commits: [
    {
      id: process.env.GITHUB_SHA,
      message: `Release v${version}`,
      modified: ['README.md'],
    },
  ],
});
for (let attempt = 0; attempt < 12; attempt++) {
  if ((await publicVersion()) === version) {
    const response = await fetch(
      `https://update.greasyfork.org/scripts/540752/Steam%20Rep4Rep%20-%20Comment%20to%20Friends.user.js?version=${version}`,
      { signal: AbortSignal.timeout(30000) },
    );
    assert(response.ok, `Published code returned HTTP ${response.status}`);
    const normalize = (source) =>
      source
        .replace(/\r\n/g, '\n')
        .replace(/^\/\/ @(?:updateURL|downloadURL)[\t ]+.*\n/gm, '')
        .trim();
    assert.equal(
      normalize(await response.text()),
      normalize(await readFile('rep4rep.user.js', 'utf8')),
      'Published Greasy Fork code differs from the release',
    );
    console.log(
      `Greasy Fork script 540752 confirmed at v${version}; code and README synchronization acknowledged.`,
    );
    process.exit(0);
  }
  await sleep(10000);
}
throw Error(`Greasy Fork did not publish v${version} within two minutes`);
