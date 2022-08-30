import os from "os";
import path from "path";

import dotenv from "dotenv";

const rootDir = path.resolve(__dirname, "../../..");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(rootDir, ".env"), debug: true });
}

export class Config {
  public readonly appName: string;
  public readonly production: boolean;

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
