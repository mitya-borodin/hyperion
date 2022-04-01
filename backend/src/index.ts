import { PrismaClient } from "@prisma/client";
import type { Files } from "formidable";
import type Koa from "koa";

import { config } from "./infrastructure/config";
import { createKoaServer } from "./infrastructure/koa-server";
import { UserRepository } from "./infrastructure/prisma/user-repository";
import { sharedb } from "./infrastructure/sharedb";
/* eslint-disable no-unused-vars */
import type { User } from "./infrastructure/types/user";

(async () => {
  const prisma = new PrismaClient();

  const userRepository = new UserRepository(prisma, config);

  const koaServer = createKoaServer({ userRepository });

  console.log(2133444);

  await sharedb.run();
  await koaServer.run();
})();

// declare module "sharedb-mongo";
declare module "koa" {
  interface Request extends Koa.BaseRequest {
    user: User | null;
    files: Files;
    body: { [key: string]: unknown };
  }
}
