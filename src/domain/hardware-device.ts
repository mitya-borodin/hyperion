import { JsonObject, JsonValue } from '../helpers/json-types';

export type HardwareControl = {
  /**
   * ID of the device property that will be used to update data in the database as controlId.
   */
  id: string;

  /**
   * The title of the control in different languages
   */
  title?: {
    ru?: string;
    en?: string;
  };

  /**
   * Display order in user interface
   */
  order?: number;

  /**
   * Control's type. The type of control explains its functional purpose.
   */
  type?: string;

  /**
   * Allows you to understand whether the control is available for modification
   */
  readonly?: boolean;

  /**
   * Units. ASCII string. Could be set only for type "value". No units by default
   */
  units?: string;

  /**
   * Maximum allowed control's value. Default value for range type is 10^9, for other types
   * no limit specified by default
   */
  max?: number;

  /**
   * Minimum allowed control's value. Default value for range type is 0, for other types no limit
   * specified by default
   */
  min?: number;

  /**
   * The step of changing the numeric value is not set by default
   */
  step?: number;

  /**
   * Control's value is rounded to defined precision by a driver and it is also used during user input validation
   * If no precision is present, the value is used as-is
   */
  precision?: number;

  /**
   * For different devices, there may be different values for switching to the on, off, and toggle states.
   */
  on?: string;
  off?: string;
  toggle?: string;

  /**
   * Options the value that the current control can accept or display.
   */
  enum?: string[];

  /**
   * The real value that the control has.
   */
  value?: string;

  /**
   * Stores a preset value, or the value at the time the device is turned off
   */
  presets?: JsonObject;

  /**
   * The topic contains a pre-configured mqtt topic for the current control.
   * Allows you not to configure topic in the client code.
   */
  topic?: {
    read?: string;
    write?: string;
  };
  /**
   * Control error data in string format
   */
  error?: string;

  /**
   * Raw control data received from the driver and other data that was received or
   * calculated during the processing of information from the driver
   */
  meta?: JsonObject;
};

export type HardwareDevice = {
  /**
   * ID of the device that will be used to update data in the database as deviceId.
   */
  id: string;

  /**
   * The title of the device in different languages
   */
  title?: {
    ru?: string;
    en?: string;
  };

  /**
   * Display order in user interface
   */
  order?: number;

  /**
   * The name of a driver publishing the device
   */
  driver?: string;

  /**
   * Device error data in free JSON format
   */
  error?: JsonValue;

  /**
   * Raw device data received from the driver and other data that was received or
   * calculated during the processing of information from the driver
   */
  meta?: JsonObject;

  /**
   * Information about the control of the device, which gives an idea of how the control can be used
   */
  controls?: {
    [id: string]: HardwareControl;
  };
};
