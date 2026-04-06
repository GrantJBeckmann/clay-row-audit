import { NextRequest } from 'next/server';
import { runAudit, AuditEvent } from '@/lib/clay';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { cookie, workspaceId } = await req.json();

  if (!cookie || !workspaceId) {
    return new Response(JSON.stringify({ error: 'Missing cookie or workspaceId' }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: AuditEvent) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {}
      }

      try {
        await runAudit(cookie, workspaceId, send);
      } catch (err: unknown) {
        send({ type: 'error', message: String(err) });
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
    },
  });
}