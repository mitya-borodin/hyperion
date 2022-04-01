import { StatusCodes } from "http-status-codes";
import type { Context } from "koa";
import Router from "koa-router";
import pino from "pino";

import { createGetUserByIdCommand } from "../../../application/user/get-user-by-id";
import type { IUserRepository } from "../../../domain/user";
import { config } from "../../../infrastructure/config";
import { getAuthenticateMiddleware } from "../../../infrastructure/koa-server/middlewares/authenticate";

import { mapToInterfaceUser } from "./userMapper";

const logger = pino({ name: "user-http-interface", level: "trace" });

type CreateUserRouter = {
  userRepository: IUserRepository;
};

export const createUserRouter = ({ userRepository }: CreateUserRouter) => {
  const userRouter = new Router();

  userRouter.get(
    "/user/me",
    getAuthenticateMiddleware(config, userRepository),
    async (ctx: Context) => {
      const { user } = ctx.request;

      if (user) {
        ctx.status = StatusCodes.OK;
        ctx.type = "application/json";
        ctx.body = user;

        logger.info({ user }, "The current user was received");

        return;
      }

      const message = "Current user not found";

      logger.info(message);

      ctx.throw(message, StatusCodes.NOT_FOUND);
    },
  );

  userRouter.post(
    "/user/by-id",
    getAuthenticateMiddleware(config, userRepository),
    async (ctx: Context) => {
      const { userId } = ctx.request.body;

      if (typeof userId !== "string" || !userId) {
        const message = "UserId isn't string or empty";

        logger.debug({ userId }, message);

        ctx.throw(message, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      const getUserByIdCommand = createGetUserByIdCommand(userRepository);

      const user = await getUserByIdCommand({ userId: parseInt(userId) });

      if (user) {
        ctx.status = StatusCodes.OK;
        ctx.type = "application/json";
        ctx.body = mapToInterfaceUser(user);

        logger.info({ user: ctx.body }, "User by id found");

        return;
      }

      const message = "User by id not found";

      logger.info(message);

      ctx.throw(message, StatusCodes.NOT_FOUND);
    },
  );

  return userRouter;
};
