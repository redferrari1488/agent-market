import pino, { type LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");

const baseConfig: LoggerOptions = {
  level,
  base: { app: "hireon", env: process.env.NODE_ENV ?? "development" },
  redact: {
    paths: [
      "password",
      "secret",
      "token",
      "apiKey",
      "api_key",
      "*.password",
      "*.secret",
      "*.token",
      "*.apiKey",
      "*.api_key",
      // BetterAuth / handler error bodies — токены и пароли часто оказываются
      // на 2-3 уровне вложенности, top-level `*.token` их не покрывает.
      "*.*.password",
      "*.*.secret",
      "*.*.token",
      "*.*.apiKey",
      "*.*.api_key",
      "body.password",
      "body.secret",
      "body.token",
      "req.body.password",
      "req.body.secret",
      "req.body.token",
      "errBody.password",
      "errBody.token",
      "errBody.session.token",
      "session.token",
      "session.session.token",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.headers.authorization",
      "*.headers.cookie",
    ],
    remove: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

const config: LoggerOptions = isProd
  ? baseConfig
  : {
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname,app,env",
        },
      },
    };

export const logger = pino(config);
