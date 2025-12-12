import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  // Em dev, usar host direto; em prod, usar proxy para evitar adblockers
  api_host: process.env.NODE_ENV === "development"
    ? "https://us.i.posthog.com"
    : "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: '2025-05-24',
  capture_exceptions: true,
  debug: process.env.NODE_ENV === "development",
});