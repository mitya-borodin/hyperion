import debug from 'debug';

import { stringify } from '../../helpers/json-stringify';
import { emitWirenboardMessage } from '../../infrastructure/external-resource-adapters/wirenboard/emit-wb-message';
import { ControlType } from '../control-type';
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

type LightingMacrosParameters = MacrosParameters<LightingMacrosSettings, LightingMacrosPublicState>;

export class LightingMacros extends Macros<MacrosType.LIGHTING, LightingMacrosSettings, LightingMacrosState> {
  private nextOutput: LightingMacrosNextOutput;

  constructor(parameters: LightingMacrosParameters) {
    super({
      ...parameters,
      type: MacrosType.LIGHTING,
      state: {
        force: parameters.state.force,
        switch: 'OFF',
      },
      controlTypes: {
        buttons: ControlType.SWITCH,
        illuminations: ControlType.ILLUMINATION,
        lightings: ControlType.SWITCH,
      },
    });

    this.nextOutput = {
      lightings: [],
    };
  }

  setState = (nextState: LightingMacrosPublicState): void => {
    logger('The next state was appeared ⏭️ ⏭️ ⏭️');
    logger(
      stringify({
        currentState: this.state,
        nextState,
      }),
    );

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

    logger('The next state was applied ⏭️ ✅ ⏭️');
    logger(
      stringify({
        currentState: this.state,
        nextState,
      }),
    );

    this.execute();
  };

  accept = ({ previous, current, devices, controls }: MacrosAccept): void => {
    super.accept({ previous, current, devices, controls });

    if (this.isDevicesReady() && this.isControlValueHasBeenChanged(current)) {
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
        logger('The force state was determined 🫡 😡 😤 🚀');
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
