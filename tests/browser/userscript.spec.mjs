import { test, expect } from '@playwright/test';

const endpoint = 'https://steamcommunity.com/comment/Profile/post/**';
async function review(page) {
  await page.locator('#rep4rep-comment').fill('Teste & + ação');
  await page.locator('#rep4rep-select-all').click();
  await page.locator('#rep4rep-post-comments').click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function start(page) {
  await review(page);
  await page.locator('#rep4rep-start').click();
}

test.beforeEach(async ({ page }) => {
  const now = new Date();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.valueOf() + 1000));
  await page.route('https://steamcommunity.com/**', (route) =>
    route.fulfill({ json: { success: 1 } }),
  );
  await page.goto('/fixture.html');
  await expect(page.locator('.rep4rep-checkbox')).toHaveCount(3);
});

test('visible selection, accessible labels, highlight and clearing', async ({
  page,
}) => {
  await page
    .locator('.friend_block_v2')
    .nth(1)
    .evaluate((el) => (el.style.display = 'none'));
  await page.locator('#rep4rep-select-all').click();
  await expect(page.locator('.rep4rep-checkbox:checked')).toHaveCount(2);
  await expect(page.locator('#rep4rep-selection')).toContainText(': 2');
  await expect(
    page.getByRole('checkbox', { name: 'Selecionar amigo: Alice' }),
  ).toBeChecked();
  await expect(page.locator('.rep4rep-selected').first()).toHaveCSS(
    'outline-style',
    'solid',
  );
  await expect(
    page.getByLabel('Seu comentário', { exact: true }),
  ).toBeVisible();
  await page.locator('#rep4rep-deselect-all').click();
  await expect(page.locator('.rep4rep-checkbox:checked')).toHaveCount(0);
});

test('profile links preserve navigation without selecting friends', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Alice', exact: true }).click();
  await expect(page).toHaveURL(/#alice$/);
  await expect(page.locator('.rep4rep-checkbox:checked')).toHaveCount(0);
});

test('controls do not submit an enclosing Steam form', async ({ page }) => {
  await page.evaluate(() => {
    const root = document.querySelector('.friends_content');
    const form = document.createElement('form');
    root.replaceWith(form);
    form.append(root);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      document.body.dataset.submitted = 'yes';
    });
  });
  await review(page);
  await page.locator('#rep4rep-back').click();
  await expect(page.locator('body')).not.toHaveAttribute('data-submitted');
});

test('hidden previously selected friends are excluded from review', async ({
  page,
}) => {
  await page.locator('#rep4rep-select-all').click();
  await page
    .locator('.friend_block_v2')
    .nth(1)
    .evaluate((el) => (el.hidden = true));
  await page.locator('#rep4rep-comment').fill('Hello');
  await page.locator('#rep4rep-post-comments').click();
  await expect(page.locator('#rep4rep-recipients li')).toHaveCount(2);
  await expect(page.locator('#rep4rep-recipients')).not.toContainText('Bruno');
});

test('empty input, invalid interval and missing session prevent requests', async ({
  page,
}) => {
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    return route.fulfill({ json: { success: 1 } });
  });
  await page.locator('#rep4rep-post-comments').click();
  await expect(page.locator('#rep4rep-status')).toContainText('Selecione');
  await page.locator('#rep4rep-select-all').click();
  await page.locator('#rep4rep-post-comments').click();
  await expect(page.locator('#rep4rep-status')).toContainText('Escreva');
  await page.locator('#rep4rep-comment').fill('Hello');
  for (const value of ['0', '5', '6.5', '3601', '']) {
    await page.locator('#rep4rep-interval').fill(value);
    await page.locator('#rep4rep-post-comments').click();
    await expect(page.locator('#rep4rep-status')).toContainText('inteiro');
  }
  await page.locator('#rep4rep-interval').fill('6');
  await page.evaluate(() => {
    delete window.g_sessionID;
  });
  await page.locator('#rep4rep-post-comments').click();
  await expect(page.locator('#rep4rep-status')).toContainText(
    'Sessão Steam indisponível',
  );
  expect(requests).toBe(0);
});

test('review requires confirmation and allows going back', async ({ page }) => {
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    return route.fulfill({ json: { success: 1 } });
  });
  await review(page);
  await expect(page.locator('#rep4rep-recipients li')).toHaveCount(3);
  await expect(page.locator('#rep4rep-preview')).toHaveText('Teste & + ação');
  expect(requests).toBe(0);
  await page.locator('#rep4rep-back').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(requests).toBe(0);
});

test('rejects a SteamID changed after checkbox creation', async ({ page }) => {
  await page
    .locator('.rep4rep-checkbox')
    .first()
    .evaluate((el) => (el.dataset.steamid = 'invalid/path'));
  await page.locator('#rep4rep-select-all').click();
  await page.locator('#rep4rep-comment').fill('Hello');
  await page.locator('#rep4rep-post-comments').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('#rep4rep-status')).toContainText(
    'Resposta inesperada',
  );
});

test('posts once per friend with encoded text, correct IDs and final progress', async ({
  page,
}) => {
  const requests = [];
  await page.route(endpoint, (route) => {
    requests.push({
      url: route.request().url(),
      body: new URLSearchParams(route.request().postData()),
    });
    return route.fulfill({ json: { success: 1 } });
  });
  await start(page);
  await expect(page.locator('#rep4rep-log li')).toHaveCount(1);
  await expect(page.locator('#rep4rep-post-comments')).toBeDisabled();
  await page.evaluate(() => document.querySelector('#rep4rep-start').click());
  for (const count of [2, 3]) {
    await page.clock.runFor(6000);
    await expect(page.locator('#rep4rep-log li')).toHaveCount(count);
  }
  await expect(page.locator('#rep4rep-status')).toContainText(
    'Concluído · Processados: 3/3 · Enviados: 3 · Falhas: 0',
  );
  await expect(page.locator('#rep4rep-progress')).toHaveJSProperty('value', 3);
  await expect(page.locator('#rep4rep-post-comments')).toBeEnabled();
  expect(requests).toHaveLength(3);
  expect(requests.map((r) => r.url.match(/post\/(\d+)\//)[1])).toEqual([
    '76561198000000001',
    '76561198000000002',
    '76561198000000003',
  ]);
  for (const request of requests) {
    expect(request.body.get('comment')).toBe('Teste & + ação');
    expect(request.body.get('sessionid')).toBe('local-test-session');
  }
});

for (const status of [401, 403, 429, 500]) {
  test(`HTTP ${status} stops the remaining recipients`, async ({ page }) => {
    let requests = 0;
    await page.route(endpoint, (route) => {
      requests++;
      return route.fulfill({ status, body: '<html>Error</html>' });
    });
    await start(page);
    await expect(page.locator('#rep4rep-status')).toContainText('Interrompido');
    await expect(page.locator('#rep4rep-log')).toContainText(`HTTP ${status}`);
    await page.clock.runFor(30000);
    expect(requests).toBe(1);
  });
}

test('Steam JSON error is text, stops further posts and finalizes failures', async ({
  page,
}) => {
  const payload = '<img src=x onerror="document.body.dataset.injected=1">';
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    return route.fulfill({ json: { success: false, error: payload } });
  });
  await start(page);
  await expect(page.locator('#rep4rep-log')).toContainText(payload);
  await expect(page.locator('#rep4rep-log img')).toHaveCount(0);
  await expect(page.locator('#rep4rep-status')).toContainText(
    'Interrompido · Processados: 1/3 · Enviados: 0 · Falhas: 1 · Não enviados: 2',
  );
  await page.clock.runFor(30000);
  expect(requests).toBe(1);
});

test('invalid JSON and lost connection never retry an ambiguous POST', async ({
  page,
}) => {
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    return route.fulfill({ body: '<html>Sign in</html>' });
  });
  await start(page);
  await expect(page.locator('#rep4rep-status')).toContainText('Interrompido');
  await expect(page.locator('#rep4rep-log')).toContainText(
    'resultado é incerto',
  );
  await page.clock.runFor(30000);
  expect(requests).toBe(1);
});

test('network failure stops and re-enables controls', async ({ page }) => {
  await page.route(endpoint, (route) => route.abort('failed'));
  await start(page);
  await expect(page.locator('#rep4rep-status')).toContainText('Falhas: 1');
  await expect(page.locator('#rep4rep-post-comments')).toBeEnabled();
});

test('does not overlap slow requests; waits configured interval after response', async ({
  page,
}) => {
  let held;
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    if (requests === 1) {
      held = route;
      return;
    }
    return route.fulfill({ json: { success: 1 } });
  });
  await page.locator('#rep4rep-interval').fill('10');
  await start(page);
  await expect.poll(() => requests).toBe(1);
  await page.clock.runFor(12000);
  expect(requests).toBe(1);
  await held.fulfill({ json: { success: 1 } });
  await expect(page.locator('#rep4rep-log li')).toHaveCount(1);
  await page.clock.runFor(9999);
  expect(requests).toBe(1);
  await page.clock.runFor(1);
  await expect.poll(() => requests).toBe(2);
  await page.locator('#rep4rep-cancel').click();
});

test('cancels the wait without starting any more requests', async ({
  page,
}) => {
  let requests = 0;
  await page.route(endpoint, (route) => {
    requests++;
    return route.fulfill({ json: { success: 1 } });
  });
  await start(page);
  await expect(page.locator('#rep4rep-log li')).toHaveCount(1);
  await page.locator('#rep4rep-cancel').click();
  await expect(page.locator('#rep4rep-status')).toContainText('Interrompido');
  await page.clock.runFor(60000);
  expect(requests).toBe(1);
  await expect(page.locator('#rep4rep-post-comments')).toBeEnabled();
});

test('cancels an active request and marks its outcome as uncertain', async ({
  page,
}) => {
  let held;
  await page.route(endpoint, (route) => {
    held = route;
  });
  await start(page);
  await expect.poll(() => !!held).toBe(true);
  await page.locator('#rep4rep-cancel').click();
  await expect(page.locator('#rep4rep-log')).toContainText(
    'resultado é incerto',
  );
  await expect(page.locator('#rep4rep-status')).toContainText('Interrompido');
  await held.fulfill({ json: { success: 1 } }).catch(() => {});
});

test('native request timeout stops the batch without a retry', async ({
  page,
}) => {
  let held;
  let requests = 0;
  await page.route(endpoint, (route) => {
    held = route;
    requests++;
  });
  await start(page);
  await expect.poll(() => requests).toBe(1);
  await page.clock.runFor(30001);
  await expect(page.locator('#rep4rep-status')).toContainText('Interrompido', {
    timeout: 5000,
  });
  await expect(page.locator('#rep4rep-log')).toContainText(
    'resultado é incerto',
  );
  expect(requests).toBe(1);
  await held.fulfill({ json: { success: 1 } }).catch(() => {});
});

test('another tab cannot start a concurrent batch', async ({
  page,
  context,
}) => {
  let held;
  await page.route(endpoint, (route) => {
    held = route;
  });
  await start(page);
  await expect.poll(() => !!held).toBe(true);
  const other = await context.newPage();
  let otherRequests = 0;
  await other.route('https://steamcommunity.com/**', (route) => {
    otherRequests++;
    return route.fulfill({ json: { success: 1 } });
  });
  await other.goto('/fixture.html');
  await start(other);
  await expect(other.locator('#rep4rep-status')).toContainText('Outra aba');
  expect(otherRequests).toBe(0);
  await page.locator('#rep4rep-cancel').click();
  await held.fulfill({ json: { success: 1 } }).catch(() => {});
  await other.close();
});

test('late container, dynamic replacement, valid IDs and no duplicate panels', async ({
  page,
}) => {
  await page.route('**/fixture.html?late=1', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html lang="pt-BR"><script src="/rep4rep.user.js"></script></html>',
    }),
  );
  await page.goto('/fixture.html?late=1');
  await expect(page.locator('.rep4rep-container')).toHaveCount(0);
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.className = 'friends_content';
    root.innerHTML =
      '<div class="friend_block_v2" data-steamid="76561198000000001">Alice</div><div class="friend_block_v2" data-steamid="oops">Invalid</div>';
    document.body.append(root);
  });
  await expect(page.locator('.rep4rep-checkbox')).toHaveCount(1);
  await page.evaluate(() => {
    document.querySelector('.friend_block_v2').remove();
    const friend = document.createElement('div');
    friend.className = 'friend_block_v2';
    friend.dataset.steamid = '76561198000000002';
    friend.textContent = 'New friend';
    document.querySelector('.friends_content').append(friend);
  });
  await expect(page.locator('.rep4rep-checkbox')).toHaveCount(1);
  await expect(page.locator('.rep4rep-checkbox')).toHaveAttribute(
    'id',
    'rep4rep-friend-76561198000000002',
  );
  await page.addScriptTag({ url: '/rep4rep.user.js' });
  await expect(page.locator('.rep4rep-container')).toHaveCount(1);
});

test('URL language overrides HTML language; layout stays inside panel', async ({
  page,
}) => {
  await page.goto('/fixture.html?l=english');
  await expect(page.getByLabel('Your comment', { exact: true })).toBeVisible();
  const layout = await page.locator('.rep4rep-textarea').evaluate((el) => ({
    field: el.getBoundingClientRect().right,
    panel: el.closest('.rep4rep-container').getBoundingClientRect().right,
  }));
  expect(layout.field).toBeLessThan(layout.panel);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.locator('#rep4rep-select-all').click();
  expect(errors).toEqual([]);
});
