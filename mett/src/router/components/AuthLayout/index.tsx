import { observer } from 'mobx-react-lite';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useStore } from '@/store';

export const AuthLayout = observer(() => {
  const { authStore } = useStore();

  const location = useLocation();

  if (authStore.sessionIsActive) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />;
});
