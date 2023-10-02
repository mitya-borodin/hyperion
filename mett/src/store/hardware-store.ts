import type { Client, ExecutionResult } from 'graphql-ws';
import { makeAutoObservable, runInAction } from 'mobx';

import { deviceQueryFragment } from '../shared/api/hardware/device-query-fragment';
import { lightingMacrosQueryFragment } from '../shared/api/hardware/lighting-macros-query-fragment';
import { createGqlWsClient } from '../shared/clients/graphql-ws-client';
import { gql } from '../shared/clients/utils';
import type { Device, DeviceSubscriptionEvent, LightingMacros } from '../shared/entities/graphql-types';
import { ErrorType } from '../shared/utils/error-type';

import type { RootStoreInterface } from './index';

export const createHardWareStore = (rootStore: RootStoreInterface) => {
  let graphQLClient: Client | undefined;

  return makeAutoObservable({
    online: false,
    subscriptionInProgress: false,

    device: new Map<string, Device>(),
    macros: new Map<string, LightingMacros>(),

    setOnline(sate: boolean) {
      this.online = sate;
    },

    unSubscribeOfDevice() {},
    unSubscribeOfMacros() {},

    async subscribe() {
      graphQLClient = createGqlWsClient(
        () => {
          this.setOnline(true);
        },
        () => {
          this.setOnline(false);
        },
      );

      this.subscriptionInProgress = true;

      const onNextDevice = (event: ExecutionResult<DeviceSubscriptionEvent, unknown>) => {
        console.log('Device event appeared 🚀', event);

        /**
         * ! Обновляем состояние device
         */
      };

      await new Promise((resolve, reject) => {
        if (!graphQLClient) {
          reject(Error(ErrorType.UNEXPECTED_BEHAVIOR));

          return;
        }

        this.unSubscribeOfDevice = graphQLClient.subscribe(
          {
            query: gql`
              subscription {
                device {
                  items ${deviceQueryFragment}
                  type
                  error {
                    code
                    message
                  }
                }
              }
            `,
          },
          {
            next: onNextDevice,
            error: reject,
            complete() {
              resolve(undefined);
            },
          },
        );
      });

      const onNextMacros = (event: ExecutionResult<DeviceSubscriptionEvent, unknown>) => {
        console.log('Macros event appeared 🚀', event);

        /**
         * ! Обновляем состояние macros
         */
      };

      await new Promise((resolve, reject) => {
        if (!graphQLClient) {
          reject(Error(ErrorType.UNEXPECTED_BEHAVIOR));

          return;
        }
        this.unSubscribeOfDevice = graphQLClient.subscribe(
          {
            query: gql`
              subscription {
                macros {
                  items {
                    lighting ${lightingMacrosQueryFragment}
                  }
                  type
                  error {
                    code
                    message
                  }
                }
              }
            `,
          },
          {
            next: onNextMacros,
            error: reject,
            complete() {
              resolve(undefined);
            },
          },
        );
      });

      runInAction(() => {
        this.subscriptionInProgress = false;
      });
    },

    destroy() {
      this.unSubscribeOfDevice();
      this.unSubscribeOfMacros();

      if (graphQLClient) {
        graphQLClient.dispose();
      }

      this.online = false;
      this.subscriptionInProgress = false;
      this.device.clear();
      this.macros.clear();
    },
  });
};
