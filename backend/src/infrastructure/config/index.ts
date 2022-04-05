import path from "path";

import dotenv from "dotenv";
import pino, { Level } from "pino";

const logger = pino({ name: "config", level: "trace" });

const rootDir = path.resolve(__dirname, "../../..");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(rootDir, ".env"), debug: true });
}

export class Config {
  public readonly production: boolean;
  public readonly log: {
    level: Level;
  };
  public readonly fastify: {
    host: string;
    port: string;
  };
  public readonly rethinkdb: {
    host: string;
    port: string;
  };

  public readonly gracefullyShutdownMs: string;

  constructor() {
    this.production = process.env.NODE_ENV === "production";

    this.log = {
      level: this.toLogLevel(process.env.LOG_LEVEL),
    };

    this.fastify = {
      host: process.env.FASTIFY_HOST ?? "localhost",
      port: process.env.FASTIFY_PORT ?? "3000",
    };

    this.rethinkdb = {
      host: process.env.RETHINKDB_HOST ?? "localhost",
      port: process.env.RETHINKDB_PORT ?? "28015",
    };

    if (!this.production) {
      logger.info(this, "Application configuration");
    }

    this.gracefullyShutdownMs = process.env.GRACEFULLY_SHUTDOWN_MS ?? "1000";
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

    return "debug";
  }
}

export const config = new Config();
