export enum RoutePath {
  Index = '/',
  Auth = 'auth',
  SignIn = 'sign-in',
  Dashboard = 'dashboard',
  Devices = 'devices',
  MacrosWireframe = 'macros-wireframe',
  Macros = 'macros',
  Users = 'users',
  SignOut = 'sign-out',
}

export const joinPaths = (paths: string[]): string => paths.join('/').replace(/\/\/+/g, '/');

export const getBaseNamePath = (path: string) => {
  return joinPaths([/* import.meta.env.VITE_BASE_PATH ?? */ '/', path]);
};

export const getAuthPath = (path: RoutePath) => {
  return joinPaths(['/', RoutePath.Auth, path]);
};
