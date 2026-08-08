import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiter";

const app = express();

app.set("trust proxy", 1); // needed for correct req.ip behind Vercel/Render/etc. proxies

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(globalLimiter);

// Mounted under /api/auth so it lines up 1:1 with the Next.js rewrite rule
// (see frontend/next.config.js) — the frontend only ever calls /api/auth/*.
app.use("/api/auth", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
