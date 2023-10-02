import { observer } from 'mobx-react-lite';

import { GlobalLoading } from '@/components';
import { useStore } from '@/store/';

export const GlobalLoadingManager = observer(() => {
  const { globalLoadingStore } = useStore();

  if (!globalLoadingStore.isActive) {
    return null;
  }

  return <GlobalLoading />;
});
