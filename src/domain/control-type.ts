/**
 * Control's type. The type of control explains its functional purpose.
 */
export enum ControlType {
  UNSPECIFIED = 'UNSPECIFIED',
  SWITCH = 'switch',
  ILLUMINATION = 'lux',
  TEXT = 'text',
  ENUM = 'enum',
  VALUE = 'value',
  VOLTAGE = 'voltage',
  TEMPERATURE = 'temperature',
  RANGE = 'range',
  PUSH_BUTTON = 'pushbutton',
  PRESSURE = 'pressure',
  SOUND_LEVEL = 'sound_level',
  REL_HUMIDITY = 'rel_humidity',
  ATMOSPHERIC_PRESSURE = 'atmospheric_pressure',
  HEAT_SOURCE = 'HEAT_SOURCE',
  MOTOR_STATE = 'motor_state',
}

export const toDomainControlType = (controlType: unknown) => {
  if (controlType === ControlType.SWITCH) {
    return ControlType.SWITCH;
  }

  if (controlType === ControlType.ILLUMINATION) {
    return ControlType.ILLUMINATION;
  }

  if (controlType === ControlType.TEXT) {
    return ControlType.TEXT;
  }

  if (controlType === ControlType.ENUM) {
    return ControlType.ENUM;
  }

  if (controlType === ControlType.VALUE) {
    return ControlType.VALUE;
  }

  if (controlType === ControlType.VOLTAGE) {
    return ControlType.VOLTAGE;
  }

  if (controlType === ControlType.TEMPERATURE) {
    return ControlType.TEMPERATURE;
  }

  if (controlType === ControlType.RANGE) {
    return ControlType.RANGE;
  }

  if (controlType === ControlType.PUSH_BUTTON) {
    return ControlType.PUSH_BUTTON;
  }

  if (controlType === ControlType.PRESSURE) {
    return ControlType.PRESSURE;
  }

  if (controlType === ControlType.SOUND_LEVEL) {
    return ControlType.SOUND_LEVEL;
  }

  if (controlType === ControlType.REL_HUMIDITY) {
    return ControlType.REL_HUMIDITY;
  }

  if (controlType === ControlType.ATMOSPHERIC_PRESSURE) {
    return ControlType.ATMOSPHERIC_PRESSURE;
  }

  if (controlType === ControlType.HEAT_SOURCE) {
    return ControlType.HEAT_SOURCE;
  }

  return ControlType.UNSPECIFIED;
};
