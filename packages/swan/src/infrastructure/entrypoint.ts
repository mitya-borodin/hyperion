/* eslint-disable unicorn/no-null */
import { exit } from 'node:process';

import { abortable, race, spawn, SpawnEffects } from 'abort-controller-x';
import debug from 'debug';
import defer from 'defer-promise';

import { Config } from './config';

type ExecutorParameters = {
  signal: AbortSignal;
  config: Config;
} & SpawnEffects;

type Executor = (parameters: ExecutorParameters) => Promise<void>;

const logger = debug('SWAN-ENTRYPOINT');

export const entrypoint = async (executor: Executor) => {
  const abortController = new AbortController();
  const shutdownDeferred = defer<unknown | undefined>();

  const config = new Config();

  let shutdownReason: 'TERMINATION_BY_PROCESS_SIGNAL' | 'UNEXPECTED_ERROR' | null = null;

  const abortProcessOnSignal = (signal: NodeJS.Signals) => {
    if (shutdownReason !== null) {
      return;
    }

    shutdownReason = 'TERMINATION_BY_PROCESS_SIGNAL';

    logger(`The process will be completed on the signal ${signal} 😱`);

    // eslint-disable-next-line unicorn/no-useless-undefined
    shutdownDeferred.resolve(undefined);

    logger(
      [
        `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms.`,
        'Check for timers or connections preventing Node from exiting. 😱',
      ].join('\n'),
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
      'SIGTERM',
      // 'SIGINT' generated with <Ctrl>+C in the terminal.
      'SIGINT',
      // The SIGQUIT signal is similar to SIGINT, except that it’s controlled by a
      // different key—the QUIT character, usually C-\—and produces a core dump when
      // it terminates the process, just like a program error signal.
      // You can think of this as a program error condition “detected” by the user.
      'SIGQUIT',
      // The SIGHUP (“hang-up”) signal is used to report that the user’s terminal
      // is disconnected, perhaps because a network or telephone connection was broken.
      'SIGHUP',
      'SIGUSR2',
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

    shutdownReason = 'UNEXPECTED_ERROR';

    shutdownDeferred.resolve(error);

    if (!process.exitCode) {
      process.exitCode = 1;
    }

    logger(
      [
        'The process will be terminated due to an unexpected exception',
        `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms. 😱`,
      ].join('\n'),
    );

    const gracefullyShutdownTimer = setTimeout(() => {
      exit(1);
    }, config.gracefullyShutdownMs);

    // https://nodejs.org/api/timers.html#timeoutunref
    gracefullyShutdownTimer.unref();
  };

  process.on('uncaughtException', (error: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
    if (shutdownReason === null) {
      logger('Uncaught exception 🚨');
      logger(JSON.stringify({ error, origin }, null, 2));
    } else {
      logger(`Uncaught exception after ${shutdownReason} 🚨`);
      logger(JSON.stringify({ error, origin }, null, 2));
    }

    shutdownByError(error);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    if (shutdownReason === null) {
      logger('Unhandled promise rejection 🚨');
      logger(JSON.stringify({ reason }, null, 2));
    } else {
      logger(`Unhandled promise rejection after ${shutdownReason} 🚨`);
      logger(JSON.stringify({ reason }, null, 2));
    }

    shutdownByError(reason as Error);
  });

  process.on('warning', (warning: Error) => {
    logger('Process warning 😱');
    logger(warning.message);
  });

  logger('The application is being launched 🚀');
  logger(JSON.stringify({ config }, null, 2));

  try {
    await race(abortController.signal, (signal) => [
      abortable(signal, shutdownDeferred.promise),
      spawn(signal, (signal, { fork, defer }) => executor({ signal, config, fork, defer })),
    ]);

    logger("The application was interrupted by a signal from 'AbortController' 🛬 🛑");
  } catch (error: unknown) {
    // TODO Проверить, попадет ли ошибка из executor в uncaughtException и unhandledRejection
    // TODO Или останется в этом обработчике
    logger('The application was interrupted with an error 🚨');

    if (error instanceof Error) {
      logger(error.message);
    }

    shutdownByError(error as Error);
  }
};