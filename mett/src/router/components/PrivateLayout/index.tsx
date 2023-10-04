import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';

import { useStore } from '@/store';

export const PrivateLayout = observer(() => {
  const { authStore } = useStore();

  if (authStore.sessionIsActive) {
    return <Outlet />;
  }

  return null;
});
