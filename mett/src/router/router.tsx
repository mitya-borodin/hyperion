import {
  Navigate,
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';

import { Dashboard } from '../pages/Dashboard';
import { Devices } from '../pages/Devices';
import { Macros } from '../pages/Macros';
import { MacrosWireframe } from '../pages/MacrosWireframe';
import { Page404 } from '../pages/Page404';
import { SignIn } from '../pages/SignIn';
import { SignOut } from '../pages/SignOut';
import { Users } from '../pages/Users';

import { AuthLayout } from './components/AuthLayout';
import { MainLayout } from './components/MainLayout';
import { PrivateLayout } from './components/PrivateLayout';
import { ServiceLayout } from './components/ServiceLayout';
import { setRouterObject } from './router-object';
import { RoutePath } from './router-path';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={RoutePath.Index} element={<ServiceLayout />}>
      <Route index element={<Navigate replace to={RoutePath.Dashboard} />} />
      <Route path={RoutePath.Auth} element={<Outlet />}>
        <Route element={<AuthLayout />}>
          <Route index element={<Navigate replace to={RoutePath.SignIn} />} />
          <Route path={RoutePath.SignIn} element={<SignIn />} />
          <Route path="*" element={<Navigate replace to={RoutePath.SignIn} />} />
        </Route>
      </Route>
      <Route element={<PrivateLayout />}>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate replace to={RoutePath.Dashboard} />} />
          <Route path={RoutePath.Dashboard} element={<Dashboard />} />
          <Route path={RoutePath.Devices} element={<Devices />} />
          <Route path={RoutePath.MacrosWireframe} element={<MacrosWireframe />} />
          <Route path={RoutePath.Macros} element={<Macros />} />
          <Route path={RoutePath.Users} element={<Users />} />
          <Route path={RoutePath.SignOut} element={<SignOut />} />
          <Route path="*" element={<Navigate replace to={RoutePath.Dashboard} />} />
        </Route>
      </Route>
      <Route path="*" element={<Page404 />} />
    </Route>,
  ),
  {
    basename: import.meta.env.VITE_BASE_PATH,
  },
);

setRouterObject(router);

export const Router = () => {
  return <RouterProvider router={router} />;
};
