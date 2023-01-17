/* eslint-disable unicorn/prefer-module */
import os from 'node:os';
import path from 'node:path';

import dotenv from 'dotenv';
import type { Level } from 'pino';

const rootDirection = path.resolve(__dirname, '../../..');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(rootDirection, '.env'), debug: true });
}

export class Config {
  public readonly appName: string;
  public readonly production: boolean;
  public readonly gracefullyShutdownMs: number;
  public readonly log: {
    level: Level;
    hideSensitiveInfo: boolean;
  };
  public readonly fastify: {
    host: string;
    port: number;
    log: {
      level: Level;
    };
  };
  public readonly userFingerPrint: {
    readonly ttlDays: number;
  };
  public cookieSecret: string;
  public readonly auth: {
    readonly secret: string;
    readonly tokenTtlMs: number;
    readonly salt: string;
  };
  public readonly redis: {
    url: string;
  };
  public readonly rethinkdb: {
    host: string;
    port: number;
    purgeTestDatabase: boolean;
  };
  public readonly mosquitto: {
    host: string;
    port: number;
    protocol: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs';
    username: string;
    password: string;
  };
  public readonly geetest: {
    captchaId: string;
    captchaKey: string;
    apiUrl: string;
  };
  public readonly public: string;
  public readonly nodeEnv: string;

  constructor() {
    this.appName = process.env.APP_NAME ?? os.hostname();
    this.production = process.env.NODE_ENV === 'production';
    this.gracefullyShutdownMs = this.toInt(process.env.GRACEFULLY_SHUTDOWN_MS ?? '', 5000);
    this.log = {
      level: this.toLogLevel(process.env.LOG_LEVEL),
      hideSensitiveInfo: (process.env.HIDE_SENSITIVE_INFO ?? 'true') === 'true',
    };
    this.fastify = {
      host: process.env.FASTIFY_HOST ?? 'localhost',
      port: this.toInt(process.env.FASTIFY_PORT ?? '', 3000),
      log: {
        level: this.toLogLevel(process.env.FASTIFY_LOG_LEVEL),
      },
    };
    this.userFingerPrint = {
      ttlDays: this.toInt(process.env.USER_FINGERPRINT_TTL_DAYS ?? '', 30),
    };
    this.cookieSecret = process.env.COOKIE_SECRET ?? '';
    this.auth = {
      secret: process.env.JWT_SECRET ?? '',
      tokenTtlMs: this.toInt(process.env.JWT_TOKEN_TTL_MS ?? '', 5 * 60 * 1000),
      salt: process.env.SALT ?? '',
    };
    this.redis = {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    };
    this.rethinkdb = {
      host: process.env.RETHINKDB_HOST ?? 'localhost',
      port: this.toInt(process.env.RETHINKDB_PORT ?? '', 28_015),
      purgeTestDatabase: !!process.env.PURGE_TEST_DATABASE,
    };
    this.mosquitto = {
      host: process.env.MOSQUITTO_HOST ?? '192.168.1.75',
      port: this.toInt(process.env.MOSQUITTO_PORT ?? '', 1883),
      protocol: this.toMosquittoProtocol(process.env.MOSQUITTO_PORT ?? 'mqtt'),
      username: process.env.MOSQUITTO_USERNAME ?? '',
      password: process.env.MOSQUITTO_PASSWORD ?? '',
    };
    this.geetest = {
      captchaId: process.env.GEETEST_CAPTCHA_ID ?? '',
      captchaKey: process.env.GEETEST_CAPTCHA_KEY ?? '',
      apiUrl: `${process.env.GEETEST_BASE_URL ?? ''}/validate`,
    };
    this.public = path.resolve(__dirname, '../../../public/');
    this.nodeEnv = process.env.NODE_ENV ?? 'development';
  }

  private toInt(mayBeNumber: string, defaultValue: number): number {
    const number = Number.parseInt(mayBeNumber);

    if (Number.isSafeInteger(number)) {
      return number;
    }

    return defaultValue;
  }

  private toLogLevel(level?: string): Level {
    if (level === 'fatal') {
      return 'fatal';
    }

    if (level === 'error') {
      return 'error';
    }

    if (level === 'warn') {
      return 'warn';
    }

    if (level === 'info') {
      return 'info';
    }

    if (level === 'debug') {
      return 'debug';
    }

    if (level === 'trace') {
      return 'trace';
    }

    return 'info';
  }

  private toMosquittoProtocol(protocol?: string): 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs' {
    if (protocol === 'wss') {
      return 'wss';
    }

    if (protocol === 'ws') {
      return 'ws';
    }

    if (protocol === 'mqtt') {
      return 'mqtt';
    }

    if (protocol === 'mqtts') {
      return 'mqtts';
    }

    if (protocol === 'tcp') {
      return 'tcp';
    }

    if (protocol === 'ssl') {
      return 'ssl';
    }

    if (protocol === 'wx') {
      return 'wx';
    }

    if (protocol === 'wxs') {
      return 'wxs';
    }

    return 'mqtt';
  }
}

export const config = new Config();
