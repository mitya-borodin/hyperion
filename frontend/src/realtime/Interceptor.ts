/* eslint-disable @typescript-eslint/no-explicit-any */
import type EventEmitter from "eventemitter3";
import type { Doc } from "sharedb";

import { DocumentEvents, InterceptorEvents } from "./events";
import type { Callback, DocumentChange, Interceptor } from "./types";

export const createInterceptor = (eventEmitter: EventEmitter): Interceptor => {
  /**
   * Локальное состояние Interceptor
   */
  let isEnable = false;
  let snapshot: any = {};

  const getNestedObjectByPath = (parent: any, path: string[]): any => {
    const key = path.shift();

    if (key) {
      return getNestedObjectByPath(parent[key], path);
    } else {
      return parent;
    }
  };

  const createProxy = (
    target: any,
    propertyKey?: string,
    attributes?: PropertyDescriptor,
    parentPropertyKeys: string[] = [],
  ): Interceptor => {
    console.log("createProxy", {
      target,
      propertyKey,
      attributes,
      parentPropertyKeys,
    });

    const getSnapshot = () => getNestedObjectByPath(snapshot, [...parentPropertyKeys]);

    const get = (target: object, propertyKey: string, receiver: any) => {
      console.log("GET", { target, propertyKey, receiver });

      const value = Reflect.get(target, propertyKey, receiver);

      if (typeof value === "object") {
        return value;
      }

      if (["isEnable", "onInit", "onChange", "dispose"].includes(propertyKey)) {
        return Reflect.get(target, propertyKey, receiver);
      }

      return Reflect.get(getSnapshot(), propertyKey);
    };

    const set = (target: object, propertyKey: string, value: any, receiver: any): boolean => {
      console.log("SET", { target, propertyKey, value, receiver });

      const change: DocumentChange = {
        type: "SET",
        path: [...parentPropertyKeys, propertyKey],
        value,
      };

      eventEmitter.emit(InterceptorEvents.CHANGE, change, receiver);

      // ! Optimistic update for snapshot
      Reflect.set(getSnapshot(), propertyKey, value);

      return Reflect.set(target, propertyKey, value, receiver);
    };

    const defineProperty = (
      target: object,
      propertyKey: string,
      attributes: PropertyDescriptor,
    ) => {
      if (typeof attributes.value === "object") {
        console.log("CREATE_CHILD_PROXY_IN_DEFINE_PROPERTY", { target, propertyKey, attributes });

        return Reflect.defineProperty(target, propertyKey, {
          ...attributes,
          value: createProxy({}, propertyKey, attributes, [...parentPropertyKeys, propertyKey]),
        });
      } else {
        console.log("DEFINE_PROPERTY", { target, propertyKey, attributes });

        const change: DocumentChange = {
          type: "SET",
          path: [...parentPropertyKeys, propertyKey],
          value: attributes.value,
        };

        eventEmitter.emit(InterceptorEvents.CHANGE, change);

        return Reflect.defineProperty(target, propertyKey, {
          writable: true,
          configurable: true,
          enumerable: true,
          value: typeof attributes.value,
        });
      }
    };

    const deleteProperty = (target: object, propertyKey: string) => {
      console.log("DELETE_PROPERTY", { target, propertyKey });

      const change: DocumentChange = {
        type: "DELETE",
        path: [...parentPropertyKeys, propertyKey],
        value: undefined,
      };

      eventEmitter.emit(InterceptorEvents.CHANGE, change);

      // ! Optimistic update for snapshot
      Reflect.deleteProperty(getSnapshot(), propertyKey);

      return Reflect.deleteProperty(target, propertyKey);
    };

    const proxy = new Proxy(target, {
      get,
      set,
      defineProperty,
      deleteProperty,
    });

    if (attributes) {
      for (const key in attributes.value) {
        Reflect.defineProperty(proxy, key, {
          writable: true,
          configurable: true,
          enumerable: true,
          value: attributes.value[key],
        });
      }
    }

    return proxy as Interceptor;
  };

  /**
   * Тут создается перехватчик верхнего уровня.
   */
  const interceptor: Interceptor = createProxy({
    isEnable(): boolean {
      return isEnable;
    },
    onInit(callback: Callback) {
      eventEmitter.on(DocumentEvents.WAS_INIT, () => callback(interceptor, []));
    },
    onChange(callback: Callback) {
      eventEmitter.on(InterceptorEvents.NOTIFY_CLIENT, (changes: DocumentChange[]) =>
        callback(interceptor, changes),
      );
    },
    dispose(): void {
      eventEmitter.emit(DocumentEvents.DISPOSE);
    },
  }) as Interceptor;

  const updateIsEnabled = (doc: Doc) => {
    isEnable = true;
    snapshot = doc.data;
  };

  const updateSnapshot = (doc: Doc, changes: DocumentChange[]) => {
    snapshot = doc.data;

    eventEmitter.emit(InterceptorEvents.NOTIFY_CLIENT, changes);
  };

  eventEmitter.on(DocumentEvents.WAS_INIT, updateIsEnabled);
  eventEmitter.on(DocumentEvents.UPDATE_SNAPSHOT, updateSnapshot);

  return interceptor;
};
