import { onRegistration } from "@/lib/registrationChannel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {
          cleanup?.();
        }
      };

      const unsubscribe = onRegistration((payload) => {
        send(`data: ${JSON.stringify(payload)}\n\n`);
      });

      const heartbeat = setInterval(() => {
        send(": heartbeat\n\n");
      }, 20000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
