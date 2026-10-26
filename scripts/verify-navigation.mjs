import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.SITE_URL || 'http://localhost:3000';
const pages = JSON.parse(await fs.readFile('src/data/pages.json', 'utf8'));
const runtime = await fs.readFile('public/assets/_-jmbvb2r1.js', 'utf8');
const build = runtime.match(/new xo\("([a-f0-9-]+)"\)/)?.[1];
assert.ok(build, 'Animation router build identifier must be discoverable.');

for (const [route, html] of Object.entries(pages)) {
  const expected = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]?.trim();
  const id = expected?.match(/^<div\b[^>]*\bid="([a-z0-9-]+)"/)?.[1];
  assert.ok(expected && id, `${route}: valid page fragment`);
  const response = await fetch(`${base}/html/${build}/${id}/slot.html`);
  assert.equal(response.status, 200, `${route}: fragment request succeeds`);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  const actual = await response.text();
  assert.equal(actual, expected, `${route}: fragment is the exact page subtree`);
  assert.doesNotMatch(actual, /<!doctype|<html\b|<head\b|<main\b|<script\b|id="load"/i);
  console.log('Fragment OK', route);
}

const invalid = await fetch(`${base}/html/${build}/not-a-page/slot.html`);
assert.equal(invalid.status, 404);
console.log('Navigation fragment contract passed for all 11 routes.');
