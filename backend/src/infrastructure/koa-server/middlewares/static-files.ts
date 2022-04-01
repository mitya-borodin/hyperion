import fs from "fs";
import path from "path";
import { promisify } from "util";

import type { Context, Middleware, Next } from "koa";
import pino from "pino";

import { downloadFileMiddleware } from "./download-file";

const logger = pino({ name: "static-files-middleware", level: "trace" });

const exists = promisify(fs.exists);
const stat = promisify(fs.stat);

export const getStaticFilesMiddleware = (
  contentBases: string[],
  aliases: { [index: string]: string } = {},
  paramKey = "0",
): Middleware => {
  return async (ctx: Context, next: Next): Promise<void> => {
    logger.trace("An attempt to supply a file has begun");

    try {
      let originFilePath = ctx.params[paramKey];

      logger.trace({ originFilePath }, `Origin file path`);

      if (Object.prototype.hasOwnProperty.call(aliases, originFilePath)) {
        originFilePath = aliases[originFilePath];

        logger.trace({ originFilePath }, `Alias for file path`);
      }

      const outsidePathToFile = path.normalize(`/${originFilePath}`);

      logger.trace({ outsidePathToFile }, `Normalized file path`);

      for (const contentBase of contentBases) {
        if (!(await exists(contentBase))) {
          logger.error({ outsidePathToFile, contentBase }, `Content base directory isn't exist`);

          continue;
        }

        const pathToFile = path.join(contentBase, outsidePathToFile);

        if (!(await exists(pathToFile))) {
          logger.error({ pathToFile }, `File isn't exist`);

          continue;
        }

        const statsOfContent = await stat(pathToFile);

        if (statsOfContent.isDirectory()) {
          logger.error({ statsOfContent }, `The path you are looking for is a directory`);

          continue;
        }

        await downloadFileMiddleware(ctx, pathToFile);

        return;
      }

      await next();
    } catch (error) {
      let message = "Unexpected server error";

      if (error instanceof Error) {
        message = error.message;
      }

      logger.error({ error }, message);

      ctx.throw(500, message);
    }
  };
};
