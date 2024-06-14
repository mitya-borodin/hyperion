/* eslint-disable unicorn/no-null */
/* eslint-disable @typescript-eslint/naming-convention */

import { PrismaClient } from '@prisma/client';
import { addMinutes, addSeconds, compareAsc, compareDesc, subSeconds } from 'date-fns';
import debug from 'debug';
import cloneDeep from 'lodash.clonedeep';

import { HardwareDevice } from '../../../domain/hardware-device';
import { HyperionDeviceControl } from '../../../domain/hyperion-control';
import { HyperionDevice } from '../../../domain/hyperion-device';
import { History } from '../../../domain/hystory';
import { getControlId } from '../../../domain/macros/get-control-id';
import { ErrorType } from '../../../helpers/error-type';
import { stringify } from '../../../helpers/json-stringify';
import {
  HyperionState,
  HyperionStateUpdate,
  IHyperionDeviceRepository,
  MarkupHyperionControl,
  MarkupHyperionDevice,
  SetControlValue,
} from '../../../ports/hyperion-device-repository';
import { fromHardwareToHyperionDevice } from '../../mappers/from-hardware-to-hyperion-device-mapper';
import { fromHyperionToPrisma } from '../../mappers/from-hyperion-to-prisma-mapper';
import { fromPrismaToHardwareDevice } from '../../mappers/from-prisma-to-hardware-device-mapper';
import { fromPrismaToHyperionDevice } from '../../mappers/from-prisma-to-hyperion-device-mapper';

const logger = debug('hyperion:repository:device');

type HyperionDeviceRepositoryParameters = {
  client: PrismaClient;
};

export class HyperionDeviceRepository implements IHyperionDeviceRepository {
  private client: PrismaClient;

  private history = new Map<string, History[]>();
  private nextHistorySave = new Date();
  private isHistorySavingInProgress = false;

  private devices = new Map<string, HyperionDevice>();
  private controls = new Map<string, HyperionDeviceControl>();
  private nextDeviceSave = new Date();
  private isDeviceSavingInProgress = false;

  constructor({ client }: HyperionDeviceRepositoryParameters) {
    this.client = client;
  }

  apply(hardwareDevice: HardwareDevice): Error | HyperionStateUpdate {
    const deviceId = hardwareDevice.id;
    const hyperionDevice = this.devices.get(deviceId);

    if (hyperionDevice) {
      this.devices.set(deviceId, fromHardwareToHyperionDevice({ hardwareDevice, hyperionDevice, fill: true }));
    } else {
      this.devices.set(deviceId, fromHardwareToHyperionDevice({ hardwareDevice, fill: true }));
    }

    const device = this.devices.get(deviceId);

    if (!device) {
      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }

    const previous = new Map();

    for (const control of device.controls) {
      const controlId = getControlId({ deviceId, controlId: control.id });

      previous.set(controlId, cloneDeep(this.controls.get(controlId)));

      this.controls.set(controlId, control);
    }

    const current = fromHardwareToHyperionDevice({ hardwareDevice, hyperionDevice, fill: false });

    this.saveDevices();
    this.addToHistory(current);

    return {
      previous,
      current: fromHardwareToHyperionDevice({ hardwareDevice, hyperionDevice, fill: false }),
      devices: this.devices,
      controls: this.controls,
    };
  }

  async getHyperionState(bypass: boolean = false): Promise<HyperionState> {
    try {
      logger('Try to get hyperion state from db 🧯');

      const prismaDevices = await this.client.device.findMany({
        include: {
          controls: true,
        },
      });

      if (bypass) {
        const devices = new Map<string, HyperionDevice>();
        const controls = new Map<string, HyperionDeviceControl>();

        for (const device of prismaDevices) {
          const inMemoryDevice = this.devices.get(device.deviceId);

          if (inMemoryDevice) {
            devices.set(inMemoryDevice.id, inMemoryDevice);
          } else {
            devices.set(device.deviceId, fromPrismaToHyperionDevice(device));
          }
        }

        for (const device of devices.values()) {
          for (const control of device.controls) {
            controls.set(getControlId({ deviceId: device.id, controlId: control.id }), control);
          }
        }

        logger('The hyperion devices was loaded from the DB and merged with devices from memory 🧲 📝');
        // logger(JSON.stringify({ devices: [...devices.values()] }, null, 2));

        return {
          devices,
          controls,
        };
      }

      if (this.devices.size > 0 || this.controls.size > 0) {
        for (const device of prismaDevices) {
          if (!this.devices.has(device.deviceId)) {
            this.apply(fromPrismaToHardwareDevice(device));

            continue;
          }

          const skippedControls = device.controls.filter(
            ({ controlId }) => !this.controls.has(getControlId({ deviceId: device.deviceId, controlId })),
          );

          if (skippedControls.length > 0) {
            this.apply(fromPrismaToHardwareDevice({ ...device, controls: skippedControls }));

            continue;
          }
        }

        logger('The state of hyperion devices was partially loaded from the database 🪩 ✅');

        await this.saveDevices(true);
      } else {
        const hyperionDevices = prismaDevices.map((element) => fromPrismaToHyperionDevice(element));

        for (const device of hyperionDevices) {
          this.devices.set(device.id, device);

          for (const control of device.controls) {
            this.controls.set(getControlId({ deviceId: device.id, controlId: control.id }), control);
          }
        }

        logger('The state of hyperion devices has been fully loaded from the database 🧲 ✅');
      }

      logger('The state recorded in memory 📝 💾');
      // logger(JSON.stringify({ devices: [...this.devices.values()] }, null, 2));

      return {
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to get hyperion state 🚨');
      logger(error);

      return {
        devices: this.devices,
        controls: this.controls,
      };
    }
  }

  async markupDevice(parameters: MarkupHyperionDevice): Promise<Error | HyperionStateUpdate> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the hyperion device, you need to pass the markup parameters 🚨');
        logger(JSON.stringify({ parameters }, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const previous = new Map<string, HyperionDeviceControl>();
      const device = this.devices.get(parameters.deviceId);

      if (device) {
        for (const control of device.controls) {
          previous.set(getControlId({ deviceId: device.id, controlId: control.id }), cloneDeep(control));
        }

        device.labels = parameters.labels ?? device.labels;
        device.markup.title.ru = parameters.markup?.title?.ru ?? device.markup.title.ru;
        device.markup.title.en = parameters.markup?.title?.en ?? device.markup.title.en;
        device.markup.order = parameters.markup?.order ?? device.markup.order;
        device.markup.color = parameters.markup?.color ?? device.markup.color;
      } else {
        logger('The hyperion device was not found 🚨 🚨 🚨');
        logger(stringify(parameters));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaDevice = await this.client.device.update({
        include: {
          controls: true,
        },
        where: {
          deviceId: parameters.deviceId,
        },
        data: {
          ...(parameters.markup ? { markup: JSON.stringify(parameters.markup) } : {}),
          ...(parameters.labels ? { labels: parameters.labels } : {}),
        },
      });

      return {
        previous,
        current: fromPrismaToHyperionDevice(prismaDevice),
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to markup hyperion device 🚨');
      logger(stringify({ parameters, error }));
      logger(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async markupControl(parameters: MarkupHyperionControl): Promise<Error | HyperionStateUpdate> {
    try {
      if (!parameters.markup && !parameters.labels) {
        logger('To mark up the hyperion control, you need to pass the markup parameters 🚨');
        logger(JSON.stringify({ parameters }, null, 2));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const controlId = getControlId(parameters);
      const previous = new Map<string, HyperionDeviceControl>();
      const control = this.controls.get(controlId);

      if (control) {
        previous.set(controlId, cloneDeep(control));

        control.labels = parameters.labels ?? control.labels;
        control.markup.title.ru = parameters.markup?.title?.ru ?? control.markup.title.ru;
        control.markup.title.en = parameters.markup?.title?.en ?? control.markup.title.en;
        control.markup.order = parameters.markup?.order ?? control.markup.order;
        control.markup.color = parameters.markup?.color ?? control.markup.color;

        /**
         * TODO проверить, обновляются ли данные контролов в this.devices.
         */
      } else {
        logger('The hyperion control was not found 🚨 🚨 🚨');
        logger(stringify(parameters));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaControl = await this.client.control.update({
        include: {
          device: true,
        },
        where: {
          deviceId_controlId: {
            deviceId: parameters.deviceId,
            controlId: parameters.controlId,
          },
        },
        data: {
          ...(parameters.markup ? { markup: JSON.stringify(parameters.markup) } : {}),
          ...(parameters.labels ? { labels: parameters.labels } : {}),
        },
      });

      return {
        previous,
        current: fromPrismaToHyperionDevice({ ...prismaControl.device, controls: [prismaControl] }),
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to markup hyperion control 🚨');
      logger(stringify({ parameters }));
      logger(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  async setControlValue(parameters: SetControlValue): Promise<Error | HyperionStateUpdate> {
    try {
      const controlId = getControlId(parameters);
      const previous = new Map<string, HyperionDeviceControl>();
      const control = this.controls.get(controlId);

      if (control) {
        previous.set(controlId, cloneDeep(control));

        control.value = parameters.value;
        /**
         * TODO проверить, обновляются ли данные контролов в this.devices.
         */
      } else {
        logger('The hyperion control was not found 🚨 🚨 🚨');
        logger(stringify(parameters));

        return new Error(ErrorType.INVALID_ARGUMENTS);
      }

      const prismaControl = await this.client.control.update({
        include: {
          device: true,
        },
        where: {
          deviceId_controlId: {
            deviceId: parameters.deviceId,
            controlId: parameters.controlId,
          },
        },
        data: {
          value: parameters.value,
        },
      });

      return {
        previous,
        current: fromPrismaToHyperionDevice({ ...prismaControl.device, controls: [prismaControl] }),
        devices: this.devices,
        controls: this.controls,
      };
    } catch (error) {
      logger('Unable to set value for hyperion control 🚨');
      logger(stringify({ parameters, error }));
      logger(error);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }
  }

  private addToHistory(device: HyperionDevice) {
    // for (const control of device.controls) {
    //   const history: History = {
    //     deviceId: String(device.id),
    //     controlId: String(control.id),
    //     value: String(control.value),
    //     error: String(control.error),
    //     createdAt: new Date(),
    //   };

    //   const controlId = getControlId({ deviceId: history.deviceId, controlId: history.controlId });

    //   const histories = this.history.get(controlId);

    //   if (histories) {
    //     const last = histories.at(-1);

    //     if (!last) {
    //       return;
    //     }

    //     if (compareDesc(last.createdAt, subSeconds(new Date(), 10)) === 1) {
    //       histories.push(history);
    //     } else if (last.value !== history.value) {
    //       histories.push(history);
    //     }
    //   } else {
    //     this.history.set(controlId, [history]);
    //   }

    //   if (compareDesc(this.nextHistorySave, new Date()) === 1) {
    //     if (this.isHistorySavingInProgress) {
    //       return;
    //     }

    //     this.isHistorySavingInProgress = true;

    //     const history: History[] = [];

    //     for (const item of this.history.values()) {
    //       history.push(...item);
    //     }

    //     logger('Try to save history ⬆️ 🛟', history.length, this.history.size);

    //     this.history.clear();

    //     logger('The history map was clear 🆑', history.length, this.history.size);

    //     this.saveDevices(true)
    //       .then(() => {
    //         /**
    //          * Использовать SQL запрос для массовой вставки, так как createMany текет по памяти
    //          */
    //         this.client.history
    //           .createMany({ data: history })
    //           .then(() => {
    //             logger('The history was saved ⬆️ 🛟 ✅');
    //           })
    //           .catch((error) => {
    //             logger('The history was not saved 🚨 🚨 🚨');
    //             logger(error);
    //           })
    //           .finally(() => {
    //             /**
    //              * Запись в базу каждую минуту.
    //              */
    //             this.nextHistorySave = addMinutes(new Date(), 1);
    //             this.isHistorySavingInProgress = false;
    //           });
    //       })
    //       .catch((error) => {
    //         logger('The devices was not saved 🚨 🚨 🚨');
    //         logger(error);

    //         /**
    //          * Запись в базу каждую минуту.
    //          */
    //         this.nextHistorySave = addMinutes(new Date(), 1);
    //         this.isHistorySavingInProgress = false;
    //       });
    //   }
    // }
  }

  private async saveDevices(force: boolean = false) {
    if (this.isDeviceSavingInProgress) {
      return;
    }

    if (force || compareDesc(this.nextDeviceSave, new Date()) === 1) {
      logger('Try to save devices and controls ⬆️ 🛟');

      this.isDeviceSavingInProgress = true;

      const { devices, controls } = fromHyperionToPrisma(this.devices.values());

      for (const device of devices) {
        await this.client.device.upsert({
          where: {
            deviceId: device.deviceId,
          },
          create: device,
          update: device,
        });
      }

      for (const control of controls) {
        await this.client.control.upsert({
          where: {
            deviceId_controlId: {
              deviceId: control.deviceId,
              controlId: control.controlId,
            },
          },
          create: control,
          update: control,
        });
      }

      /**
       * Запись в базу каждую минуту.
       */
      this.nextDeviceSave = addMinutes(new Date(), 30);

      this.isDeviceSavingInProgress = false;

      logger('The devices and controls was saved ⬆️ 🛟 ✅', devices.length, controls.length);
    }
  }
}
