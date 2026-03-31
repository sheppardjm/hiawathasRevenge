import type { APIRoute } from 'astro';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) {
    return new Response(JSON.stringify({ error: 'Not available in production' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const manifest = await request.json();
  const outputPath = resolve(process.cwd(), 'public/data/photos-manifest.json');
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf8');

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
