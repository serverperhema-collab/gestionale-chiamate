import { NextResponse } from "next/server";
import { eventEmitter } from "@/lib/eventEmitter";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "TEAM_LEADER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Function to send events
  const sendEvent = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Listener wrapper
  const listener = (data: any) => {
    sendEvent(data);
  };

  // Subscribe to 'tl-alert' events
  eventEmitter.on("tl-alert", listener);

  // Send initial ping to establish connection
  writer.write(encoder.encode(":\n\n"));

  req.signal.addEventListener("abort", () => {
    eventEmitter.off("tl-alert", listener);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
