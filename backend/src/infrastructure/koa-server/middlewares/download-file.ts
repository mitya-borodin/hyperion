import crypto from "crypto";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import { fromStream } from "file-type";
import type Koa from "koa";
import pino from "pino";

const logger = pino({ name: "download-file-middleware", level: "trace" });

const exists = promisify(fs.exists);
const stat = promisify(fs.stat);

export const downloadFileMiddleware = async (
  ctx: Koa.Context,
  sourceFilePath: string,
): Promise<void> => {
  logger.trace(`An attempt to download a file has begun`);

  if (!(await exists(sourceFilePath))) {
    const message = `Source file isn't exist`;

    logger.error({ sourceFilePath }, message);

    ctx.throw(500, message);
  }

  const fileStat = await stat(sourceFilePath);

  if (fileStat.isDirectory()) {
    const message = `Source file is directory`;

    logger.error({ sourceFilePath }, message);

    ctx.throw(400, message);
  }

  try {
    const fileType = await fromStream(fs.createReadStream(sourceFilePath));

    if (fileType) {
      logger.debug({ sourceFilePath, fileType }, `Detected file type`);

      const fileName = path.basename(sourceFilePath);
      const fileExtension = path.extname(sourceFilePath);
      const fileNameWithOutExt = fileName.replace(fileExtension, "");

      ctx.attachment(`${fileNameWithOutExt}.${fileType.ext}`);
      ctx.type = fileType.mime;
    } else {
      logger.debug({ sourceFilePath }, `Type of file wasn't detected`);

      ctx.attachment(path.basename(sourceFilePath));
    }

    ctx.set("Accept-Ranges", "bytes");
    ctx.set("Cache-Control", "no-cache, no-store, no-transform");
    ctx.length = fileStat.size;
    ctx.lastModified = fileStat.mtime;
    ctx.etag = crypto
      .createHash("md5")
      .update(
        `${fileStat.mtime.toUTCString()} - ${path.basename(sourceFilePath)} - ${String(
          fileStat.size,
        )}`,
      )
      .digest("hex");

    logger.info(
      { sourceFilePath, fileStat },
      `A file reading stream has been created, which means that the file is being downloaded successfully`,
    );

    ctx.body = fs.createReadStream(sourceFilePath);
  } catch (error) {
    let message = "Unexpected server error";

    if (error instanceof Error) {
      message = error.message;
    }

    logger.error({ error }, message);

    ctx.throw(500, message);
  }
};
