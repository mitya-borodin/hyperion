declare module "sharedb-mongo";

/* eslint-disable no-unused-vars */
import { Files } from "formidable";
import type Koa from "koa";

import { User } from "../infrastructure/types/user";

declare module "koa" {
  interface Request extends Koa.BaseRequest {
    user: User | null;
    files: Files;
    body: { [key: string]: unknown };
  }
}
