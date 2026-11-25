// Versión publicada ahora mismo (para que la app sepa si hay una nueva).
export function GET() {
  return new Response(JSON.stringify({ version: process.env.VERCEL_GIT_COMMIT_SHA || 'local' }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
