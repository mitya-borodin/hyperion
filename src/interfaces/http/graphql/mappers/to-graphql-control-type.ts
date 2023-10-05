import { ControlType as DomainControlType } from '../../../../domain/control-type';
import { ControlType } from '../../../../graphql-types';

export const toGraphQLControlType = (type: DomainControlType): ControlType => {
  /**
   * * CONTROL_TYPE_MAPPER
   */
  if (type === DomainControlType.SWITCH) {
    return ControlType.SWITCH;
  }

  if (type === DomainControlType.ILLUMINATION) {
    return ControlType.ILLUMINATION;
  }

  if (type === DomainControlType.TEXT) {
    return ControlType.TEXT;
  }

  if (type === DomainControlType.VALUE) {
    return ControlType.VALUE;
  }

  if (type === DomainControlType.VOLTAGE) {
    return ControlType.VOLTAGE;
  }

  if (type === DomainControlType.TEMPERATURE) {
    return ControlType.TEMPERATURE;
  }

  if (type === DomainControlType.RANGE) {
    return ControlType.RANGE;
  }

  if (type === DomainControlType.PUSH_BUTTON) {
    return ControlType.PUSH_BUTTON;
  }

  if (type === DomainControlType.PRESSURE) {
    return ControlType.PRESSURE;
  }

  if (type === DomainControlType.SOUND_LEVEL) {
    return ControlType.SOUND_LEVEL;
  }

  if (type === DomainControlType.REL_HUMIDITY) {
    return ControlType.REL_HUMIDITY;
  }

  if (type === DomainControlType.ATMOSPHERIC_PRESSURE) {
    return ControlType.ATMOSPHERIC_PRESSURE;
  }

  return ControlType.UNSPECIFIED;
};
