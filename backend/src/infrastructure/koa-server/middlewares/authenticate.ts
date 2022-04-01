/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import type Koa from "koa";
import pino from "pino";

import { createGetUserByIdCommand } from "../../../application/user/get-user-by-id";
import { createHasRefreshSessionCommand } from "../../../application/user/has-refresh-token";
import type { IUserRepository, User } from "../../../domain/user";
import { getRefreshTokenCookie } from "../../../utils/refresh-token";
import type { Config } from "../../config";

const logger = pino({ name: "authentication-middleware", level: "trace" });

export const getAuthenticateMiddleware = (
  config: Config,
  userRepository: IUserRepository,
): Koa.Middleware => {
  return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
    const authorization = ctx.headers["Authorization"] || ctx.headers["authorization"];

    ctx.request.user = null;

    if (!authorization) {
      logger.trace("The header 'Authorization or authorization' was not set");

      return await next();
    }

    if (Array.isArray(authorization)) {
      logger.debug("The 'Authorization or authorization' header must be a string");

      return await next();
    }

    if (!authorization.includes("Bearer ")) {
      logger.debug("The 'Authorization or authorization' header doesn't have 'Bearer '");

      return await next();
    }

    const accessToken = authorization.replace("Bearer ", "");

    let payload = null;

    try {
      payload = jwt.verify(accessToken, config.tokenSettings.jwtSecretKey, {
        maxAge: config.tokenSettings.accessTokenTTLMs,
      });
    } catch (error) {
      logger.error({ error }, "Token verification failed");

      ctx.throw(StatusCodes.FORBIDDEN);
    }

    if (typeof payload !== "string" && payload.userId) {
      logger.info({ payload }, "Token verification completed successfully");

      const getUserById = createGetUserByIdCommand(userRepository);

      const user: User | null = await getUserById({ userId: parseInt(payload.userId) });

      if (user) {
        const refreshToken = getRefreshTokenCookie(ctx);

        if (!refreshToken) {
          logger.info({ user }, "Authentication was failed");

          ctx.throw(StatusCodes.FORBIDDEN);
        }

        const hasRefreshSessionCommand = createHasRefreshSessionCommand(userRepository);

        if (!(await hasRefreshSessionCommand({ refreshToken }))) {
          logger.info({ user, refreshToken }, "Authentication was failed");

          ctx.throw(StatusCodes.FORBIDDEN);
        }

        ctx.request.user = user;

        logger.info({ user }, "Authentication was successful");

        return next();
      }

      logger.debug("Authentication was failed, user not found");
    }

    ctx.throw(StatusCodes.FORBIDDEN);
  };
};

export const checkUserMiddleware = (): Koa.Middleware => {
  return async (ctx: Koa.Context, next: Koa.Next): Promise<any> => {
    if (ctx.request.user === null) {
      logger.info("The user failed authentication");

      ctx.throw(403);
    }

    return next();
  };
};
