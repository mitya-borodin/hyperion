export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  Upload: { input: any; output: any };
};

export type ActivateTwoFaOutput = {
  __typename?: 'ActivateTwoFaOutput';
  code: Scalars['String']['output'];
  qr: Scalars['String']['output'];
};

export type ConfirmTwoFaInput = {
  totp: Scalars['String']['input'];
};

export type Control = {
  __typename?: 'Control';
  error: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  labels: Array<Scalars['String']['output']>;
  markup: MarkupOutput;
  max: Scalars['Float']['output'];
  meta: Scalars['String']['output'];
  min: Scalars['Float']['output'];
  order: Scalars['Int']['output'];
  precision: Scalars['Float']['output'];
  readonly: Scalars['Boolean']['output'];
  title: TitleOutput;
  topic?: Maybe<Scalars['String']['output']>;
  type: ControlType;
  units: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export enum ControlType {
  AtmosphericPressure = 'ATMOSPHERIC_PRESSURE',
  Illumination = 'ILLUMINATION',
  Pressure = 'PRESSURE',
  PushButton = 'PUSH_BUTTON',
  Range = 'RANGE',
  RelHumidity = 'REL_HUMIDITY',
  SoundLevel = 'SOUND_LEVEL',
  Switch = 'SWITCH',
  Temperature = 'TEMPERATURE',
  Text = 'TEXT',
  Unspecified = 'UNSPECIFIED',
  Value = 'VALUE',
  Voltage = 'VOLTAGE',
}

export type CreateUserInput = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: UserRole;
};

export type CreateUserOutput = {
  __typename?: 'CreateUserOutput';
  error: Error;
  user?: Maybe<UserOutput>;
};

export type DeactivateTwoFaInput = {
  totp: Scalars['String']['input'];
};

export type DefaultOutput = {
  __typename?: 'DefaultOutput';
  message?: Maybe<Scalars['String']['output']>;
};

export type DeleteUserInput = {
  id: Scalars['ID']['input'];
};

export type Device = {
  __typename?: 'Device';
  controls?: Maybe<Array<Control>>;
  driver: Scalars['String']['output'];
  error: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  labels: Array<Scalars['String']['output']>;
  markup: MarkupOutput;
  meta: Scalars['String']['output'];
  title: TitleOutput;
};

export type DeviceSubscriptionEvent = {
  __typename?: 'DeviceSubscriptionEvent';
  error: Error;
  items: Array<Device>;
  type: SubscriptionDeviceType;
};

export type Error = {
  __typename?: 'Error';
  code: Scalars['Int']['output'];
  message: Scalars['String']['output'];
};

export type GeetestCaptchaInput = {
  captcha_output: Scalars['String']['input'];
  gen_time: Scalars['String']['input'];
  lot_number: Scalars['String']['input'];
  pass_token: Scalars['String']['input'];
};

export type GetUserInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type GetUsersInput = {
  pagination: PaginationInput;
};

export type GetUsersOutput = {
  __typename?: 'GetUsersOutput';
  pagination: PaginationOutput;
  users: Array<UserOutput>;
};

export enum LightingLevel {
  Accident = 'ACCIDENT',
  Hight = 'HIGHT',
  Low = 'LOW',
  Middle = 'MIDDLE',
}

export type LightingMacros = {
  __typename?: 'LightingMacros';
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  labels: Array<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  output: LightingMacrosOutput;
  settings: LightingMacrosSettings;
  state: LightingMacrosState;
  type: MacrosType;
  updatedAt: Scalars['String']['output'];
};

export type LightingMacrosOutput = {
  __typename?: 'LightingMacrosOutput';
  lightings: Array<LightingMacrosOutputLighting>;
};

export type LightingMacrosOutputLighting = {
  __typename?: 'LightingMacrosOutputLighting';
  controlId: Scalars['String']['output'];
  deviceId: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type LightingMacrosSettingButton = {
  __typename?: 'LightingMacrosSettingButton';
  controlId: Scalars['String']['output'];
  deviceId: Scalars['String']['output'];
  trigger: Scalars['Boolean']['output'];
  type: ControlType;
};

export type LightingMacrosSettingIllumination = {
  __typename?: 'LightingMacrosSettingIllumination';
  controlId: Scalars['String']['output'];
  deviceId: Scalars['String']['output'];
  trigger: Scalars['Int']['output'];
  type: ControlType;
};

export type LightingMacrosSettingLighting = {
  __typename?: 'LightingMacrosSettingLighting';
  controlId: Scalars['String']['output'];
  deviceId: Scalars['String']['output'];
  level: LightingLevel;
  type: ControlType;
};

export type LightingMacrosSettings = {
  __typename?: 'LightingMacrosSettings';
  buttons: Array<LightingMacrosSettingButton>;
  illuminations: Array<LightingMacrosSettingIllumination>;
  lightings: Array<LightingMacrosSettingLighting>;
};

export type LightingMacrosSetup = {
  description: Scalars['String']['input'];
  labels: Array<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  settings: LightingMacrosSetupSettings;
  state: LightingMacrosSetupState;
  type: Scalars['ID']['input'];
};

export type LightingMacrosSetupSettingButton = {
  controlId: Scalars['String']['input'];
  deviceId: Scalars['String']['input'];
  trigger: Scalars['Boolean']['input'];
  type: ControlType;
};

export type LightingMacrosSetupSettingIllumination = {
  controlId: Scalars['String']['input'];
  deviceId: Scalars['String']['input'];
  trigger: Scalars['Int']['input'];
  type: ControlType;
};

export type LightingMacrosSetupSettingLighting = {
  controlId: Scalars['String']['input'];
  deviceId: Scalars['String']['input'];
  level: LightingLevel;
  type: ControlType;
};

export type LightingMacrosSetupSettings = {
  buttons: Array<LightingMacrosSetupSettingButton>;
  illuminations: Array<LightingMacrosSetupSettingIllumination>;
  lightings: Array<LightingMacrosSetupSettingLighting>;
};

export type LightingMacrosSetupState = {
  forceOn: Scalars['Boolean']['input'];
};

export type LightingMacrosState = {
  __typename?: 'LightingMacrosState';
  forceOn: Scalars['Boolean']['output'];
};

export type Macros = {
  __typename?: 'Macros';
  lighting?: Maybe<LightingMacros>;
};

export type MacrosOutput = {
  __typename?: 'MacrosOutput';
  error: Error;
  value?: Maybe<Macros>;
};

export type MacrosSetup = {
  lighting?: InputMaybe<LightingMacrosSetup>;
};

export type MacrosSubscriptionEvent = {
  __typename?: 'MacrosSubscriptionEvent';
  error: Error;
  items: Array<Macros>;
  type: SubscriptionMacrosType;
};

export enum MacrosType {
  Lighting = 'LIGHTING',
}

export type MacrosWireframe = {
  __typename?: 'MacrosWireframe';
  description: Scalars['String']['output'];
  name: Scalars['String']['output'];
  settings: Scalars['String']['output'];
  type: Scalars['ID']['output'];
};

export type MarkupControl = {
  controlId: Scalars['ID']['input'];
  deviceId: Scalars['ID']['input'];
  labels: Array<Scalars['String']['input']>;
  markup: MarkupInput;
};

export type MarkupDevice = {
  deviceId: Scalars['ID']['input'];
  labels: Array<Scalars['String']['input']>;
  markup: MarkupInput;
};

export type MarkupInput = {
  color: Scalars['String']['input'];
  description: Scalars['String']['input'];
  order: Scalars['Int']['input'];
  title: TitleInput;
};

export type MarkupOutput = {
  __typename?: 'MarkupOutput';
  color: Scalars['String']['output'];
  description: Scalars['String']['output'];
  order: Scalars['Int']['output'];
  title: TitleOutput;
};

export type Mutation = {
  __typename?: 'Mutation';
  activateTwoFa?: Maybe<ActivateTwoFaOutput>;
  confirmTwoFa?: Maybe<DefaultOutput>;
  createUser?: Maybe<CreateUserOutput>;
  deactivateTwoFa?: Maybe<DefaultOutput>;
  deleteUser?: Maybe<DefaultOutput>;
  markupControl: Device;
  markupDevice: Device;
  refreshAccessToken?: Maybe<RefreshAccessTokenOutput>;
  removeMacros: MacrosOutput;
  setControlValue: Device;
  setPassword?: Maybe<DefaultOutput>;
  setRole?: Maybe<DefaultOutput>;
  setupMacros: MacrosOutput;
  signIn?: Maybe<SignInOutput>;
  signOut?: Maybe<DefaultOutput>;
  updateMacros: MacrosOutput;
  verifyTwoFa?: Maybe<TwoFaOtpOutput>;
};

export type MutationConfirmTwoFaArgs = {
  input: ConfirmTwoFaInput;
};

export type MutationCreateUserArgs = {
  input: CreateUserInput;
};

export type MutationDeactivateTwoFaArgs = {
  input: DeactivateTwoFaInput;
};

export type MutationDeleteUserArgs = {
  input: DeleteUserInput;
};

export type MutationMarkupControlArgs = {
  input: MarkupControl;
};

export type MutationMarkupDeviceArgs = {
  input: MarkupDevice;
};

export type MutationRemoveMacrosArgs = {
  input: RemoveMacrosInput;
};

export type MutationSetControlValueArgs = {
  input: SetControlValue;
};

export type MutationSetPasswordArgs = {
  input: SetPasswordInput;
};

export type MutationSetRoleArgs = {
  input: SetRoleInput;
};

export type MutationSetupMacrosArgs = {
  input: MacrosSetup;
};

export type MutationSignInArgs = {
  input: SignInInput;
};

export type MutationUpdateMacrosArgs = {
  input: MacrosSetup;
};

export type MutationVerifyTwoFaArgs = {
  input: VerifyTwoFaInput;
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};

export type PaginationOutput = {
  __typename?: 'PaginationOutput';
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  getMacrosWireframes: Array<MacrosWireframe>;
  getUser?: Maybe<UserOutput>;
  getUsers?: Maybe<GetUsersOutput>;
};

export type QueryGetUserArgs = {
  input: GetUserInput;
};

export type QueryGetUsersArgs = {
  input: GetUsersInput;
};

export type RefreshAccessTokenOutput = {
  __typename?: 'RefreshAccessTokenOutput';
  accessToken: Scalars['String']['output'];
};

export type RemoveMacrosInput = {
  id: Scalars['ID']['input'];
};

export type SetControlValue = {
  controlId: Scalars['String']['input'];
  deviceId: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type SetPasswordInput = {
  id: Scalars['ID']['input'];
  password: Scalars['String']['input'];
};

export type SetRoleInput = {
  id: Scalars['ID']['input'];
  role: UserRole;
};

export type SignInInput = {
  captchaCheck: GeetestCaptchaInput;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type SignInOutput = {
  __typename?: 'SignInOutput';
  accessToken?: Maybe<Scalars['String']['output']>;
  error: Error;
  isTwoFaActivated: Scalars['Boolean']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  device: DeviceSubscriptionEvent;
  macros: MacrosSubscriptionEvent;
};

export enum SubscriptionDeviceType {
  Appeared = 'APPEARED',
  ConnectionEstablished = 'CONNECTION_ESTABLISHED',
  MarkedUp = 'MARKED_UP',
  ValueIsSet = 'VALUE_IS_SET',
}

export enum SubscriptionMacrosType {
  OutputAppeared = 'OUTPUT_APPEARED',
  Remove = 'REMOVE',
  Setup = 'SETUP',
  Update = 'UPDATE',
}

export type TitleInput = {
  en: Scalars['String']['input'];
  ru: Scalars['String']['input'];
};

export type TitleOutput = {
  __typename?: 'TitleOutput';
  en: Scalars['String']['output'];
  ru: Scalars['String']['output'];
};

export type TwoFaOtpOutput = {
  __typename?: 'TwoFaOtpOutput';
  accessToken: Scalars['String']['output'];
};

export type UserOutput = {
  __typename?: 'UserOutput';
  createdAt: Scalars['String']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  role: UserRole;
  status: UserStatus;
  updatedAt: Scalars['String']['output'];
};

export enum UserRole {
  Admin = 'ADMIN',
  Operator = 'OPERATOR',
  Viewer = 'VIEWER',
}

export enum UserStatus {
  Active = 'ACTIVE',
  Deleted = 'DELETED',
}

export type VerifyTwoFaInput = {
  email: Scalars['String']['input'];
  fingerprint: Scalars['String']['input'];
  totp: Scalars['String']['input'];
};
