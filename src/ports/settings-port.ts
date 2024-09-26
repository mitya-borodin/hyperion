import { Settings, SettingType } from '../domain/settings';

export type CreateSettingParameters = {
  key: SettingType;
  value: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface SettingsPort {
  create(parameters: CreateSettingParameters): Promise<Settings | Error>;

  hasSeed(): Promise<boolean | Error>;
}
