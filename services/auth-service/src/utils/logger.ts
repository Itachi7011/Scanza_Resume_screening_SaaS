/* Minimal structured logger — swap for pino/winston later if needed. */
const timestamp = () => new Date().toISOString();

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(`[${timestamp()}] [INFO] [auth-service] ${msg}`, meta ?? ""),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(`[${timestamp()}] [WARN] [auth-service] ${msg}`, meta ?? ""),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(`[${timestamp()}] [ERROR] [auth-service] ${msg}`, meta ?? ""),
};
