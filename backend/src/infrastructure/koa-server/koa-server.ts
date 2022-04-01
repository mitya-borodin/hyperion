import type { Server } from "http";
import type { AddressInfo } from "net";

import Koa from "koa";
import type Router from "koa-router";
import pino from "pino";

import type { Config } from "../config";

const logger = pino({ name: "koa-server", level: "trace" });

export class KoaServer {
  private hasBeenRun: boolean;
  private config: Config;
  private httpServer: Server | undefined;
  private app: Koa;

  constructor(config: Config) {
    this.hasBeenRun = false;
    this.config = config;
    this.app = new Koa();
  }

  public useMiddleware(middleware: Koa.Middleware): void {
    this.app.use(middleware);
  }

  public useRouter(router: Router): void {
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());
  }

  public async run(): Promise<void> {
    try {
      if (!this.hasBeenRun) {
        await new Promise((resolve) => {
          this.httpServer = this.app.listen(
            this.config.httpApiServer.port,
            this.config.httpApiServer.host,
            () => {
              if (!this.httpServer) {
                return;
              }

              const addressInfo: AddressInfo | string | null = this.httpServer.address();

              if (addressInfo && typeof addressInfo !== "string") {
                logger.info(
                  `Koa server is running on http://${addressInfo.address}:${addressInfo.port}`,
                );
              }

              this.hasBeenRun = true;
              resolve(undefined);
            },
          );
        });

        return;
      }

      if (this.hasBeenRun) {
        logger.warn("Koa server has been run, please check why you try to run this server");
      }
    } catch (error) {
      logger.error({ error }, "Unexpected error");
    }
  }

  public stop(): void {
    if (this.httpServer && this.hasBeenRun) {
      this.httpServer.close();
      this.hasBeenRun = false;

      logger.info("Koa server has been stopped");

      return;
    }

    if (this.httpServer && !this.hasBeenRun) {
      logger.warn(
        "The koa server was not started, please check why you are trying to stop the already stopped server",
      );
    }
  }
}
