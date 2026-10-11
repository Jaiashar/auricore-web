import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import * as handlers from '../app/api/[[...path]]/route.ts';

for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
  test(`${method} cannot reach historical providers or records`, async () => {
    const request = new Request('http://localhost/api/get-application?id=another-user', {
      method,
      headers: { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' },
    });
    const response = handlers[method](request);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.match((await response.json()).error, /disabled/);
  });
}
test('only the disabled catch-all is registered as an API route', () => {
  const routes = readdirSync(new URL('../app/api/', import.meta.url), { recursive: true })
    .filter(path => /route\.[cm]?[jt]sx?$/.test(path));
  assert.deepEqual(routes, ['[[...path]]/route.ts']);
});
