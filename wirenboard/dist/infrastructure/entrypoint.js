"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entrypoint = void 0;
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const abort_controller_x_1 = require("abort-controller-x");
const defer_promise_1 = tslib_1.__importDefault(require("defer-promise"));
const node_abort_controller_1 = require("node-abort-controller");
const pino_1 = tslib_1.__importDefault(require("pino"));
const pino_pretty_1 = tslib_1.__importDefault(require("pino-pretty"));
const config_1 = require("./config");
const entrypoint = async (executor) => {
    const abortController = new node_abort_controller_1.AbortController();
    const shutdownDeferred = (0, defer_promise_1.default)();
    const config = new config_1.Config();
    const stream = (0, pino_pretty_1.default)({
        colorize: true,
    });
    const logger = (0, pino_1.default)({
        name: "entrypoint",
        base: {
            appName: config.appName,
            hostname: os_1.default.hostname(),
        },
        level: config.log.level,
    }, stream);
    let shutdownReason = null;
    const abortProcessOnSignal = (signal) => {
        if (shutdownReason !== null) {
            return;
        }
        shutdownReason = "TERMINATION_BY_PROCESS_SIGNAL";
        logger.warn(`The process will be completed on the signal ${signal} 😱`);
        shutdownDeferred.resolve(undefined);
        logger.warn([
            `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms.`,
            "Check for timers or connections preventing Node from exiting. 😱",
        ].join("\n"));
        const gracefullyShutdownTimer = setTimeout(() => {
            process.kill(process.pid, signal);
        }, config.gracefullyShutdownMs);
        // https://nodejs.org/api/timers.html#timeoutunref
        gracefullyShutdownTimer.unref();
    };
    const addListenerToProcessSignals = (listener) => {
        const signals = [
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
    const removeListenerFromProcessSignals = addListenerToProcessSignals((signal) => {
        abortProcessOnSignal(signal);
        removeListenerFromProcessSignals();
    });
    const shutdownByError = (error) => {
        if (shutdownReason !== null) {
            return;
        }
        shutdownReason = "UNEXPECTED_ERROR";
        shutdownDeferred.resolve(error);
        if (!process.exitCode) {
            process.exitCode = 1;
        }
        logger.warn([
            "The process will be terminated due to an unexpected exception",
            `The process will be forcibly terminated after ${config.gracefullyShutdownMs} ms. 😱`,
        ].join("\n"));
        const gracefullyShutdownTimer = setTimeout(() => {
            process.exit(1);
        }, config.gracefullyShutdownMs);
        // https://nodejs.org/api/timers.html#timeoutunref
        gracefullyShutdownTimer.unref();
    };
    process.on("uncaughtException", (error, origin) => {
        if (shutdownReason === null) {
            logger.fatal({ error, origin }, "Uncaught exception 🚨");
        }
        else {
            logger.error({ error, origin }, `Uncaught exception after ${shutdownReason} 🚨`);
        }
        shutdownByError(error);
    });
    process.on("unhandledRejection", (reason) => {
        if (shutdownReason === null) {
            logger.fatal({ reason }, "Unhandled promise rejection 🚨");
        }
        else {
            logger.error({ reason }, `Unhandled promise rejection after ${shutdownReason} 🚨`);
        }
        shutdownByError(reason);
    });
    process.on("warning", (warning) => {
        logger.warn({ warning }, "Process warning 😱");
    });
    logger.info({ config }, "The application is being launched 🚀");
    try {
        await (0, abort_controller_x_1.race)(abortController.signal, (signal) => [
            (0, abort_controller_x_1.abortable)(signal, shutdownDeferred.promise),
            (0, abort_controller_x_1.spawn)(signal, (signal, { fork, defer }) => executor({ signal, config, logger, fork, defer })),
        ]);
        logger.info("The application was interrupted by a signal from 'AbortController' 🛬 🛑");
    }
    catch (error) {
        // TODO Проверить, попадет ли ошибка из executor в uncaughtException и unhandledRejection
        // TODO Или останется в этом обработчике
        logger.error({ error }, `The application was interrupted with an error 🚨`);
        shutdownByError(error);
    }
};
exports.entrypoint = entrypoint;
