import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useStore } from '@/store';

const SignOut = observer(() => {
  const { authStore } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    authStore.signOut().then((result) => {
      if (result) {
        navigate('/');
      } else {
        navigate(-1);
      }
    });
  }, [authStore, navigate]);

  return null;
});

export default SignOut;
