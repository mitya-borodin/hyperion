import { notification } from 'antd';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { useStore } from '@/store';

export const NotificationManager = observer(() => {
  const { notificationStore } = useStore();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const dispose = reaction(
      () => notificationStore.notifications.length,
      () => {
        const nextNotification = notificationStore.pop();

        if (nextNotification) {
          api[nextNotification.type ?? 'open']({ ...nextNotification });
        }
      },
    );

    return () => {
      dispose();
    };
  }, [api, notificationStore]);

  return contextHolder;
});
