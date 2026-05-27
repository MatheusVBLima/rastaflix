import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Twitch EventSub message types
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification";
const MESSAGE_TYPE_NOTIFICATION = "notification";
const MESSAGE_TYPE_REVOCATION = "revocation";

// Headers from Twitch
const TWITCH_MESSAGE_ID = "twitch-eventsub-message-id";
const TWITCH_MESSAGE_TIMESTAMP = "twitch-eventsub-message-timestamp";
const TWITCH_MESSAGE_SIGNATURE = "twitch-eventsub-message-signature";
const TWITCH_MESSAGE_TYPE = "twitch-eventsub-message-type";

const HMAC_PREFIX = "sha256=";

/**
 * Build the EventSub HMAC input by concatenating the message ID, timestamp, and raw body.
 *
 * @param messageId - The Twitch EventSub message ID header value
 * @param timestamp - The Twitch EventSub message timestamp header value
 * @param body - The raw request body (string)
 * @returns The concatenated string (messageId + timestamp + body) used as the HMAC input
 */
function getHmacMessage(
  messageId: string,
  timestamp: string,
  body: string
): string {
  return messageId + timestamp + body;
}

function getHmac(secret: string, message: string): string {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function verifyMessage(
  hmac: string,
  verifySignature: string
): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(verifySignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.TWITCH_EVENTSUB_SECRET;

    if (!secret) {
      console.error("TWITCH_EVENTSUB_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const messageId = request.headers.get(TWITCH_MESSAGE_ID);
    const timestamp = request.headers.get(TWITCH_MESSAGE_TIMESTAMP);
    const messageSignature = request.headers.get(TWITCH_MESSAGE_SIGNATURE);
    const messageType = request.headers.get(TWITCH_MESSAGE_TYPE);

    if (!messageId || !timestamp || !messageSignature || !messageType) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    // Verify the message signature
    const hmacMessage = getHmacMessage(messageId, timestamp, rawBody);
    const hmac = HMAC_PREFIX + getHmac(secret, hmacMessage);

    if (!verifyMessage(hmac, messageSignature)) {
      console.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);

    // Handle different message types
    switch (messageType) {
      case MESSAGE_TYPE_VERIFICATION:
        // Respond with challenge for webhook verification
        console.log("Twitch webhook verification:", body.challenge);
        return new NextResponse(body.challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });

      case MESSAGE_TYPE_NOTIFICATION:
        await handleNotification(body);
        return NextResponse.json({ success: true }, { status: 200 });

      case MESSAGE_TYPE_REVOCATION:
        console.log("Twitch webhook revoked:", body.subscription);
        return NextResponse.json({ success: true }, { status: 200 });

      default:
        console.log("Unknown message type:", messageType);
        return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error) {
    console.error("Error processing Twitch webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Process a Twitch EventSub notification and apply corresponding updates to the streamer_config table in Supabase.
 *
 * Handles the following subscription types:
 * - `stream.online`: marks the streamer as live, updates stream title and Twitch user ID, and sets timestamps.
 * - `stream.offline`: marks the streamer as offline, clears stream-specific fields, and sets timestamps.
 * - `channel.update`: updates the stream title and sets timestamps.
 *
 * @param body - EventSub payload containing `subscription.type` (the EventSub notification type) and `event` (streamer identifiers and metadata such as `broadcaster_user_login`, `broadcaster_user_name`, `broadcaster_user_id`, `title`, `viewer_count`, and timestamps). The function updates rows in `streamer_config` where `twitch_username` equals `event.broadcaster_user_login.toLowerCase()`.
 */
async function handleNotification(body: {
  subscription: { type: string };
  event: {
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    type?: string;
    started_at?: string;
    title?: string;
    viewer_count?: number;
  };
}) {
  const { subscription, event } = body;
  const supabase = getSupabaseAdmin();

  console.log(`Twitch notification: ${subscription.type}`, event);

  switch (subscription.type) {
    case "stream.online":
      // Stream went online
      await supabase
        .from("streamer_config")
        .update({
          is_live_twitch: true,
          twitch_stream_title: event.title || null,
          twitch_user_id: event.broadcaster_user_id,
          last_twitch_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("twitch_username", event.broadcaster_user_login.toLowerCase());

      console.log(`Stream online: ${event.broadcaster_user_name}`);
      break;

    case "stream.offline":
      // Stream went offline
      await supabase
        .from("streamer_config")
        .update({
          is_live_twitch: false,
          twitch_stream_title: null,
          twitch_viewer_count: null,
          last_twitch_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("twitch_username", event.broadcaster_user_login.toLowerCase());

      console.log(`Stream offline: ${event.broadcaster_user_name}`);
      break;

    case "channel.update":
      // Channel info updated (title, category, etc.)
      await supabase
        .from("streamer_config")
        .update({
          twitch_stream_title: event.title || null,
          last_twitch_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("twitch_username", event.broadcaster_user_login.toLowerCase());

      console.log(`Channel updated: ${event.broadcaster_user_name}`);
      break;

    default:
      console.log(`Unhandled event type: ${subscription.type}`);
  }
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({ status: "ok", service: "twitch-webhook" });
}
