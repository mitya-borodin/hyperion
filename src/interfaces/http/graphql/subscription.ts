export enum SubscriptionTopic {
  DEVICE = 'DEVICE',
  MACROS = 'MACROS',
}

export enum SubscriptionDeviceType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  APPEARED = 'APPEARED',
  MARKED_UP = 'MARKED_UP',
  VALUE_IS_SET = 'VALUE_IS_SET',
}

export enum SubscriptionMacrosType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  SETUP = 'SETUP',
  UPDATE = 'UPDATE',
  DESTROY = 'DESTROY',
  OUTPUT_APPEARED = 'OUTPUT_APPEARED',
}
