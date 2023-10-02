import { makeAutoObservable, runInAction } from 'mobx';

import { UserRole, UserStatus, type UserOutput } from '../shared/entities/graphql-types';

import type { RootStoreInterface } from './index';

import { api } from '@/shared/api';

export const createUserStore = (rootStore: RootStoreInterface) => {
  return makeAutoObservable({
    user: {
      id: '',
      name: '',
      email: '',
      createdAt: '',
      updatedAt: '',
      role: UserRole.Viewer,
      status: UserStatus.Deleted,
    } as UserOutput,

    get isAdmin() {
      return this.user.role === UserRole.Admin;
    },

    get isOperator() {
      return this.user.role === UserRole.Operator;
    },

    get isViewer() {
      return this.user.role === UserRole.Viewer;
    },

    get isActive() {
      return this.user.status === UserStatus.Active;
    },

    async getUser(id?: string) {
      const loadingKey = 'getUser';

      const { globalLoadingStore } = rootStore;

      globalLoadingStore.on(loadingKey);

      const user = await api.getUser({ id });

      globalLoadingStore.off(loadingKey);

      if (user instanceof Error) {
        return user;
      }

      runInAction(() => {
        this.user = user;
      });

      return undefined;
    },

    destroy() {
      this.user = {
        id: '',
        name: '',
        email: '',
        createdAt: '',
        updatedAt: '',
        role: UserRole.Viewer,
        status: UserStatus.Deleted,
      } as UserOutput;
    },
  });
};
