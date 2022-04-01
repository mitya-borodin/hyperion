import { StatusCodes } from "http-status-codes";
import type { Context } from "koa";
import Router from "koa-router";
import pino from "pino";

import { createActivateUserCommand } from "../../../application/user/activate-user";
import { createCreateUserCommand } from "../../../application/user/create-user";
import { createLoginCommand } from "../../../application/user/login";
import { createLogoutCommand } from "../../../application/user/logout";
import { createRefreshTokenCommand } from "../../../application/user/refresh-token";
import type { IUserRepository } from "../../../domain/user";
import type { Config } from "../../../infrastructure/config";
import { getAuthenticateMiddleware } from "../../../infrastructure/koa-server/middlewares/authenticate";
import { getBodyParseMiddleware } from "../../../infrastructure/koa-server/middlewares/body-parse";

const logger = pino({ name: "authentication-http-interface", level: "trace" });

const getRefreshTokenCookie = (ctx: Context) => {
  const refreshToken = ctx.cookies.get("refresh-token");

  if (!refreshToken) {
    logger.debug("'refresh-token' not found in cookies");

    ctx.throw(StatusCodes.FORBIDDEN);
  }

  return refreshToken;
};

const setRefreshTokenCookie = (
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

const unsetRefreshTokenCookie = (ctx: Context, config: Config): void => {
  ctx.cookies.set("refresh-token", "", {
    httpOnly: true,
    domain: config.production ? ".objectd.io" : undefined,
    secure: config.production,
    path: "/api/authenticate",
    overwrite: true,
  });

  logger.debug("Refresh-token cookie was cleared");
};

type CreateAuthenticateRouter = {
  config: Config;
  userRepository: IUserRepository;
};

export const createAuthenticateRouter = ({ config, userRepository }: CreateAuthenticateRouter) => {
  const authenticateRouter = new Router();

  authenticateRouter.post(
    "/authenticate/create-user",
    getBodyParseMiddleware(),
    async (ctx: Context) => {
      const { login, password, confirmPassword, fingerprint } = ctx.request.body;

      if (typeof login !== "string" || !login) {
        const message = "Login isn't string or empty string";

        logger.debug({ email: login }, message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      if (typeof password !== "string" || !password) {
        const message = "Password isn't string or empty string";

        logger.debug(message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      if (typeof confirmPassword !== "string" || !confirmPassword) {
        const message = "Password confirmation isn't string or empty string";

        logger.debug(message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      if (password !== confirmPassword) {
        const message = "Password confirmation doesn't match with password";

        logger.debug(message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      if (typeof fingerprint !== "string" || !fingerprint) {
        const message = "Fingerprint isn't string or empty string";

        logger.debug({ fingerprint }, message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      const createUserCommand = createCreateUserCommand(userRepository);

      const isUserCreated = await createUserCommand({
        email: login,
        password,
        confirmPassword,
        fingerprint,
      });

      if (isUserCreated) {
        ctx.status = StatusCodes.OK;
      } else {
        ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
      }
    },
  );

  authenticateRouter.get("/authenticate/activate-user/:confirmEmailIdent", async (ctx: Context) => {
    const { confirmEmailIdent } = ctx.params;

    if (typeof confirmEmailIdent !== "string" || !confirmEmailIdent) {
      const message = "Confirm email ident isn't string or empty string";

      logger.debug({ confirmEmailIdent }, message);

      ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const activateUserCommand = createActivateUserCommand(userRepository);

    const isUserActivated = await activateUserCommand({ confirmEmailIdent });

    if (isUserActivated) {
      ctx.status = StatusCodes.OK;
    } else {
      ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
    }
  });

  authenticateRouter.post("/authenticate/login", getBodyParseMiddleware(), async (ctx: Context) => {
    const { login, password, fingerprint } = ctx.request.body;

    if (typeof login !== "string" || !login) {
      const message = "Login is empty";

      logger.debug({ email: login }, message);

      ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    if (typeof password !== "string" || !password) {
      const message = "Password is empty";

      logger.debug(message);

      ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    if (typeof fingerprint !== "string" || !fingerprint) {
      const message = "Fingerprint is empty";

      logger.debug({ fingerprint }, message);

      ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const loginCommand = createLoginCommand(userRepository);

    const token = await loginCommand({ email: login, password, fingerprint });

    if (token === null) {
      logger.error({ email: login, fingerprint }, "Authentication failed");

      ctx.status = StatusCodes.FORBIDDEN;

      return;
    }

    setRefreshTokenCookie(ctx, config, token.refreshToken, config.tokenSettings.refreshTokenTTLMs);

    ctx.status = StatusCodes.OK;
    ctx.type = "text/plain";
    ctx.body = token.accessToken;

    logger.info("Authentication completed successfully");
  });

  authenticateRouter.post(
    "/authenticate/refresh-tokens",
    getAuthenticateMiddleware(config, userRepository),
    getBodyParseMiddleware(),
    async (ctx: Context) => {
      const { fingerprint } = ctx.request.body;

      if (typeof fingerprint !== "string" || !fingerprint) {
        const message = "Fingerprint is empty";

        logger.debug({ fingerprint }, message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      const refreshToken = getRefreshTokenCookie(ctx);

      const refreshTokenCommand = createRefreshTokenCommand(userRepository);

      const token = await refreshTokenCommand({ refreshToken, fingerprint });

      if (token === null) {
        unsetRefreshTokenCookie(ctx, config);

        logger.info({ refreshToken, fingerprint }, "The token was not refreshed");

        ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;

        return;
      }

      setRefreshTokenCookie(
        ctx,
        config,
        token.refreshToken,
        config.tokenSettings.refreshTokenTTLMs,
      );

      ctx.status = StatusCodes.OK;
      ctx.type = "text/plain";
      ctx.body = token.accessToken;

      logger.info("The token has been refreshed");
    },
  );

  authenticateRouter.post(
    "/authenticate/logout",
    getAuthenticateMiddleware(config, userRepository),
    async (ctx: Context) => {
      const userId = ctx.request.user?.id;

      if (!userId) {
        logger.debug({ userId }, "When trying to logout, the current userId was not found");

        ctx.throw("Unexpected error", StatusCodes.INTERNAL_SERVER_ERROR);
      }

      try {
        const logoutCommand = createLogoutCommand(userRepository);

        await logoutCommand({
          userId,
          refreshSessionId: getRefreshTokenCookie(ctx),
        });

        ctx.status = StatusCodes.OK;

        logger.info({ userId }, "Logout was successfully");
      } catch (error) {
        let message = "Unexpected error";

        if (error instanceof Error) {
          message = error.message;
        }

        logger.error({ error }, message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      unsetRefreshTokenCookie(ctx, config);
    },
  );

  return authenticateRouter;
};
