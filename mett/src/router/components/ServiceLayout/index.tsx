import '@/styles/global.css';
import { ConfigProvider } from 'antd';
import { I18nextProvider } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalLoadingManager } from './components/GlobalLoadingManager';
import { NotificationManager } from './components/NotificationManager';

import { i18n } from '@/shared/i18n';
import { StoreProvider, rootStore } from '@/store';

export const ServiceLayout = () => {
  return (
    <StoreProvider value={rootStore}>
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <ConfigProvider
            getPopupContainer={(node) => {
              return node ? (node.parentNode as HTMLElement) : document.body;
            }}
            // theme={{
            //   token: {
            //     colorPrimary: '#28776D',
            //   },
            // }}
          >
            <NotificationManager />
            <GlobalLoadingManager />
            <Outlet />
          </ConfigProvider>
        </ErrorBoundary>
      </I18nextProvider>
    </StoreProvider>
  );
};
