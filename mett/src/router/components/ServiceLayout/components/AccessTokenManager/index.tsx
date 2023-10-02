import { fromUnixTime, getTime } from 'date-fns';
import type { JwtPayload } from 'jwt-decode';
import jwtDecode from 'jwt-decode';
import type { IReactionDisposer } from 'mobx';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { RoutePath, getAuthPath } from '../../../../router-path';

import { useStore } from '@/store';

export const AccessTokenManager = observer((props: { children: ReactNode }) => {
  const { authStore } = useStore();

  const location = useLocation();
  const navigate = useNavigate();

  const disposeReactionOfAccessTokenRef = useRef<IReactionDisposer>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const run = async () => {
      disposeReactionOfAccessTokenRef.current = reaction(
        () => authStore.accessToken,
        (accessToken) => {
          clearTimeout(timeoutRef.current);

          if (accessToken) {
            const parsed = jwtDecode<JwtPayload>(authStore.accessToken);
            const expiredAtTimestamp = getTime(fromUnixTime(parsed.exp ?? 0)) - 120000;
            const refreshTimeout = expiredAtTimestamp - getTime(new Date());

            timeoutRef.current = setTimeout(async () => {
              const result = await authStore.refreshAccessToken();

              if (result === 'GoToSignIn') {
                clearTimeout(timeoutRef.current);

                navigate(getAuthPath(RoutePath.SignIn), {
                  replace: true,
                  state: { from: JSON.parse(JSON.stringify(location)) },
                });
              }
            }, refreshTimeout);
          }
        },
      );

      await authStore.runSession();
    };

    run();

    return () => {
      clearTimeout(timeoutRef.current);

      disposeReactionOfAccessTokenRef.current?.();
    };
  }, [authStore, location, navigate]);

  if (authStore.sessionIsActive) {
    return props.children;
  }

  return null;
});
