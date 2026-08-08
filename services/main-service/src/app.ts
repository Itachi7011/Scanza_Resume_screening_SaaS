import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";
import { stripeWebhookHandler } from "./controllers/webhook.controller";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    // Two audiences call this service: the Next.js frontend (cookies,
    // credentialed) and external SaaS clients (X-API-Key, any origin —
    // handled separately/more strictly inside apiKeyAuth's origin check).
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// Stripe's webhook signature verification needs the RAW request body, so
// this route is registered with express.raw() BEFORE the global
// express.json() parser runs — mounting order matters here.
app.post("/api/app/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(globalLimiter);

// Mounted under /api/app so it lines up with the Next.js rewrite rule for
// everything that ISN'T auth (see frontend/next.config.js).
app.use("/api/app", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
