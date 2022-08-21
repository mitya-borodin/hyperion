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
    purgeTestDatabase: boolean;
  };

  public readonly gracefullyShutdownMs: number;
  public readonly mosquitto: {
    host: string;
    port: number;
    protocol: "wss" | "ws" | "mqtt" | "mqtts" | "tcp" | "ssl" | "wx" | "wxs";
    username: string;
    password: string;
  };

  constructor() {
    this.appName = process.env.APP_NAME ?? os.hostname();
    this.production = process.env.NODE_ENV === "production";

    this.log = {
      level: this.toLogLevel(process.env.LOG_LEVEL),
    };

    this.fastify = {
      host: process.env.FASTIFY_HOST ?? "localhost",
      port: this.toInt(process.env.FASTIFY_PORT ?? "", 3000),
      log: {
        level: this.toLogLevel(process.env.FASTIFY_LOG_LEVEL),
      },
    };

    this.rethinkdb = {
      host: process.env.RETHINKDB_HOST ?? "localhost",
      port: this.toInt(process.env.RETHINKDB_PORT ?? "", 28015),
      purgeTestDatabase: !!process.env.PURGE_TEST_DATABASE,
    };

    this.gracefullyShutdownMs = this.toInt(process.env.GRACEFULLY_SHUTDOWN_MS ?? "", 5000);

    this.mosquitto = {
      host: process.env.MOSQUITTO_HOST ?? "192.168.1.75",
      port: this.toInt(process.env.MOSQUITTO_PORT ?? "", 1883),
      protocol: this.toMosquittoProtocol(process.env.MOSQUITTO_PORT ?? "mqtt"),
      username: process.env.MOSQUITTO_USERNAME ?? "",
      password: process.env.MOSQUITTO_PASSWORD ?? "",
    };
  }

  private toInt(mayBeNumber: string, defaultValue: number): number {
    const number = parseInt(mayBeNumber);

    if (Number.isSafeInteger(number)) {
      return number;
    }

    return defaultValue;
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

  private toMosquittoProtocol(
    protocol?: string,
  ): "wss" | "ws" | "mqtt" | "mqtts" | "tcp" | "ssl" | "wx" | "wxs" {
    if (protocol === "wss") {
      return "wss";
    }

    if (protocol === "ws") {
      return "ws";
    }

    if (protocol === "mqtt") {
      return "mqtt";
    }

    if (protocol === "mqtts") {
      return "mqtts";
    }

    if (protocol === "tcp") {
      return "tcp";
    }

    if (protocol === "ssl") {
      return "ssl";
    }

    if (protocol === "wx") {
      return "wx";
    }

    if (protocol === "wxs") {
      return "wxs";
    }

    return "mqtt";
  }
}

export const config = new Config();
