import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

/** Deliver to the configured inbox; local files are only used during development. */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ ok: false, error: 'Invalid origin.' }, { status: 403 });
  }
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 32_768) {
    return Response.json({ ok: false, error: 'Submission too large.' }, { status: 413 });
  }
  try {
    const raw: unknown = request.headers.get('content-type')?.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid submission.');
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === 'string') data[key.slice(0, 100)] = value.trim().slice(0, 5_000);
      else if (Array.isArray(value)) data[key.slice(0, 100)] = value.filter(v => typeof v === 'string').join(', ').slice(0, 5_000);
    }
    if (data._gotcha) return Response.json({ ok: true });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) {
      return Response.json({ ok: false, errors: [{ field: 'email', message: 'Please enter a valid email.' }] }, { status: 422 });
    }
    const id = randomUUID();
    const enquiry = { id, receivedAt: new Date().toISOString(), data };
    const webhook = process.env.ENQUIRIES_WEBHOOK_URL;
    if (webhook) {
      const url = new URL(webhook);
      if (url.protocol !== 'https:') throw new Error('Webhook must use HTTPS.');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.ENQUIRIES_WEBHOOK_TOKEN) {
        headers.Authorization = `Bearer ${process.env.ENQUIRIES_WEBHOOK_TOKEN}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(enquiry),
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('Delivery failed.');
    } else if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return Response.json({ ok: false, error: 'Enquiries are temporarily unavailable. Please try again later.' }, { status: 503 });
    } else {
      const directory = path.join(process.cwd(), '.data');
      await mkdir(directory, { recursive: true });
      await appendFile(path.join(directory, 'enquiries.ndjson'), `${JSON.stringify(enquiry)}\n`, 'utf8');
    }
    return Response.json({ ok: true, id });
  } catch {
    return Response.json({ ok: false, error: 'Unable to send your enquiry. Please try again.' }, { status: 502 });
  }
}
