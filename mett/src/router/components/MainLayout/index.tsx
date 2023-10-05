import {
  DashboardOutlined,
  GroupOutlined,
  LogoutOutlined,
  ThunderboltOutlined,
  UngroupOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useStore } from '../../../store';
import { RoutePath, getBaseNamePath } from '../../router-path';

type MenuItem = Required<MenuProps>['items'][number];

const items: MenuItem[] = [
  {
    key: RoutePath.Dashboard,
    label: 'Dashboard',
    icon: <DashboardOutlined />,
  },
  {
    key: RoutePath.Devices,
    label: 'Devices',
    icon: <UngroupOutlined />,
  },
  {
    key: RoutePath.MacrosWireframe,
    label: 'Macros wireframe',
    icon: <ThunderboltOutlined />,
  },
  {
    key: RoutePath.Macros,
    label: 'Macros',
    icon: <GroupOutlined />,
  },
  {
    key: RoutePath.Users,
    label: 'Users',
    icon: <UserOutlined />,
  },
  {
    key: RoutePath.SignOut,
    label: 'SignOut',
    icon: <LogoutOutlined />,
    className: '!mt-auto',
  },
];

export const MainLayout = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const { hardWareStore } = useStore();

  useEffect(() => {
    hardWareStore.subscribe();

    return () => {
      hardWareStore.destroy();
    };
  }, [hardWareStore]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <Menu
          className="flex h-full flex-col"
          theme="dark"
          items={items}
          selectedKeys={[location.pathname.replace('/', '')]}
          onClick={({ key }) => navigate(getBaseNamePath(key))}
        />
      </Layout.Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Outlet />
      </Layout>
    </Layout>
  );
});
