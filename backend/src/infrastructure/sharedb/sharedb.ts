import http, { Server } from "http";

import express from "express";
import type * as core from "express-serve-static-core";
import { MongoClient } from "mongodb";
import pino from "pino";
import WebSocket from "ws";

import type { Config } from "../config";

import { createSharedbBackend } from "./create-sharedb-backend";
import { WebSocketJSONStream } from "./web-socket-json-stream";

const logger = pino({ name: "sharedb-backend", level: "trace" });

export class Sharedb {
  private hasBeenRun: boolean;
  private config: Config;
  private app: core.Express;
  private server: Server;
  private webSocketServer: WebSocket.Server;

  #backend: any | null;

  constructor(config: Config) {
    this.hasBeenRun = false;
    this.config = config;

    this.app = express();
    this.server = http.createServer(this.app);
    this.webSocketServer = new WebSocket.Server({ server: this.server });

    this.#backend = null;
  }

  public async run(): Promise<void> {
    try {
      if (!this.hasBeenRun) {
        const sharedbBackend = await this.#createShareDbBackend();

        this.webSocketServer.on("connection", (webSocket: WebSocket) => {
          const webSocketJSONStream = new WebSocketJSONStream(webSocket);

          if (sharedbBackend) {
            sharedbBackend.listen(webSocketJSONStream);
          }
        });

        this.server.listen(this.config.shareDb.port, this.config.shareDb.host);

        this.hasBeenRun = true;

        return;
      }

      if (this.hasBeenRun) {
        logger.warn("Server has been run, please check why you try to run this server");
      }
    } catch (error) {
      logger.error({ error }, "Unexpected error");
    }
  }

  public stop(): void {
    if (this.hasBeenRun) {
      this.server.close();
      this.hasBeenRun = false;

      return;
    }

    if (!this.hasBeenRun) {
      logger.warn(
        "The server was not started, please check why you are trying to stop the already stopped server",
      );
    }
  }

  async #createShareDbBackend(): Promise<any> {
    if (this.#backend === null) {
      const mongodbClient = await this.#createMongodbClient(this.config.shareDb.url);

      logger.debug("An attempt to create a shared backend has begun");

      this.#backend = await createSharedbBackend(mongodbClient);

      logger.debug("The attempt to create a shared backend was successful");
    }

    logger.info("ShareDB backend is running");

    return this.#backend;
  }

  #createMongodbClient = async (URI = "mongodb://localhost:27017"): Promise<MongoClient> => {
    logger.debug({ URI }, `Connection to mongodb was established by URI`);

    const client = await MongoClient.connect(URI);

    // Establish and verify connection
    await client.db("admin").command({ ping: 1 });

    logger.info({ URI }, "The connection was successfully established by URI");

    return client;
  };
}
