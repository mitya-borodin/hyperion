import { Suspense } from 'react';

import Page from './page';

import { GlobalLoading } from '@/components';

// const Page = lazy(() => import('./page'));

export const Devices = () => (
  <Suspense fallback={<GlobalLoading />}>
    <Page />
  </Suspense>
);
