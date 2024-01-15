import debug from 'debug';

import { ErrorType } from '../../helpers/error-type';
import { stringify } from '../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
// eslint-disable-next-line max-len
import { ControlType } from '../control-type';
import { HyperionDeviceControl } from '../hyperion-control';
import { HyperionDevice } from '../hyperion-device';

import { getControlId } from './get-control-id';
import { Macros, MacrosAccept, MacrosParameters, MacrosType } from './macros';

const logger = debug('hyperion-lighting-macros');

/**
 * ! SETTINGS
 */
export enum LightingLevel {
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}

export type LightingMacrosSettings = {
  readonly buttons: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly trigger: string;
  }>;
  readonly illuminations: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly trigger: string;
  }>;
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly level: LightingLevel;
  }>;
};

/**
 * ! STATE
 */
export enum LightingForce {
  ON = 'ON',
  OFF = 'OFF',
  UNSPECIFIED = 'UNSPECIFIED',
}

type LightingMacrosPrivateState = {
  switch: 'ON' | 'OFF';
};

export type LightingMacrosPublicState = {
  force: LightingForce;
};

type LightingMacrosState = LightingMacrosPrivateState & LightingMacrosPublicState;

/**
 * ! OUTPUT
 */
type LightingMacrosNextOutput = {
  readonly lightings: Array<{
    readonly deviceId: string;
    readonly controlId: string;
    readonly value: string;
  }>;
};

type LightingMacrosParameters = MacrosParameters<
  MacrosType.LIGHTING,
  LightingMacrosSettings,
  LightingMacrosPublicState
> & {
  readonly devices: Map<string, HyperionDevice>;
  readonly controls: Map<string, HyperionDeviceControl>;
  readonly state: LightingMacrosState;
};

export class LightingMacros extends Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosState> {
  private nextOutput: LightingMacrosNextOutput;

  constructor(parameters: LightingMacrosParameters) {
    super({
      ...parameters,
      state: {
        force: parameters.state.force,
        switch: 'OFF',
      },
    });

    this.nextOutput = {
      lightings: [],
    };

    for (const setting of this.settings.buttons) {
      const button = this.controls.get(getControlId(setting));

      if (!button || button.type !== ControlType.SWITCH) {
        logger('Button control not found or is not SWITCH 🚨');
        logger(stringify({ name: this.name, setting, button }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    for (const setting of this.settings.illuminations) {
      const illumination = this.controls.get(getControlId(setting));

      if (!illumination || illumination.type !== ControlType.ILLUMINATION) {
        logger('Illumination control not found or is not ILLUMINATION 🚨');
        logger(stringify({ name: this.name, setting, illumination }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }

    for (const setting of this.settings.lightings) {
      const lighting = this.controls.get(getControlId(setting));

      if (!lighting || lighting.type !== ControlType.SWITCH) {
        logger('Illumination control not found or is not SWITCH 🚨');
        logger(stringify({ name: this.name, setting, lighting }));

        throw new Error(ErrorType.INVALID_ARGUMENTS);
      }
    }
  }

  setState = (nextState: LightingMacrosPublicState): void => {
    switch (nextState.force) {
      case LightingForce.ON: {
        this.state.force = LightingForce.ON;

        break;
      }
      case LightingForce.OFF: {
        this.state.force = LightingForce.OFF;

        break;
      }
      case LightingForce.UNSPECIFIED: {
        this.state.force = LightingForce.UNSPECIFIED;

        break;
      }
      default: {
        logger('An incorrect state was received 🚨');
        logger(stringify({ name: this.name, currentState: this.state, nextState }));

        return;
      }
    }

    this.execute();
  };

  accept = ({ devices, previous, controls, device }: MacrosAccept): void => {
    super.accept({ devices, previous, controls, device });

    if (this.isControlValueHasBeenChanged(device)) {
      this.execute();
    }
  };

  protected execute = () => {
    let stop = this.applyStateToOutput();

    if (stop) {
      return;
    }

    stop = this.applyInputToState();

    if (stop) {
      return;
    }

    this.applyOutputToState();
  };

  protected applyStateToOutput = () => {
    if (this.state.force !== 'UNSPECIFIED') {
      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = '0';

      if (this.state.force === 'ON') {
        nextSwitchState = 'ON';
        nextValue = '1';
      }

      if (this.state.force === 'OFF') {
        nextSwitchState = 'OFF';
        nextValue = '0';
      }

      this.computeNextOutput(nextValue);

      if (this.nextOutput.lightings.length > 0) {
        logger('The forced state was determined 🫡 😡');
        logger(
          stringify({
            name: this.name,
            currentState: this.state,
            nextSwitchState,
            nextValue,
            nextOutput: this.nextOutput,
          }),
        );

        this.state.switch = nextSwitchState;

        this.applyNextOutput();
      }

      return true;
    }

    return false;
  };

  protected applyInputToState = () => {
    if (this.isSwitchHasBeenPress()) {
      logger('Button has been pressed ⬇️');
      logger(stringify({ name: this.name, currentState: this.state }));

      /**
       * ! Использование this.settings.illuminations будет актуально когда нужно будет выбирать уровень группы света:
       * ! основной, средний, низкий.
       */
      let nextSwitchState: 'ON' | 'OFF' = 'OFF';
      let nextValue = '0';

      if (this.state.switch === 'ON') {
        /**
         * ! Если хотя бы один контрол из группы включен, то при первом клике, нужно включить все остальные, а
         * ! при втором клике все выключаем.
         */
        const everyOn = this.settings.lightings.every((lighting) => {
          return this.controls.get(getControlId(lighting))?.value === '1';
        });

        if (everyOn) {
          nextSwitchState = 'OFF';
          nextValue = '0';
        } else {
          nextSwitchState = 'ON';
          nextValue = '1';
        }
      } else if (this.state.switch === 'OFF') {
        nextSwitchState = 'ON';
        nextValue = '1';
      } else {
        logger('No handler found for the current state 🚨');
        logger(stringify({ name: this.name, currentState: this.state }));

        nextSwitchState = 'OFF';
        nextValue = '0';
      }

      this.state.switch = nextSwitchState;

      this.computeNextOutput(nextValue);
      this.applyNextOutput();

      return true;
    }

    return false;
  };

  protected applyOutputToState() {
    const isSomeOn = this.settings.lightings.some((lighting) => {
      const control = this.controls.get(getControlId(lighting));

      if (control) {
        return control.value === control.on;
      }

      return false;
    });

    const nextState = isSomeOn ? 'ON' : 'OFF';

    const loggerContext = stringify({
      name: this.name,
      currentState: this.state,
      lightings: this.settings.lightings.map((lighting) => {
        return {
          value: this.controls.get(getControlId(lighting))?.value,
        };
      }),
      isSomeOn,
      nextState,
    });

    if (this.state.switch === nextState) {
      return;
    }

    logger('The internal state has been changed because one of the managed controls has changed state 🍋');
    logger(loggerContext);

    this.state.switch = nextState;
  }

  protected computeNextOutput = (value: string) => {
    const nextOutput: LightingMacrosNextOutput = {
      lightings: [],
    };

    for (const { deviceId, controlId } of this.settings.lightings) {
      const type = ControlType.SWITCH;

      const control = this.controls.get(getControlId({ deviceId, controlId }));

      if (!control || control.type !== type || !control.topic) {
        logger('The control specified in the settings was not found, or matches the parameters 🚨');
        logger(
          stringify({
            name: this.name,
            deviceId,
            controlId,
            type,
            controls: [...this.controls.values()],
          }),
        );

        continue;
      }

      if (control.value !== value) {
        nextOutput.lightings.push({
          deviceId,
          controlId,
          value,
        });
      }
    }

    this.nextOutput = nextOutput;

    logger('The next output was computed ⏭️ 🍋');
    logger(
      stringify({
        name: this.name,
        nextState: this.state,
        nextOutput: this.nextOutput,
      }),
    );
  };

  protected applyNextOutput = () => {
    for (const lighting of this.nextOutput.lightings) {
      const hyperionDevice = this.devices.get(lighting.deviceId);

      const controlId = getControlId({ deviceId: lighting.deviceId, controlId: lighting.controlId });

      const hyperionControl = this.controls.get(controlId);

      if (!hyperionDevice || !hyperionControl || !hyperionControl.topic) {
        logger(
          // eslint-disable-next-line max-len
          'It is impossible to send a message because the device has not been found, or the topic has not been defined 🚨',
        );
        logger(
          stringify({
            name: this.name,
            lighting,
            hyperionDevice,
            controlId,
            hyperionControl,
            topic: hyperionControl?.topic,
          }),
        );

        continue;
      }

      const { topic } = hyperionControl;
      const message = lighting.value;

      logger('The message has been created and will be sent to the wirenboard controller ⬆️ 📟 📟 📟 ⬆️');
      logger(
        stringify({
          name: this.name,
          topic,
          message,
        }),
      );

      emitWirenboardMessage({ eventBus: this.eventBus, topic, message });
    }
  };

  /**
   * ! Реализации частных случаев.
   */
  protected isControlValueHasBeenChanged = (device: HyperionDevice): boolean => {
    return super.isControlValueHasBeenChanged(device, [...this.settings.buttons, ...this.settings.lightings]);
  };

  protected isSwitchHasBeenPress = (): boolean => {
    return super.isSwitchHasBeenPress(this.settings.buttons);
  };

  protected isSwitchHasBeenRelease = (): boolean => {
    return super.isSwitchHasBeenRelease(this.settings.buttons);
  };
}
