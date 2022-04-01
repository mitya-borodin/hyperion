import path from "path";

import dotenv from "dotenv";
import pino from "pino";

const logger = pino({ name: "config", level: "trace" });

const rootDir = path.resolve(__dirname, "../../..");

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(rootDir, ".env"), debug: true });
}

export class Config {
  public readonly production: boolean;

  public readonly tokenSettings: {
    readonly jwtSecretKey: string;
    readonly accessTokenTTLMs: number;
    readonly refreshTokenTTLMs: number;
  };

  public readonly confirmEmailTTLMs: number;

  public readonly shareDb: {
    readonly url: string;
    readonly name: string;
    readonly auth?: {
      readonly user: string;
      readonly password: string;
    };
    readonly host: string;
    readonly port: number;
  };

  public readonly httpApiServer: {
    readonly host: string;
    readonly port: number;
  };

  public readonly files: {
    readonly directoryForUploadedFiles: string;
    readonly directoryForWebappFiles: string;
  };

  constructor() {
    this.production = process.env.NODE_ENV === "production";

    this.confirmEmailTTLMs = parseInt(process.env.CONFIRM_EMAIL_TTL_MS ?? String(60 * 60_000));

    this.tokenSettings = {
      jwtSecretKey: process.env.JWT_SECRET_KEY ?? "UNKNOWN_JWT_KEY",
      accessTokenTTLMs: parseInt(process.env.ACCESS_TOKEN_TTL_MS ?? String(5 * 60_000)),
      refreshTokenTTLMs: parseInt(process.env.REFRESH_TOKEN_TTL_MS ?? String(60 * 60_000)),
    };

    const shareDbUser = process.env.SHARE_DB_USER ?? "unknown_sharedb_user_name";
    const shareDbPassword = process.env.SHARE_DB_PASSWORD ?? "unknown_sharedb_user_password";
    const shareDbPort = parseInt(process.env.SHARE_DB_SERVER_PORT ?? "7071");

    this.shareDb = {
      url: process.env.SHARE_DB_URL ?? "mongodb://localhost:27017",
      name: process.env.SHARE_DB_NAME ?? "unnamed_sharedb_database",
      ...(shareDbUser && shareDbPassword
        ? { auth: { user: shareDbUser, password: shareDbPassword } }
        : {}),
      host: process.env.SHARE_DB_SERVER_HOST ?? "localhost",
      port: Number.isSafeInteger(shareDbPort) ? shareDbPort : 7071,
    };

    const httpApiServerPort = parseInt(process.env.HTTP_SERVER_PORT ?? "7072");

    this.httpApiServer = {
      host: process.env.HTTP_SERVER_HOST ?? "localhost",
      port: Number.isSafeInteger(httpApiServerPort) ? httpApiServerPort : 7072,
    };

    const directoryForUploadedFiles = path.resolve(
      rootDir,
      process.env.DIRECTORY_FOR_UPLOADED_FILES || "uploaded-files",
    );

    const directoryForWebappFiles = path.resolve(
      rootDir,
      process.env.DIRECTORY_FOR_WEBAPP_FILES || "webpack-files",
    );

    this.files = {
      directoryForUploadedFiles,
      directoryForWebappFiles,
    };

    if (!this.production) {
      logger.info(this, "Application configuration");
    }
  }
}

export const config = new Config();
