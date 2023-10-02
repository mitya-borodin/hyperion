import { configure } from 'mobx';
import { createContext, useContext } from 'react';

import { createAuthStore } from './auth-store';
import { createFingerprintStore } from './fingerprint-store';
import { createGlobalLoadingStore } from './global-loading-store';
import { createHardWareStore } from './hardware-store';
import { createNotificationStore } from './notification-store';
import { createUserStore } from './user-store';

configure({
  enforceActions: 'always',
});

type StoreFactories = {
  globalLoadingStore: typeof createGlobalLoadingStore;
  notificationStore: typeof createNotificationStore;
  fingerprintStore: typeof createFingerprintStore;
  authStore: typeof createAuthStore;
  userStore: typeof createUserStore;
  hardWareStore: typeof createHardWareStore;
};

export type RootStoreInterface = {
  [K in keyof StoreFactories]: ReturnType<StoreFactories[K]>;
};

class RootStore implements RootStoreInterface {
  globalLoadingStore = createGlobalLoadingStore(this);
  notificationStore = createNotificationStore(this);
  fingerprintStore = createFingerprintStore(this);
  authStore = createAuthStore(this);
  userStore = createUserStore(this);
  hardWareStore = createHardWareStore(this);
}

export const rootStore = new RootStore();

const StoreContext = createContext<null | typeof rootStore>(null);

export const StoreProvider = StoreContext.Provider;

export function useStore() {
  const store = useContext(StoreContext);

  if (store === null) {
    throw new Error('Store cannot be null, please add a context provider 🚨');
  }

  return store;
}
