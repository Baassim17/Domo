import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/enquiries/route.ts';

function request(data, origin = 'https://domo.example') {
  return new Request('https://domo.example/api/enquiries', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(data),
  });
}

test('production enquiries validate and only report success after delivery', async () => {
  const previous = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    process.env.VERCEL = '1';
    delete process.env.ENQUIRIES_WEBHOOK_URL;
    delete process.env.ENQUIRIES_WEBHOOK_TOKEN;
    assert.equal((await POST(request({ email: 'bad' }))).status, 422);
    assert.equal((await POST(request({ email: 'hello@example.com' }, 'https://other.example'))).status, 403);
    assert.equal((await POST(request({ email: 'hello@example.com' }))).status, 503);
    assert.equal((await POST(request({ _gotcha: 'spam' }))).status, 200);

    process.env.ENQUIRIES_WEBHOOK_URL = 'https://inbox.example/enquiries';
    process.env.ENQUIRIES_WEBHOOK_TOKEN = 'test-token';
    let deliveries = 0;
    globalThis.fetch = async (url, options) => {
      deliveries++;
      assert.equal(String(url), 'https://inbox.example/enquiries');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      assert.equal(options.redirect, 'error');
      const payload = JSON.parse(options.body);
      assert.equal(payload.data.email, 'hello@example.com');
      assert.ok(payload.id);
      assert.ok(payload.receivedAt);
      return new Response(null, { status: 204 });
    };
    const result = await POST(request({ email: ' hello@example.com ' }));
    assert.equal(result.status, 200);
    assert.equal((await result.json()).ok, true);
    assert.equal(deliveries, 1);
    globalThis.fetch = async () => new Response(null, { status: 500 });
    assert.equal((await POST(request({ email: 'hello@example.com' }))).status, 502);
    globalThis.fetch = async () => { throw new Error('Timeout'); };
    assert.equal((await POST(request({ email: 'hello@example.com' }))).status, 502);
    process.env.ENQUIRIES_WEBHOOK_URL = 'http://insecure.example';
    assert.equal((await POST(request({ email: 'hello@example.com' }))).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ['VERCEL', 'ENQUIRIES_WEBHOOK_URL', 'ENQUIRIES_WEBHOOK_TOKEN']) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
