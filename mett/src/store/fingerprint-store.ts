import { load } from '@fingerprintjs/fingerprintjs';
import { makeAutoObservable, runInAction } from 'mobx';

import type { RootStoreInterface } from './index';

export const createFingerprintStore = (rootStore: RootStoreInterface) => {
  return makeAutoObservable({
    fingerprint: '',
    async init() {
      const fp = await load();
      const result = await fp.get();

      runInAction(() => {
        this.fingerprint = result.visitorId;
      });
    },
  });
};
