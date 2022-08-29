import os from "os";
import { resolve } from "path";

import { abortable, race, spawn, SpawnEffects } from "abort-controller-x";
import defer from "defer-promise";
import { AbortController, AbortSignal } from "node-abort-controller";
import pino, { Logger } from "pino";
import pretty from "pino-pretty";

import { Config } from "./config";

type ExecutorParams = {
  signal: AbortSignal;
  config: Config;
  logger: Logger;
  logFilePath: string;
} & SpawnEffects;

type Executor = (params: ExecutorParams) => Promise<void>;

export const entrypoint = async (executor: Executor) => {
  const abortController = new AbortController();
  const shutdownDeferred = defer<unknown | undefined>();

  const config = new Config();
  const logFilePath = resolve(__dirname, "../../log.txt");

  const stream = pretty({
    colorize: true,
  });

  const logger = pino(
    {
      name: "entrypoint",
      base: {
        appName: config.appName,
        hostname: os.hostname(),
      },
      level: config.log.level,
    },
    stream,
  );

  let shutdownReason: "TERMINATION_BY_PROCESS_SIGNAL" | "UNEXPECTED_ERROR" | null = null;

  const abortProcessOnSignal = (signal: NodeJS.Signals) => {
    if (shutdownReason !== null) {
      return;
    }

    shutdownReason = "TERMINATION_BY_PROCESS_SIGNAL";

    logger.warn(`The process will be completed on the signal ${signal}`);

    shutdownDeferred.resolve(undefined);

    logger.warn(
      [
        `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms.`,
        "Check for timers or connections preventing Node from exiting.",
      ].join("\n"),
    );

    const gracefullyShutdownTimer = setTimeout(() => {
      process.kill(process.pid, signal);
    }, config.gracefullyShutdownMs);

    // https://nodejs.org/api/timers.html#timeoutunref
    gracefullyShutdownTimer.unref();
  };

  const addListenerToProcessSignals = (listener: NodeJS.SignalsListener) => {
    const signals: NodeJS.Signals[] = [
      // The 'SIGTERM' signal is a generic signal used to cause program termination.
      "SIGTERM",
      // 'SIGINT' generated with <Ctrl>+C in the terminal.
      "SIGINT",
      // The SIGQUIT signal is similar to SIGINT, except that it’s controlled by a
      // different key—the QUIT character, usually C-\—and produces a core dump when
      // it terminates the process, just like a program error signal.
      // You can think of this as a program error condition “detected” by the user.
      "SIGQUIT",
      // The SIGHUP (“hang-up”) signal is used to report that the user’s terminal
      // is disconnected, perhaps because a network or telephone connection was broken.
      "SIGHUP",
      "SIGUSR2",
    ];

    for (const signal of signals) {
      process.on(signal, listener);
    }

    return () => {
      for (const signal of signals) {
        process.off(signal, listener);
      }
    };
  };

  const removeListenerFromProcessSignals = addListenerToProcessSignals((signal: NodeJS.Signals) => {
    abortProcessOnSignal(signal);
    removeListenerFromProcessSignals();
  });

  const shutdownByError = (error: Error) => {
    if (shutdownReason !== null) {
      return;
    }

    shutdownReason = "UNEXPECTED_ERROR";

    shutdownDeferred.resolve(error);

    if (!process.exitCode) {
      process.exitCode = 1;
    }

    logger.warn(
      [
        "The process will be terminated due to an unexpected exception",
        `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms.`,
      ].join("\n"),
    );

    const gracefullyShutdownTimer = setTimeout(() => {
      process.exit(1);
    }, config.gracefullyShutdownMs);

    // https://nodejs.org/api/timers.html#timeoutunref
    gracefullyShutdownTimer.unref();
  };

  process.on("uncaughtException", (error: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
    if (shutdownReason === null) {
      logger.fatal({ error, origin }, "Uncaught exception");
    } else {
      logger.error({ error, origin }, `Uncaught exception after ${shutdownReason}`);
    }

    shutdownByError(error);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    if (shutdownReason === null) {
      logger.fatal({ reason }, "Unhandled promise rejection");
    } else {
      logger.error({ reason }, `Unhandled promise rejection after ${shutdownReason}`);
    }

    shutdownByError(reason as Error);
  });

  process.on("warning", (warning: Error) => {
    logger.warn({ warning }, "Process warning");
  });

  logger.info({ config }, "The application is being launched");

  try {
    await race(abortController.signal, (signal) => [
      abortable(signal, shutdownDeferred.promise),
      spawn(signal, (signal, { fork, defer }) =>
        executor({ signal, config, logger, logFilePath, fork, defer }),
      ),
    ]);

    logger.info("The application was interrupted by a signal from 'AbortController'");
  } catch (error: unknown) {
    // TODO Проверить, попадет ли ошибка из executor в uncaughtException и unhandledRejection
    // TODO Или останется в этом обработчике
    logger.error({ error }, `The application was interrupted with an error`);

    shutdownByError(error as Error);
  }
};
