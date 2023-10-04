import { fromUnixTime, getTime } from 'date-fns';
import type { JwtPayload } from 'jwt-decode';
import jwtDecode from 'jwt-decode';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { RoutePath, getAuthPath } from '../../../../router-path';

import { useStore } from '@/store';

export const SessionLayout = observer((props: { children: ReactNode }) => {
  const navigate = useNavigate();

  const { authStore, fingerprintStore } = useStore();

  useEffect(() => {
    const disposeReactionOnSessionIsActive = reaction(
      () => authStore.sessionIsActive,
      (sessionIsActive) => {
        console.log('The session has changed the state 🌍', sessionIsActive);

        if (sessionIsActive === false) {
          navigate(getAuthPath(RoutePath.SignIn), { replace: true });
        }
      },
    );

    let timer: number | undefined;

    const disposeReactionOfAccessToken = reaction(
      () => authStore.accessToken,
      (accessToken) => {
        clearTimeout(timer);

        if (accessToken) {
          const parsed = jwtDecode<JwtPayload>(authStore.accessToken);
          const expiredAtTimestamp = getTime(fromUnixTime(parsed.exp ?? 0)) - 120000;
          const refreshTimeout = expiredAtTimestamp - getTime(new Date());

          if (refreshTimeout > 0) {
            console.log('The access token is fresh 🍋');
          }

          if (refreshTimeout <= 0) {
            console.log('The access token is expired 🚨');
          }

          timer = setTimeout(async () => {
            const result = await authStore.refreshAccessToken();

            if (result === 'GoToSignIn') {
              console.log('Failed to refresh access token 🚨');

              clearTimeout(timer);

              navigate(getAuthPath(RoutePath.SignIn), { replace: true });
            }

            if (result === 'StayHere') {
              console.log('The access token was refreshed successfully 🍋');
            }
          }, refreshTimeout);
        }
      },
    );

    fingerprintStore.init().then(() => {
      authStore.runSession().then((result) => {
        if (result === 'GoToSignIn') {
          navigate(getAuthPath(RoutePath.SignIn), { replace: true });
        }
      });
    });

    return () => {
      disposeReactionOnSessionIsActive();

      clearTimeout(timer);
      disposeReactionOfAccessToken();
    };
  }, [authStore, fingerprintStore, navigate]);

  return props.children;
});
