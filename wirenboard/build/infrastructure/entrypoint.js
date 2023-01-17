"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entrypoint = void 0;
/* eslint-disable unicorn/no-null */
const node_process_1 = require("node:process");
const abort_controller_x_1 = require("abort-controller-x");
const debug_1 = __importDefault(require("debug"));
const defer_promise_1 = __importDefault(require("defer-promise"));
const node_abort_controller_1 = require("node-abort-controller");
const config_1 = require("./config");
const logger = (0, debug_1.default)('BUTLER-ENTRYPOINT');
const entrypoint = async (executor) => {
    const abortController = new node_abort_controller_1.AbortController();
    const shutdownDeferred = (0, defer_promise_1.default)();
    const config = new config_1.Config();
    let shutdownReason = null;
    const abortProcessOnSignal = (signal) => {
        if (shutdownReason !== null) {
            return;
        }
        shutdownReason = 'TERMINATION_BY_PROCESS_SIGNAL';
        logger(`The process will be completed on the signal ${signal} 😱`);
        // eslint-disable-next-line unicorn/no-useless-undefined
        shutdownDeferred.resolve(undefined);
        logger([
            `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms.`,
            'Check for timers or connections preventing Node from exiting. 😱',
        ].join('\n'));
        const gracefullyShutdownTimer = setTimeout(() => {
            process.kill(process.pid, signal);
        }, config.gracefullyShutdownMs);
        // https://nodejs.org/api/timers.html#timeoutunref
        gracefullyShutdownTimer.unref();
    };
    const addListenerToProcessSignals = (listener) => {
        const signals = [
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
    const removeListenerFromProcessSignals = addListenerToProcessSignals((signal) => {
        abortProcessOnSignal(signal);
        removeListenerFromProcessSignals();
    });
    const shutdownByError = (error) => {
        if (shutdownReason !== null) {
            return;
        }
        shutdownReason = 'UNEXPECTED_ERROR';
        shutdownDeferred.resolve(error);
        if (!process.exitCode) {
            process.exitCode = 1;
        }
        logger([
            'The process will be terminated due to an unexpected exception',
            `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms. 😱`,
        ].join('\n'));
        const gracefullyShutdownTimer = setTimeout(() => {
            (0, node_process_1.exit)(1);
        }, config.gracefullyShutdownMs);
        // https://nodejs.org/api/timers.html#timeoutunref
        gracefullyShutdownTimer.unref();
    };
    process.on('uncaughtException', (error, origin) => {
        if (shutdownReason === null) {
            logger('Uncaught exception 🚨');
            logger(JSON.stringify({ error, origin }, null, 2));
        }
        else {
            logger(`Uncaught exception after ${shutdownReason} 🚨`);
            logger(JSON.stringify({ error, origin }, null, 2));
        }
        shutdownByError(error);
    });
    process.on('unhandledRejection', (reason) => {
        if (shutdownReason === null) {
            logger('Unhandled promise rejection 🚨');
            logger(JSON.stringify({ reason }, null, 2));
        }
        else {
            logger(`Unhandled promise rejection after ${shutdownReason} 🚨`);
            logger(JSON.stringify({ reason }, null, 2));
        }
        shutdownByError(reason);
    });
    process.on('warning', (warning) => {
        logger('Process warning 😱');
        logger(warning.message);
    });
    logger('The application is being launched 🚀');
    logger(JSON.stringify({ config }, null, 2));
    try {
        await (0, abort_controller_x_1.race)(abortController.signal, (signal) => [
            (0, abort_controller_x_1.abortable)(signal, shutdownDeferred.promise),
            (0, abort_controller_x_1.spawn)(signal, (signal, { fork, defer }) => executor({ signal, config, fork, defer })),
        ]);
        logger("The application was interrupted by a signal from 'AbortController' 🛬 🛑");
    }
    catch (error) {
        // TODO Проверить, попадет ли ошибка из executor в uncaughtException и unhandledRejection
        // TODO Или останется в этом обработчике
        logger('The application was interrupted with an error 🚨');
        if (error instanceof Error) {
            logger(error.message);
        }
        shutdownByError(error);
    }
};
exports.entrypoint = entrypoint;
