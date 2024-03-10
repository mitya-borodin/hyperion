/* eslint-disable @typescript-eslint/no-explicit-any */
type SettingsTo = {
  buttons: Array<{
    controlId: string;
    deviceId: string;
    trigger: string;
  }>;
  illuminations: Array<{
    controlId: string;
    deviceId: string;
    trigger: string;
  }>;
  lightings: Array<{
    controlId: string;
    deviceId: string;
  }>;
};

export const settings_to_1 = (settings: any): SettingsTo => {
  return {
    buttons: settings.buttons.map(({ deviceId, controlId }: any) => ({ deviceId, controlId })),
    illuminations: settings.illuminations.map(({ deviceId, controlId }: any) => ({ deviceId, controlId })),
    lightings: settings.lightings.map(({ deviceId, controlId }: any) => ({ deviceId, controlId })),
  };
};
