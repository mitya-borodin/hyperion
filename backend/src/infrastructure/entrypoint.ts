import { abortable, race, spawn, SpawnEffects } from "abort-controller-x";
import defer from "defer-promise";
import { AbortController, AbortSignal } from "node-abort-controller";
import pino, { Logger } from "pino";

type ExecutorParams = {
  signal: AbortSignal;
  logger: Logger;
} & SpawnEffects;

type Executor = (params: ExecutorParams) => Promise<void>;

export const entrypoint = async (executor: Executor) => {
  const abortController = new AbortController();
  const shutdownDeferred = defer<unknown | undefined>();
  const logger = pino({ name: "entrypoint" });

  await race(abortController.signal, (signal) => [
    abortable(signal, shutdownDeferred.promise),
    spawn(signal, (signal, { fork, defer }) => executor({ signal, logger, fork, defer })),
  ]);
};
