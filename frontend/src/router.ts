/* eslint-disable @typescript-eslint/no-explicit-any */
import UniversalRouter from "universal-router";
import type { RouteContext, RouteParams } from "universal-router";

export let params: Readonly<RouteParams> = Object.freeze({});

export const setRouteContext = (context: RouteContext): void => {
  params = Object.freeze({ ...context.params });
};

export const getParams = (): Readonly<RouteParams> => {
  return params;
};

export const router = new UniversalRouter([
  {
    path: "/",
    action: async (context): Promise<any> => {
      setRouteContext(context);

      return import("./pages/Home.svelte");
    },
  },
  {
    path: "/page/1",
    action: async (context): Promise<any> => {
      setRouteContext(context);

      return import("./pages/Page1.svelte");
    },
  },
  {
    path: "/page/2",
    action: async (context): Promise<any> => {
      setRouteContext(context);

      return import("./pages/Page2.svelte");
    },
  },
]);
