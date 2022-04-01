import type { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import pino from "pino";
import { v4 } from "uuid";

import type { IUserRepository, Token, User } from "../../../domain/user";
import { encryptPassword } from "../../../utils/encrypt-password";
import { getSalt } from "../../../utils/get-salt";
import type { Config } from "../../config";

import { mapToDomainUser } from "./userMapper";

const logger = pino({ name: "user-repository", level: "trace" });

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient, private config: Config) {}

  async createUser(email: string, password: string, confirmPassword: string): Promise<boolean> {
    if (password !== confirmPassword) {
      logger.debug({ email }, "The password does not match the confirmation password");

      return false;
    }

    const alreadyExistUser = await this.prisma.user.findUnique({
      select: { confirmEmail: true, status: true },
      where: { email },
    });

    const confirmEmailIdent = v4();

    if (alreadyExistUser !== null) {
      let message = "User already exist";

      if (alreadyExistUser.status === "CREATED") {
        message = `User already exist, but doesn't activated`;

        const { confirmEmail } = alreadyExistUser;

        if (confirmEmail) {
          if (confirmEmail?.createdAt.getTime() + confirmEmail?.ttl <= Date.now()) {
            message =
              "User already exist, but doesn't activated. Waiting time for email confirmation and glass, email confirmation will be re-created.";

            await this.prisma.user.update({
              where: { email },
              data: {
                confirmEmail: {
                  delete: true,
                  create: {
                    ttl: this.config.confirmEmailTTLMs,
                    uuid: confirmEmailIdent,
                  },
                },
              },
            });

            logger.debug({ email, confirmEmailIdent: confirmEmail?.uuid }, message);

            // TODO Отправить электронное письмо с подтверждением

            return true;
          }
        } else {
          await this.prisma.user.update({
            where: { email },
            data: {
              confirmEmail: {
                create: {
                  ttl: this.config.confirmEmailTTLMs,
                  uuid: confirmEmailIdent,
                },
              },
            },
          });

          logger.debug(
            { email },
            "The user has already been created, but no email confirmation has been created for him, email confirmation will be re-created.",
          );

          // TODO Отправить электронное письмо с подтверждением

          return true;
        }
      }

      if (alreadyExistUser.status === "ACTIVE") {
        message = `User already exist and has been activated`;
      }

      if (alreadyExistUser.status === "DELETED") {
        message = `User already exist and has been marked as deleted`;
      }

      if (alreadyExistUser.status === "BLOCKED") {
        message = `User already exist and has been blocked`;
      }

      logger.debug({ email, confirmEmailIdent: alreadyExistUser.confirmEmail?.uuid }, message);

      return false;
    }

    const salt = getSalt();

    await this.prisma.user.create({
      data: {
        email,
        password: encryptPassword(password, salt),
        salt,
        confirmEmail: {
          create: {
            ttl: this.config.confirmEmailTTLMs,
            uuid: confirmEmailIdent,
          },
        },
      },
    });

    logger.info(
      { email, confirmEmailIdent },
      "User was created, and email confirmation has been sent",
    );

    // TODO Отправить электронное письмо с подтверждением

    return true;
  }

  async activateUser(confirmEmailIdent: string): Promise<boolean> {
    const confirmEmail = await this.prisma.confirmEmail.findFirst({
      where: {
        uuid: confirmEmailIdent,
      },
    });

    if (confirmEmail === null) {
      logger.debug({ confirmEmailIdent }, "Confirmation for email doesn't found");

      return false;
    }

    if (confirmEmail?.createdAt.getTime() + confirmEmail?.ttl <= Date.now()) {
      logger.debug(
        { confirmEmailIdent, confirmEmail },
        "The waiting time for email confirmation has expired. Email confirmation record has been deleted",
      );

      await this.prisma.user.update({
        select: { id: true, refreshSession: true },
        where: { id: confirmEmail.userId },
        data: {
          confirmEmail: {
            delete: true,
          },
        },
      });

      return false;
    }

    const user = await this.prisma.user.update({
      select: { id: true, refreshSession: true },
      where: { id: confirmEmail.userId },
      data: {
        status: "ACTIVE",
        confirmEmail: {
          delete: true,
        },
      },
    });

    if (user.refreshSession.length > 1) {
      logger.error(
        {
          confirmEmailIdent,
          confirmEmail,
          refreshSessionAmount: user.refreshSession.length,
        },
        "At the time of user activation, he should not have one refreshSession",
      );

      return false;
    }

    logger.info(
      { userId: user.id, confirmEmailIdent },
      "User has been activated and email confirmation record has been deleted",
    );

    return true;
  }

  async login(email: string, password: string, fingerprint: string): Promise<Token | null> {
    const user = await this.prisma.user.findUnique({
      include: {
        refreshSession: true,
      },
      where: { email },
    });

    if (user === null) {
      logger.debug({ email, fingerprint }, "User not found");

      return null;
    }

    const hashedPassword = encryptPassword(password, user.salt);

    if (user.password !== hashedPassword) {
      logger.debug({ email, fingerprint }, "The password is not correct");

      return null;
    }

    const tokens = this.#createTokens(user.id);

    const refreshSession = await user.refreshSession.find(
      (refreshSession) => refreshSession.fingerprint === fingerprint,
    );

    if (refreshSession) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshSession: {
            update: {
              where: { id: refreshSession.id },
              data: {
                refreshToken: tokens.refreshToken,
                fingerprint,
                expiresIn: new Date(this.config.tokenSettings.refreshTokenTTLMs),
                createdAt: new Date(),
              },
            },
          },
        },
      });
    }

    if (!refreshSession) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshSession: {
            create: {
              refreshToken: tokens.refreshToken,
              fingerprint,
              expiresIn: new Date(this.config.tokenSettings.refreshTokenTTLMs),
            },
          },
        },
      });
    }

    logger.info(
      { email, fingerprint },
      "Authentication has been completed successfully, tokens have been generated",
    );

    return tokens;
  }

  async refreshToken(refreshToken: string, fingerprint: string): Promise<Token | null> {
    const refreshSession = await this.prisma.refreshSession.findUnique({ where: { refreshToken } });

    if (refreshSession === null) {
      logger.debug({ fingerprint }, "The refreshSession not found by refresh token");

      return null;
    }

    const refreshSessionByFingerprint = await this.prisma.refreshSession.findUnique({
      where: { fingerprint },
    });

    if (refreshSessionByFingerprint === null) {
      logger.warn(
        { refreshSession },
        "!!! Attention !!! The refreshSession could not be found by fingerprint, this is a hacker attack, all refreshSession will be deleted for user",
      );

      await this.prisma.user.update({
        where: { id: refreshSession.userId },
        data: {
          refreshSession: {
            deleteMany: {},
          },
        },
      });

      return null;
    }

    if (refreshSession.createdAt.getTime() + refreshSession.expiresIn.getTime() <= Date.now()) {
      logger.info(
        { fingerprint },
        "The refreshSession has expired and will be deleted by refresh token",
      );

      await this.prisma.user.update({
        where: { id: refreshSession.userId },
        data: {
          refreshSession: {
            delete: {
              id: refreshSession.id,
            },
          },
        },
      });

      return null;
    }

    const user = await this.prisma.user.findUnique({
      select: { id: true, refreshSession: true },
      where: { id: refreshSession.userId },
    });

    if (user === null) {
      logger.error(
        { fingerprint },
        "The user is not found, the refreshSession will be deleted. !!! Attention !!! This is a big problem since the refreshSession cannot exist without the user. This means that there were manual corrections in the database",
      );

      await this.prisma.refreshSession.delete({ where: { id: refreshSession.id } });

      return null;
    }

    const tokens = this.#createTokens(user.id);

    if (user.refreshSession.length > 5) {
      logger.warn(
        { userId: user.id, fingerprint },
        "!!! Attention !!! The user has more than 5 active refreshSessions, a hacker attack is likely, all refreshSessions will be deleted",
      );

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshSession: {
            deleteMany: {},
            create: {
              refreshToken: tokens.refreshToken,
              fingerprint,
              expiresIn: new Date(this.config.tokenSettings.refreshTokenTTLMs),
            },
          },
        },
      });

      logger.info(
        { userId: user.id, fingerprint },
        "The refreshSession was refreshed successfully",
      );

      return tokens;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshSession: {
          delete: { id: refreshSession.id },
          create: {
            refreshToken: tokens.refreshToken,
            fingerprint,
            expiresIn: new Date(this.config.tokenSettings.refreshTokenTTLMs),
          },
        },
      },
    });

    logger.info({ userId: user.id, fingerprint }, "The refreshSession was refreshed successfully");

    return tokens;
  }

  async hasRefreshSession(refreshToken: string): Promise<boolean> {
    const refreshSession = await this.prisma.refreshSession.findUnique({ where: { refreshToken } });

    return !!refreshSession;
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    const refreshSession = await this.prisma.refreshSession.findUnique({ where: { refreshToken } });

    if (refreshSession === null) {
      logger.info({ userId }, "The refreshSession not found");

      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshSession: {
          delete: {
            id: refreshSession.id,
          },
        },
      },
    });

    logger.info({ userId }, "Logout was successfully");
  }

  async getUserById(userId: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user === null) {
      return null;
    }

    logger.info({ userId }, "User received by id");

    return mapToDomainUser(user);
  }

  #createTokens(userId: number): Token {
    const accessToken = jwt.sign({ userId }, this.config.tokenSettings.jwtSecretKey, {
      expiresIn: this.config.tokenSettings.accessTokenTTLMs,
    });
    const refreshToken = v4();

    logger.info({ userId }, "Tokens was created");

    return { accessToken, refreshToken };
  }
}
