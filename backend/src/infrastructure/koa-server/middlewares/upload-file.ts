import fs from "fs";
import path from "path";
import { promisify } from "util";

import type Koa from "koa";
import pino from "pino";
import typeIs from "type-is";

import { SizeControllerStream } from "./size-controller-stream";

const logger = pino({ name: "upload-files-middleware", level: "trace" });

const exists = promisify(fs.exists);

export const uploadFileMiddleware = async (
  ctx: Koa.Context,
  destinationDirectory: string,
  fileName: string,
  config = {
    maxFileSize: 10 * 1024 * 1024, // 10 mb
    mimeTypes: ["image/gif", "image/jpeg", "image/pjpeg", "image/png", "image/webp", "image/heic"],
  },
): Promise<void> => {
  if (!(await exists(destinationDirectory))) {
    const message = "Destination directory isn't exist";

    logger.error({ destinationDirectory }, message);

    ctx.throw(500, message);
  }

  if (await exists(path.resolve(destinationDirectory, fileName))) {
    const message = "File already exist";

    logger.error({ destinationDirectory, fileName }, message);

    ctx.throw(500, `message`);
  }

  // * Getting Headers
  const contentLength = parseInt(ctx.req.headers["content-length"] || "0");
  const mimeType = ctx.req.headers["content-type"];

  if (
    !Number.isSafeInteger(contentLength) ||
    (Number.isSafeInteger(contentLength) && contentLength === 0)
  ) {
    const message = "Content-Light must be Number and more then zero";

    logger.error({ destinationDirectory, fileName, contentLength, mimeType }, message);

    ctx.throw(500, message);
  }

  if (contentLength > config.maxFileSize) {
    const message = "Content-Light more then max file size";

    logger.error(
      { destinationDirectory, fileName, contentLength, mimeType, maxFileSize: config.maxFileSize },
      message,
    );

    ctx.throw(413, message);
  }

  if (
    Array.isArray(config.mimeTypes) &&
    config.mimeTypes.length > 0 &&
    !typeIs(ctx.req, config.mimeTypes)
  ) {
    const message = "Mime type does not match valid values";
    logger.error(
      {
        destinationDirectory,
        fileName,
        contentLength,
        mimeType,
        validMimeType: config.mimeTypes.join(", "),
      },
      message,
    );

    ctx.throw(422, message);
  }

  return new Promise((resolve, reject) => {
    ctx.req.on("error", (error: Error): void => {
      reject(error);
    });

    ctx.res.on("error", (error: Error): void => {
      reject(error);
    });

    ctx.req.on("abort", () => {
      reject(new Error("Request has been aborted by the client."));
    });

    ctx.req.on("aborted", () => {
      reject(new Error("Request has been aborted."));
    });

    // * Green Zone
    const sizeControllerStream = new SizeControllerStream();

    sizeControllerStream.on("progress", () => {
      if (sizeControllerStream.bytes > config.maxFileSize) {
        const message = "More data is received than is allowed";
        logger.error(
          {
            destinationDirectory,
            fileName,
            contentLength,
            mimeType,
            maxFileSize: config.maxFileSize,
          },
          message,
        );

        ctx.throw(500, message);
      }
    });

    const destinationStream = fs.createWriteStream(path.resolve(destinationDirectory, fileName));

    destinationStream.on("finish", () => {
      resolve();
    });

    destinationStream.on("error", (error: Error): void => {
      reject(error);
    });

    ctx.req.pipe(sizeControllerStream).pipe(destinationStream);
  });
};
