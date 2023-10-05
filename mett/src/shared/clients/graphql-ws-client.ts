import { createClient } from 'graphql-ws';

import { rootStore } from '../../store';

const isHttps = window.location.origin.includes('https');

export const createGqlWsClient = (connected: () => void, closed: () => void) => {
  return createClient({
    url: `${isHttps ? 'wss' : 'ws'}://${window.location.host}/graphql`,
    keepAlive: 10_000,
    shouldRetry: () => true,
    lazy: true,
    connectionParams: async () => {
      return {
        authorization: rootStore.authStore.accessToken,
        fingerprint: rootStore.fingerprintStore.fingerprint,
      };
    },
    on: {
      connected: () => {
        console.log('Websocket connection established 🌴 🛩');

        connected();
      },
      closed: () => {
        console.log('Websocket connection closed 🛑');

        closed();
      },
    },
  });
};
