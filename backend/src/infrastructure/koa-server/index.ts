import pino from "koa-pino-logger";

import type { IUserRepository } from "../../domain/user";
import { createAuthenticateRouter } from "../../interfaces/http/authenticate";
import { createUserRouter } from "../../interfaces/http/user";
import { config } from "../config";

import { KoaServer } from "./koa-server";
import { getAuthenticateMiddleware } from "./middlewares/authenticate";

type CreateKoaServerParams = {
  userRepository: IUserRepository;
};

export const createKoaServer = ({ userRepository }: CreateKoaServerParams) => {
  const koaServer = new KoaServer(config);

  koaServer.useMiddleware(pino({ useLevel: "trace" }));
  //koaServer.useMiddleware(getStaticFilesMiddleware([config.files.directoryForWebappFiles]));

  koaServer.useMiddleware(getAuthenticateMiddleware(config, userRepository));

  koaServer.useRouter(createAuthenticateRouter({ config, userRepository }));
  koaServer.useRouter(createUserRouter({ userRepository }));

  return koaServer;
};
