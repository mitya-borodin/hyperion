import os from "os";
import path from "path";

import dotenv from "dotenv";
import type { Level } from "pino";

const rootDir = path.resolve(__dirname, "../../..");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(rootDir, ".env"), debug: true });
}

export class Config {
  public readonly appName: string;
  public readonly production: boolean;

  public readonly log: {
    level: Level;
  };

  public readonly fastify: {
    host: string;
    port: number;
    log: {
      level: Level;
    };
  };

  public readonly rethinkdb: {
    host: string;
    port: number;
  };

  public readonly gracefullyShutdownMs: number;

  constructor() {
    this.appName = process.env.APP_NAME ?? os.hostname();
    this.production = process.env.NODE_ENV === "production";

    this.log = {
      level: this.toLogLevel(process.env.LOG_LEVEL),
    };

    this.fastify = {
      host: process.env.FASTIFY_HOST ?? "localhost",
      port: parseInt(process.env.FASTIFY_PORT ?? "3000"),
      log: {
        level: this.toLogLevel(process.env.FASTIFY_LOG_LEVEL),
      },
    };

    if (!Number.isSafeInteger(this.fastify.port)) {
      this.fastify.port = 1000;
    }

    this.rethinkdb = {
      host: process.env.RETHINKDB_HOST ?? "localhost",
      port: parseInt(process.env.RETHINKDB_PORT ?? "28015"),
    };

    if (!Number.isSafeInteger(this.rethinkdb.port)) {
      this.rethinkdb.port = 1000;
    }

    this.gracefullyShutdownMs = parseInt(process.env.GRACEFULLY_SHUTDOWN_MS ?? "5000");

    if (!Number.isSafeInteger(this.gracefullyShutdownMs)) {
      this.gracefullyShutdownMs = 5_000;
    }
  }

  private toLogLevel(level?: string): Level {
    if (level === "fatal") {
      return "fatal";
    }

    if (level === "error") {
      return "error";
    }

    if (level === "warn") {
      return "warn";
    }

    if (level === "info") {
      return "info";
    }

    if (level === "debug") {
      return "debug";
    }

    if (level === "trace") {
      return "trace";
    }

    return "info";
  }
}

export const config = new Config();
