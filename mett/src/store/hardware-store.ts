import type { Client, ExecutionResult } from 'graphql-ws';
import { action, makeAutoObservable, runInAction, toJS } from 'mobx';

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

    get devices(): Device[] {
      let devices: Device[] = [];

      this.device.forEach((device) => {
        devices.push(toJS(device));
      });

      devices = devices.sort((a, b) => {
        const aOrder = a.markup.order;
        const bOrder = b.markup.order;

        if (aOrder >= 0 && bOrder >= 0) {
          return aOrder > bOrder ? 1 : -1;
        }

        return a.id > b.id ? 1 : -1;
      });

      devices.forEach((device, index) => {
        devices[index].controls = device.controls.sort((a, b) => {
          let aOrder = a.order;
          let bOrder = b.order;

          if (a.markup.order >= 0) {
            aOrder = a.markup.order;
          }

          if (b.markup.order >= 0) {
            bOrder = b.markup.order;
          }

          return aOrder > bOrder ? 1 : -1;
        });
      });

      return devices;
    },

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

      const onNextDevice = action(
        'onNextDevice',
        (event: ExecutionResult<{ device: DeviceSubscriptionEvent }, unknown>) => {
          event.data?.device?.items?.forEach((nextDevice) => {
            const device = this.device.get(nextDevice.id);

            if (!device) {
              this.device.set(nextDevice.id, nextDevice);
            }

            if (device) {
              nextDevice.controls.forEach((nextControl) => {
                const willBeUpdatedControlIndex = device.controls.findIndex((control) => control.id === nextControl.id);

                if (typeof willBeUpdatedControlIndex === 'number') {
                  device.controls[willBeUpdatedControlIndex] = nextControl;
                } else {
                  device.controls.push(nextControl);
                }
              });
            }
          });
        },
      );

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

      const onNextMacros = action('onNextMacros', (event: ExecutionResult<DeviceSubscriptionEvent, unknown>) => {
        console.log('Macros event appeared 🚀', event);

        /**
         * ! Обновляем состояние macros
         */
      });

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
