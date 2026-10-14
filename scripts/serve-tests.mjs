import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const routes = new Map([
  ['/fixture.html', ['tests/fixtures/friends.html', 'text/html']],
  ['/rep4rep.user.js', ['rep4rep.user.js', 'text/javascript']],
]);
createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, 'http://127.0.0.1').pathname);
  if (!route) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(route[0]);
    response
      .writeHead(200, {
        'Content-Type': `${route[1]}; charset=utf-8`,
        'Cache-Control': 'no-store',
      })
      .end(body);
  } catch {
    response.writeHead(500).end();
  }
}).listen(8766, '127.0.0.1');
