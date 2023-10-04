import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { RoutePath, getAuthPath } from '../../router';

import { useStore } from '@/store';

const SignOut = observer(() => {
  const { authStore } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    authStore.signOut().then((result) => {
      if (result === 'GoToSignIn') {
        navigate(getAuthPath(RoutePath.SignIn), { replace: true });
      }
    });
  }, [authStore, navigate]);

  return null;
});

export default SignOut;
