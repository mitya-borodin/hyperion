import type { Router } from '@remix-run/router';

let router: Router;

export const setRouterObject = (routerObject: Router) => {
  router = routerObject;
};

export { router };
