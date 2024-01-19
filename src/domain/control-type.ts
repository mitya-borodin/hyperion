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
}
