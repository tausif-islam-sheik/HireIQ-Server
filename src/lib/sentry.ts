import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      release: process.env.RELEASE || "1.0.0",
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      beforeSend(event) {
        // Don't send sensitive user data
        const data = event.request?.data as { password?: string } | undefined;
        if (data?.password) {
          delete data.password;
        }
        return event;
      },
    });
    console.log("✅ Sentry initialized for error tracking");
  }
}

// Export Handlers separately for Express middleware
export { Sentry };
export const sentryErrorHandler = () => {
  // Sentry v10+ uses different API - wrap in try-catch
  try {
    // @ts-ignore - Handlers may not exist in all versions
    return Sentry.Handlers?.errorHandler?.() || ((err: unknown, req: unknown, res: unknown, next: unknown) => next && (next as Function)());
  } catch {
    return (err: unknown, req: unknown, res: unknown, next: unknown) => next && (next as Function)();
  }
};
