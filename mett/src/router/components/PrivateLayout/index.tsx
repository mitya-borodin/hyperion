import { fromUnixTime, getTime } from 'date-fns';
import type { JwtPayload } from 'jwt-decode';
import jwtDecode from 'jwt-decode';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { RoutePath, getAuthPath } from '../../router-path';

import { useStore } from '@/store';

export const PrivateLayout = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();

  const { authStore } = useStore();

  console.log('PrivateLayout');

  useEffect(() => {
    const disposeReactionOnSessionIsActive = reaction(
      () => authStore.sessionIsActive,
      (sessionIsActive) => {
        console.log('Session is active was changed 🍋', sessionIsActive);

        if (sessionIsActive === false) {
          navigate(getAuthPath(RoutePath.SignIn), {
            replace: true,
            state: { from: JSON.parse(JSON.stringify(location)) },
          });
        }
      },
    );

    let timer: number | undefined;

    const disposeReactionOfAccessToken = reaction(
      () => authStore.accessToken,
      (accessToken) => {
        console.log('Access token was changed 🍋');

        clearTimeout(timer);

        if (accessToken) {
          const parsed = jwtDecode<JwtPayload>(authStore.accessToken);
          const expiredAtTimestamp = getTime(fromUnixTime(parsed.exp ?? 0)) - 120000;
          const refreshTimeout = expiredAtTimestamp - getTime(new Date());

          timer = setTimeout(async () => {
            const result = await authStore.refreshAccessToken();

            if (result === 'GoToSignIn') {
              clearTimeout(timer);

              navigate(getAuthPath(RoutePath.SignIn), {
                replace: true,
                state: { from: JSON.parse(JSON.stringify(location)) },
              });
            }
          }, refreshTimeout);
        }
      },
    );

    authStore.runSession();

    return () => {
      disposeReactionOnSessionIsActive();

      clearTimeout(timer);
      disposeReactionOfAccessToken();
    };
  }, [authStore, location, navigate]);

  if (authStore.sessionIsActive) {
    return <Outlet />;
  }

  return <Navigate to={getAuthPath(RoutePath.SignIn)} state={{ from: location }} replace />;
});
