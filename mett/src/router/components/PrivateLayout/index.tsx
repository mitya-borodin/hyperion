import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { RoutePath, getAuthPath } from '../../router-path';

import { useStore } from '@/store';

export const PrivateLayout = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const { authStore } = useStore();

  useEffect(() => {
    return reaction(
      () => authStore.sessionIsActive,
      (sessionIsActive) => {
        if (sessionIsActive === false) {
          navigate(getAuthPath(RoutePath.SignIn), {
            replace: true,
            state: { from: JSON.parse(JSON.stringify(location)) },
          });
        }
      },
    );
  }, [authStore, location, navigate]);

  if (authStore.sessionIsActive) {
    return <Outlet />;
  }

  return <Navigate to={getAuthPath(RoutePath.SignIn)} state={{ from: location }} replace />;
});
