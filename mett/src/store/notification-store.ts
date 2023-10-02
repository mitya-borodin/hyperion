import type { ArgsProps } from 'antd/es/notification/interface';
import { makeAutoObservable } from 'mobx';

import type { RootStoreInterface } from './index';

type Notification = ArgsProps;

export const createNotificationStore = (rootStore: RootStoreInterface) => {
  return makeAutoObservable({
    notifications: [] as Notification[],

    push(notification: Notification) {
      this.notifications.push(notification);
    },

    pop() {
      return this.notifications.length > 0 ? this.notifications.splice(0, 1)[0] : null;
    },
  });
};
