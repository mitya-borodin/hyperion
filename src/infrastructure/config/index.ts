/* eslint-disable unicorn/prefer-module */
import os from 'node:os';
import path from 'node:path';

import dotenv from 'dotenv';
import type { Level } from 'pino';

const rootDirection = path.resolve(__dirname, '../../..');

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line import/no-named-as-default-member
  dotenv.config({ path: path.resolve(rootDirection, '.env'), debug: true });
}

export class Config {
  public readonly appName: string;

  public readonly isProduction: boolean;
  public readonly isTest: boolean;
  public readonly isDev: boolean;

  public readonly gracefullyShutdownMs: number;

  public readonly log: {
    level: Level;
    hideSensitiveInfo: boolean;
  };

  public readonly fastify: {
    readonly host: string;
    readonly port: number;
    readonly log: {
      readonly level: Level;
    };
    readonly cookieSecret: string;
    readonly public: string;
    readonly fingerPrint: {
      readonly ttlDays: number;
    };
    readonly auth: {
      readonly secret: string;
      readonly tokenTtlMs: number;
      readonly salt: string;
    };
  };

  public readonly geetest: {
    readonly captchaId: string;
    readonly captchaKey: string;
    readonly apiUrl: string;
  };

  public readonly mosquitto: {
    readonly host: string;
    readonly port: number;
    readonly protocol: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'wx' | 'wxs';
    readonly username: string;
    readonly password: string;
  };

  public readonly zigbee2mqtt: {
    readonly baseTopic: string;
  };

  public readonly masterUser: {
    readonly email: string;
    readonly password: string;
    readonly name: string;
  };

  public readonly client: {
    readonly timeZone: string;
  };

  constructor() {
    this.appName = process.env.APP_NAME ?? os.hostname();
    this.gracefullyShutdownMs = this.toInt(process.env.GRACEFULLY_SHUTDOWN_MS ?? '', 5000);

    this.isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
    this.isTest = (process.env.NODE_ENV ?? 'development') === 'test';
    this.isDev = (process.env.NODE_ENV ?? 'development') === 'development';

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
      cookieSecret: process.env.COOKIE_SECRET ?? '',
      public: path.resolve(__dirname, '../../../public/'),
      fingerPrint: {
        ttlDays: this.toInt(process.env.USER_FINGERPRINT_TTL_DAYS ?? '', 30),
      },
      auth: {
        secret: process.env.JWT_SECRET ?? '',
        tokenTtlMs: this.toInt(process.env.JWT_TOKEN_TTL_MS ?? '', 5 * 60 * 1000),
        salt: process.env.SALT ?? '',
      },
    };

    this.geetest = {
      captchaId: process.env.GEETEST_CAPTCHA_ID ?? '',
      captchaKey: process.env.GEETEST_CAPTCHA_KEY ?? '',
      apiUrl: `${process.env.GEETEST_BASE_URL ?? ''}/validate`,
    };

    this.mosquitto = {
      host: process.env.MOSQUITTO_HOST ?? 'borodin.site',
      port: this.toInt(process.env.MOSQUITTO_PORT ?? '', 18_883),
      protocol: this.toMosquittoProtocol(process.env.MOSQUITTO_PORT ?? 'mqtt'),
      username: process.env.MOSQUITTO_USERNAME ?? 'wirenboard',
      password: process.env.MOSQUITTO_PASSWORD ?? 'password',
    };

    this.zigbee2mqtt = {
      baseTopic: process.env.ZIGBEE_2_MQTT_BASE_TOPIC ?? 'zigbee2mqtt',
    };

    this.masterUser = {
      email: process.env.MASTER_USER_EMAIL ?? 'dmitriy@borodin.site',
      password: process.env.MASTER_USER_PASSWORD ?? 'password',
      name: process.env.MASTER_USER_NAME ?? 'Dmitriy Borodin',
    };

    this.client = {
      timeZone: process.env.CLIENT_TIME_ZONE ?? 'Europe/Moscow',
    };
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
