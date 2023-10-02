import { makeAutoObservable } from 'mobx';

import type { RootStoreInterface } from './index';

export const createGlobalLoadingStore = (rootStore: RootStoreInterface) => {
  return makeAutoObservable({
    keys: new Set(),

    get isActive() {
      return this.keys.size !== 0;
    },

    on(key: string) {
      this.keys.add(key);
    },

    off(key: string) {
      this.keys.delete(key);
    },
  });
};
