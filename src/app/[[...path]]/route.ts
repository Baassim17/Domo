import pages from '@/data/pages.json';

const documents: Record<string, string> = pages;

// The preserved router fetches only the page subtree while retaining its shell,
// loader, navigation and transition canvas for the life of the document.
const fragments = new Map<string, string>();
for (const html of Object.values(documents)) {
  const fragment = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]?.trim();
  const id = fragment?.match(/^<div\b[^>]*\bid="([a-z0-9-]+)"/)?.[1];
  if (id && fragment) fragments.set(id, fragment);
}

/** Serve the preserved document and animation engine without an extra hydration pass. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  const pathname = `/${path.join('/')}`;
  const slot = pathname.match(/^\/html\/[a-f0-9-]+\/([a-z0-9-]+)\/slot\.html$/);
  if (slot) {
    const fragment = fragments.get(slot[1]);
    return new Response(fragment ?? 'Page fragment not found.', {
      status: fragment ? 200 : 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  const html = documents[pathname] ?? documents['/404'];
  return new Response(html, {
    status: pathname in documents && pathname !== '/404' ? 200 : 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}
