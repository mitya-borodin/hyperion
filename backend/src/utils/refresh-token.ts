import { StatusCodes } from "http-status-codes";
import type { Context } from "koa";
import pino from "pino";

import { Config } from "../infrastructure/config";

const logger = pino({ name: "refresh-token", level: "trace" });

export const getRefreshTokenCookie = (ctx: Context) => {
  const refreshToken = ctx.cookies.get("refresh-token");

  if (!refreshToken) {
    logger.debug("'refresh-token' not found in cookies");

    ctx.throw(StatusCodes.FORBIDDEN);
  }

  return refreshToken;
};

export const setRefreshTokenCookie = (
  ctx: Context,
  config: Config,
  token: string,
  maxAge: number,
): void => {
  ctx.cookies.set("refresh-token", token, {
    httpOnly: true,
    domain: config.production ? ".objectd.io" : undefined,
    secure: config.production,
    path: "/authenticate",
    maxAge,
  });

  logger.debug("Refresh-token cookie was set");
};

export const unsetRefreshTokenCookie = (ctx: Context, config: Config): void => {
  ctx.cookies.set("refresh-token", "", {
    httpOnly: true,
    domain: config.production ? ".objectd.io" : undefined,
    secure: config.production,
    path: "/api/authenticate",
    overwrite: true,
  });

  logger.debug("Refresh-token cookie was cleared");
};
