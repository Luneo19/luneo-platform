// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: "https://9b98e0a9e22c4d2f88b22edf3d1c7ddf@o4509948310519808.ingest.de.sentry.io/4509948332998736",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
  // Enable logs to be sent to Sentry
  enableLogs: true,
  
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  // Environment configuration
  environment: process.env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Profiling
  profilesSampleRate: 1.0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
});
