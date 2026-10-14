import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import timers from 'node:timers/promises';
import { syncBuiltinESMExports } from 'node:module';

const calls = [];
const scenario = process.env.WEBHOOK_SCENARIO;
timers.setTimeout = async (milliseconds) => {
  assert.equal(milliseconds, 10000);
  calls.push({ sleep: milliseconds });
};
syncBuiltinESMExports();
const { version: desiredVersion } = JSON.parse(
  await readFile('package.json', 'utf8'),
);
globalThis.fetch = async (url, options = {}) => {
  const target = new URL(url);
  if (
    target.hostname === 'api.greasyfork.org' &&
    target.pathname.endsWith('.json')
  ) {
    const posts = calls.filter((call) => call.event).length;
    const version =
      scenario === 'newer'
        ? `${Number(desiredVersion.split('.')[0]) + 1}.0.0`
        : scenario === 'repeat' || posts
          ? desiredVersion
          : '0.0.0';
    calls.push({ method: 'GET', version });
    await writeFile(process.env.WEBHOOK_EVIDENCE, JSON.stringify(calls));
    return Response.json({ version });
  }
  if (target.hostname === 'update.greasyfork.org') {
    calls.push({ method: 'GET', code: true });
    await writeFile(process.env.WEBHOOK_EVIDENCE, JSON.stringify(calls));
    const source = await readFile('rep4rep.user.js', 'utf8');
    return new Response(
      scenario === 'different-code' ||
        (scenario === 'stale-code' &&
          calls.filter((call) => call.code).length === 1)
        ? 'different code'
        : source,
    );
  }
  assert.equal(
    target.href,
    'https://api.greasyfork.org/en/users/811534-bernardopg/webhook',
  );
  assert.equal(options.method, 'POST');
  assert.equal(
    options.headers['X-Hub-Signature'],
    `sha1=${createHmac('sha1', 'synthetic-test-secret').update(options.body).digest('hex')}`,
  );
  const payload = JSON.parse(options.body);
  const event = options.headers['X-GitHub-Event'];
  calls.push({ event, payload });
  await writeFile(process.env.WEBHOOK_EVIDENCE, JSON.stringify(calls));
  if (scenario === 'failed')
    return Response.json({ updated_failed: ['failed'], updated_scripts: [] });
  if (scenario === 'missing')
    return Response.json({ updated_failed: [], updated_scripts: [] });
  if (scenario === 'wrong-id')
    return Response.json({
      updated_failed: [],
      updated_scripts: ['https://greasyfork.org/en/scripts/5407520-other'],
    });
  return Response.json({
    updated_failed: [],
    updated_scripts: [
      'https://greasyfork.org/en/scripts/540752-steam-rep4rep-comment-to-friends',
    ],
  });
};
