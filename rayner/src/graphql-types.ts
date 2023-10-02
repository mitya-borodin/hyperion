import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { MercuriusContext } from 'mercurius';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<import('mercurius-codegen').DeepPartial<TResult>> | import('mercurius-codegen').DeepPartial<TResult>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Upload: any;
  _FieldSet: any;
};

export type LightingMacrosSetupState = {
  forceOn: Scalars['Boolean'];
};

export type LightingMacrosSetupSettingButton = {
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  type: ControlType;
  trigger: Scalars['Boolean'];
};

export type LightingMacrosSetupSettingIllumination = {
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  type: ControlType;
  trigger: Scalars['Int'];
};

export type LightingMacrosSetupSettingLighting = {
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  type: ControlType;
  level: LightingLevel;
};

export type LightingMacrosSetupSettings = {
  buttons: Array<LightingMacrosSetupSettingButton>;
  illuminations: Array<LightingMacrosSetupSettingIllumination>;
  lightings: Array<LightingMacrosSetupSettingLighting>;
};

export type LightingMacrosSetup = {
  type: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  labels: Array<Scalars['String']>;
  state: LightingMacrosSetupState;
  settings: LightingMacrosSetupSettings;
};

export type LightingMacrosState = {
  __typename?: 'LightingMacrosState';
  forceOn: Scalars['Boolean'];
};

export type LightingMacrosSettingButton = {
  __typename?: 'LightingMacrosSettingButton';
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  type: ControlType;
  trigger: Scalars['Boolean'];
};

export type LightingMacrosSettingIllumination = {
  __typename?: 'LightingMacrosSettingIllumination';
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  type: ControlType;
  trigger: Scalars['Int'];
};

export type LightingMacrosSettingLighting = {
  __typename?: 'LightingMacrosSettingLighting';
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  type: ControlType;
  level: LightingLevel;
};

export type LightingMacrosSettings = {
  __typename?: 'LightingMacrosSettings';
  buttons: Array<LightingMacrosSettingButton>;
  illuminations: Array<LightingMacrosSettingIllumination>;
  lightings: Array<LightingMacrosSettingLighting>;
};

export type LightingMacrosOutputLighting = {
  __typename?: 'LightingMacrosOutputLighting';
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  value: Scalars['String'];
};

export type LightingMacrosOutput = {
  __typename?: 'LightingMacrosOutput';
  lightings: Array<LightingMacrosOutputLighting>;
};

export type LightingMacros = {
  __typename?: 'LightingMacros';
  id: Scalars['ID'];
  type: MacrosType;
  name: Scalars['String'];
  description: Scalars['String'];
  labels: Array<Scalars['String']>;
  state: LightingMacrosState;
  settings: LightingMacrosSettings;
  output: LightingMacrosOutput;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export type GeetestCaptchaInput = {
  lot_number: Scalars['String'];
  captcha_output: Scalars['String'];
  pass_token: Scalars['String'];
  gen_time: Scalars['String'];
};

export type UserOutput = {
  __typename?: 'UserOutput';
  id: Scalars['ID'];
  role: UserRole;
  status: UserStatus;
  name: Scalars['String'];
  email: Scalars['String'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type GetUserInput = {
  id?: InputMaybe<Scalars['ID']>;
};

export type GetUsersInput = {
  pagination: PaginationInput;
};

export type GetUsersOutput = {
  __typename?: 'GetUsersOutput';
  users: Array<UserOutput>;
  pagination: PaginationOutput;
};

export type SignInInput = {
  email: Scalars['String'];
  password: Scalars['String'];
  captchaCheck: GeetestCaptchaInput;
};

export type SignInOutput = {
  __typename?: 'SignInOutput';
  accessToken?: Maybe<Scalars['String']>;
  isTwoFaActivated: Scalars['Boolean'];
  error: Error;
};

export type CreateUserInput = {
  role: UserRole;
  name: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
};

export type CreateUserOutput = {
  __typename?: 'CreateUserOutput';
  user?: Maybe<UserOutput>;
  error: Error;
};

export type DeleteUserInput = {
  id: Scalars['ID'];
};

export type SetRoleInput = {
  id: Scalars['ID'];
  role: UserRole;
};

export type SetPasswordInput = {
  id: Scalars['ID'];
  password: Scalars['String'];
};

export type ActivateTwoFaOutput = {
  __typename?: 'ActivateTwoFaOutput';
  code: Scalars['String'];
  qr: Scalars['String'];
};

export type ConfirmTwoFaInput = {
  totp: Scalars['String'];
};

export type VerifyTwoFaInput = {
  fingerprint: Scalars['String'];
  email: Scalars['String'];
  totp: Scalars['String'];
};

export type TwoFaOtpOutput = {
  __typename?: 'TwoFaOtpOutput';
  accessToken: Scalars['String'];
};

export type DeactivateTwoFaInput = {
  totp: Scalars['String'];
};

export type RefreshAccessTokenOutput = {
  __typename?: 'RefreshAccessTokenOutput';
  accessToken: Scalars['String'];
};

export enum MacrosType {
  LIGHTING = 'LIGHTING',
}

export enum ControlType {
  UNSPECIFIED = 'UNSPECIFIED',
  SWITCH = 'SWITCH',
  ILLUMINATION = 'ILLUMINATION',
  TEXT = 'TEXT',
  VALUE = 'VALUE',
  VOLTAGE = 'VOLTAGE',
  TEMPERATURE = 'TEMPERATURE',
  RANGE = 'RANGE',
  PUSH_BUTTON = 'PUSH_BUTTON',
  PRESSURE = 'PRESSURE',
  SOUND_LEVEL = 'SOUND_LEVEL',
  REL_HUMIDITY = 'REL_HUMIDITY',
  ATMOSPHERIC_PRESSURE = 'ATMOSPHERIC_PRESSURE',
}

export enum LightingLevel {
  HIGHT = 'HIGHT',
  MIDDLE = 'MIDDLE',
  LOW = 'LOW',
  ACCIDENT = 'ACCIDENT',
}

export enum SubscriptionDeviceType {
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  APPEARED = 'APPEARED',
  MARKED_UP = 'MARKED_UP',
  VALUE_IS_SET = 'VALUE_IS_SET',
}

export enum SubscriptionMacrosType {
  SETUP = 'SETUP',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE',
  OUTPUT_APPEARED = 'OUTPUT_APPEARED',
}

export type DefaultOutput = {
  __typename?: 'DefaultOutput';
  message?: Maybe<Scalars['String']>;
};

export type Error = {
  __typename?: 'Error';
  code: Scalars['Int'];
  message: Scalars['String'];
};

export type PaginationInput = {
  page?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
};

export type PaginationOutput = {
  __typename?: 'PaginationOutput';
  total: Scalars['Int'];
  page: Scalars['Int'];
  limit: Scalars['Int'];
};

export type TitleInput = {
  ru: Scalars['String'];
  en: Scalars['String'];
};

export type TitleOutput = {
  __typename?: 'TitleOutput';
  ru: Scalars['String'];
  en: Scalars['String'];
};

export type MarkupInput = {
  title: TitleInput;
  description: Scalars['String'];
  order: Scalars['Int'];
  color: Scalars['String'];
};

export type MarkupOutput = {
  __typename?: 'MarkupOutput';
  title: TitleOutput;
  description: Scalars['String'];
  order: Scalars['Int'];
  color: Scalars['String'];
};

export type MarkupDevice = {
  deviceId: Scalars['ID'];
  labels: Array<Scalars['String']>;
  markup: MarkupInput;
};

export type MarkupControl = {
  deviceId: Scalars['ID'];
  controlId: Scalars['ID'];
  labels: Array<Scalars['String']>;
  markup: MarkupInput;
};

export type Control = {
  __typename?: 'Control';
  id: Scalars['ID'];
  title: TitleOutput;
  order: Scalars['Int'];
  readonly: Scalars['Boolean'];
  type: ControlType;
  units: Scalars['String'];
  max: Scalars['Float'];
  min: Scalars['Float'];
  precision: Scalars['Float'];
  value: Scalars['String'];
  topic?: Maybe<Scalars['String']>;
  error: Scalars['String'];
  meta: Scalars['String'];
  labels: Array<Scalars['String']>;
  markup: MarkupOutput;
};

export type Device = {
  __typename?: 'Device';
  id: Scalars['ID'];
  driver: Scalars['String'];
  title: TitleOutput;
  error: Scalars['String'];
  meta: Scalars['String'];
  labels: Array<Scalars['String']>;
  markup: MarkupOutput;
  controls?: Maybe<Array<Control>>;
};

export type SetControlValue = {
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  value: Scalars['String'];
};

export type MacrosWireframe = {
  __typename?: 'MacrosWireframe';
  type: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  settings: Scalars['String'];
};

export type MacrosSetup = {
  lighting?: InputMaybe<LightingMacrosSetup>;
};

export type Macros = {
  __typename?: 'Macros';
  lighting?: Maybe<LightingMacros>;
};

export type MacrosOutput = {
  __typename?: 'MacrosOutput';
  value?: Maybe<Macros>;
  error: Error;
};

export type RemoveMacrosInput = {
  id: Scalars['ID'];
};

export type DeviceSubscriptionEvent = {
  __typename?: 'DeviceSubscriptionEvent';
  items: Array<Device>;
  type: SubscriptionDeviceType;
  error: Error;
};

export type MacrosSubscriptionEvent = {
  __typename?: 'MacrosSubscriptionEvent';
  items: Array<Macros>;
  type: SubscriptionMacrosType;
  error: Error;
};

export type Query = {
  __typename?: 'Query';
  getUser?: Maybe<UserOutput>;
  getUsers?: Maybe<GetUsersOutput>;
  getMacrosWireframes: Array<MacrosWireframe>;
};

export type QuerygetUserArgs = {
  input: GetUserInput;
};

export type QuerygetUsersArgs = {
  input: GetUsersInput;
};

export type Mutation = {
  __typename?: 'Mutation';
  signIn?: Maybe<SignInOutput>;
  signOut?: Maybe<DefaultOutput>;
  createUser?: Maybe<CreateUserOutput>;
  deleteUser?: Maybe<DefaultOutput>;
  setPassword?: Maybe<DefaultOutput>;
  setRole?: Maybe<DefaultOutput>;
  activateTwoFa?: Maybe<ActivateTwoFaOutput>;
  confirmTwoFa?: Maybe<DefaultOutput>;
  verifyTwoFa?: Maybe<TwoFaOtpOutput>;
  deactivateTwoFa?: Maybe<DefaultOutput>;
  refreshAccessToken?: Maybe<RefreshAccessTokenOutput>;
  setControlValue: Device;
  markupDevice: Device;
  markupControl: Device;
  setupMacros: MacrosOutput;
  updateMacros: MacrosOutput;
  removeMacros: MacrosOutput;
};

export type MutationsignInArgs = {
  input: SignInInput;
};

export type MutationcreateUserArgs = {
  input: CreateUserInput;
};

export type MutationdeleteUserArgs = {
  input: DeleteUserInput;
};

export type MutationsetPasswordArgs = {
  input: SetPasswordInput;
};

export type MutationsetRoleArgs = {
  input: SetRoleInput;
};

export type MutationconfirmTwoFaArgs = {
  input: ConfirmTwoFaInput;
};

export type MutationverifyTwoFaArgs = {
  input: VerifyTwoFaInput;
};

export type MutationdeactivateTwoFaArgs = {
  input: DeactivateTwoFaInput;
};

export type MutationsetControlValueArgs = {
  input: SetControlValue;
};

export type MutationmarkupDeviceArgs = {
  input: MarkupDevice;
};

export type MutationmarkupControlArgs = {
  input: MarkupControl;
};

export type MutationsetupMacrosArgs = {
  input: MacrosSetup;
};

export type MutationupdateMacrosArgs = {
  input: MacrosSetup;
};

export type MutationremoveMacrosArgs = {
  input: RemoveMacrosInput;
};

export type Subscription = {
  __typename?: 'Subscription';
  device: DeviceSubscriptionEvent;
  macros: MacrosSubscriptionEvent;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  LightingMacrosSetupState: LightingMacrosSetupState;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  LightingMacrosSetupSettingButton: LightingMacrosSetupSettingButton;
  String: ResolverTypeWrapper<Scalars['String']>;
  LightingMacrosSetupSettingIllumination: LightingMacrosSetupSettingIllumination;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  LightingMacrosSetupSettingLighting: LightingMacrosSetupSettingLighting;
  LightingMacrosSetupSettings: LightingMacrosSetupSettings;
  LightingMacrosSetup: LightingMacrosSetup;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  LightingMacrosState: ResolverTypeWrapper<LightingMacrosState>;
  LightingMacrosSettingButton: ResolverTypeWrapper<LightingMacrosSettingButton>;
  LightingMacrosSettingIllumination: ResolverTypeWrapper<LightingMacrosSettingIllumination>;
  LightingMacrosSettingLighting: ResolverTypeWrapper<LightingMacrosSettingLighting>;
  LightingMacrosSettings: ResolverTypeWrapper<LightingMacrosSettings>;
  LightingMacrosOutputLighting: ResolverTypeWrapper<LightingMacrosOutputLighting>;
  LightingMacrosOutput: ResolverTypeWrapper<LightingMacrosOutput>;
  LightingMacros: ResolverTypeWrapper<LightingMacros>;
  UserRole: UserRole;
  UserStatus: UserStatus;
  GeetestCaptchaInput: GeetestCaptchaInput;
  UserOutput: ResolverTypeWrapper<UserOutput>;
  GetUserInput: GetUserInput;
  GetUsersInput: GetUsersInput;
  GetUsersOutput: ResolverTypeWrapper<GetUsersOutput>;
  SignInInput: SignInInput;
  SignInOutput: ResolverTypeWrapper<SignInOutput>;
  CreateUserInput: CreateUserInput;
  CreateUserOutput: ResolverTypeWrapper<CreateUserOutput>;
  DeleteUserInput: DeleteUserInput;
  SetRoleInput: SetRoleInput;
  SetPasswordInput: SetPasswordInput;
  ActivateTwoFaOutput: ResolverTypeWrapper<ActivateTwoFaOutput>;
  ConfirmTwoFaInput: ConfirmTwoFaInput;
  VerifyTwoFaInput: VerifyTwoFaInput;
  TwoFaOtpOutput: ResolverTypeWrapper<TwoFaOtpOutput>;
  DeactivateTwoFaInput: DeactivateTwoFaInput;
  RefreshAccessTokenOutput: ResolverTypeWrapper<RefreshAccessTokenOutput>;
  MacrosType: MacrosType;
  ControlType: ControlType;
  LightingLevel: LightingLevel;
  SubscriptionDeviceType: SubscriptionDeviceType;
  SubscriptionMacrosType: SubscriptionMacrosType;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  DefaultOutput: ResolverTypeWrapper<DefaultOutput>;
  Error: ResolverTypeWrapper<Error>;
  PaginationInput: PaginationInput;
  PaginationOutput: ResolverTypeWrapper<PaginationOutput>;
  TitleInput: TitleInput;
  TitleOutput: ResolverTypeWrapper<TitleOutput>;
  MarkupInput: MarkupInput;
  MarkupOutput: ResolverTypeWrapper<MarkupOutput>;
  MarkupDevice: MarkupDevice;
  MarkupControl: MarkupControl;
  Control: ResolverTypeWrapper<Control>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Device: ResolverTypeWrapper<Device>;
  SetControlValue: SetControlValue;
  MacrosWireframe: ResolverTypeWrapper<MacrosWireframe>;
  MacrosSetup: MacrosSetup;
  Macros: ResolverTypeWrapper<Macros>;
  MacrosOutput: ResolverTypeWrapper<MacrosOutput>;
  RemoveMacrosInput: RemoveMacrosInput;
  DeviceSubscriptionEvent: ResolverTypeWrapper<DeviceSubscriptionEvent>;
  MacrosSubscriptionEvent: ResolverTypeWrapper<MacrosSubscriptionEvent>;
  Query: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  Subscription: ResolverTypeWrapper<{}>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  LightingMacrosSetupState: LightingMacrosSetupState;
  Boolean: Scalars['Boolean'];
  LightingMacrosSetupSettingButton: LightingMacrosSetupSettingButton;
  String: Scalars['String'];
  LightingMacrosSetupSettingIllumination: LightingMacrosSetupSettingIllumination;
  Int: Scalars['Int'];
  LightingMacrosSetupSettingLighting: LightingMacrosSetupSettingLighting;
  LightingMacrosSetupSettings: LightingMacrosSetupSettings;
  LightingMacrosSetup: LightingMacrosSetup;
  ID: Scalars['ID'];
  LightingMacrosState: LightingMacrosState;
  LightingMacrosSettingButton: LightingMacrosSettingButton;
  LightingMacrosSettingIllumination: LightingMacrosSettingIllumination;
  LightingMacrosSettingLighting: LightingMacrosSettingLighting;
  LightingMacrosSettings: LightingMacrosSettings;
  LightingMacrosOutputLighting: LightingMacrosOutputLighting;
  LightingMacrosOutput: LightingMacrosOutput;
  LightingMacros: LightingMacros;
  GeetestCaptchaInput: GeetestCaptchaInput;
  UserOutput: UserOutput;
  GetUserInput: GetUserInput;
  GetUsersInput: GetUsersInput;
  GetUsersOutput: GetUsersOutput;
  SignInInput: SignInInput;
  SignInOutput: SignInOutput;
  CreateUserInput: CreateUserInput;
  CreateUserOutput: CreateUserOutput;
  DeleteUserInput: DeleteUserInput;
  SetRoleInput: SetRoleInput;
  SetPasswordInput: SetPasswordInput;
  ActivateTwoFaOutput: ActivateTwoFaOutput;
  ConfirmTwoFaInput: ConfirmTwoFaInput;
  VerifyTwoFaInput: VerifyTwoFaInput;
  TwoFaOtpOutput: TwoFaOtpOutput;
  DeactivateTwoFaInput: DeactivateTwoFaInput;
  RefreshAccessTokenOutput: RefreshAccessTokenOutput;
  Upload: Scalars['Upload'];
  DefaultOutput: DefaultOutput;
  Error: Error;
  PaginationInput: PaginationInput;
  PaginationOutput: PaginationOutput;
  TitleInput: TitleInput;
  TitleOutput: TitleOutput;
  MarkupInput: MarkupInput;
  MarkupOutput: MarkupOutput;
  MarkupDevice: MarkupDevice;
  MarkupControl: MarkupControl;
  Control: Control;
  Float: Scalars['Float'];
  Device: Device;
  SetControlValue: SetControlValue;
  MacrosWireframe: MacrosWireframe;
  MacrosSetup: MacrosSetup;
  Macros: Macros;
  MacrosOutput: MacrosOutput;
  RemoveMacrosInput: RemoveMacrosInput;
  DeviceSubscriptionEvent: DeviceSubscriptionEvent;
  MacrosSubscriptionEvent: MacrosSubscriptionEvent;
  Query: {};
  Mutation: {};
  Subscription: {};
};

export type authDirectiveArgs = {
  requires: Array<UserRole>;
};

export type authDirectiveResolver<
  Result,
  Parent,
  ContextType = MercuriusContext,
  Args = authDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type LightingMacrosStateResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosState'] = ResolversParentTypes['LightingMacrosState'],
> = {
  forceOn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosSettingButtonResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosSettingButton'] = ResolversParentTypes['LightingMacrosSettingButton'],
> = {
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  controlId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ControlType'], ParentType, ContextType>;
  trigger?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosSettingIlluminationResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosSettingIllumination'] = ResolversParentTypes['LightingMacrosSettingIllumination'],
> = {
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  controlId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ControlType'], ParentType, ContextType>;
  trigger?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosSettingLightingResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosSettingLighting'] = ResolversParentTypes['LightingMacrosSettingLighting'],
> = {
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  controlId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ControlType'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['LightingLevel'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosSettingsResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosSettings'] = ResolversParentTypes['LightingMacrosSettings'],
> = {
  buttons?: Resolver<Array<ResolversTypes['LightingMacrosSettingButton']>, ParentType, ContextType>;
  illuminations?: Resolver<Array<ResolversTypes['LightingMacrosSettingIllumination']>, ParentType, ContextType>;
  lightings?: Resolver<Array<ResolversTypes['LightingMacrosSettingLighting']>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosOutputLightingResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosOutputLighting'] = ResolversParentTypes['LightingMacrosOutputLighting'],
> = {
  deviceId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  controlId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacrosOutput'] = ResolversParentTypes['LightingMacrosOutput'],
> = {
  lightings?: Resolver<Array<ResolversTypes['LightingMacrosOutputLighting']>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LightingMacrosResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['LightingMacros'] = ResolversParentTypes['LightingMacros'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MacrosType'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<ResolversTypes['LightingMacrosState'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['LightingMacrosSettings'], ParentType, ContextType>;
  output?: Resolver<ResolversTypes['LightingMacrosOutput'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['UserOutput'] = ResolversParentTypes['UserOutput'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserStatus'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GetUsersOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['GetUsersOutput'] = ResolversParentTypes['GetUsersOutput'],
> = {
  users?: Resolver<Array<ResolversTypes['UserOutput']>, ParentType, ContextType>;
  pagination?: Resolver<ResolversTypes['PaginationOutput'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SignInOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['SignInOutput'] = ResolversParentTypes['SignInOutput'],
> = {
  accessToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isTwoFaActivated?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateUserOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['CreateUserOutput'] = ResolversParentTypes['CreateUserOutput'],
> = {
  user?: Resolver<Maybe<ResolversTypes['UserOutput']>, ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActivateTwoFaOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['ActivateTwoFaOutput'] = ResolversParentTypes['ActivateTwoFaOutput'],
> = {
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  qr?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TwoFaOtpOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['TwoFaOtpOutput'] = ResolversParentTypes['TwoFaOtpOutput'],
> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RefreshAccessTokenOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['RefreshAccessTokenOutput'] = ResolversParentTypes['RefreshAccessTokenOutput'],
> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type DefaultOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['DefaultOutput'] = ResolversParentTypes['DefaultOutput'],
> = {
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ErrorResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Error'] = ResolversParentTypes['Error'],
> = {
  code?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginationOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['PaginationOutput'] = ResolversParentTypes['PaginationOutput'],
> = {
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  page?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TitleOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['TitleOutput'] = ResolversParentTypes['TitleOutput'],
> = {
  ru?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  en?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MarkupOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MarkupOutput'] = ResolversParentTypes['MarkupOutput'],
> = {
  title?: Resolver<ResolversTypes['TitleOutput'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  color?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ControlResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Control'] = ResolversParentTypes['Control'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['TitleOutput'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  readonly?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ControlType'], ParentType, ContextType>;
  units?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  max?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  min?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  precision?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  topic?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  meta?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  markup?: Resolver<ResolversTypes['MarkupOutput'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeviceResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Device'] = ResolversParentTypes['Device'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  driver?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['TitleOutput'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  meta?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  markup?: Resolver<ResolversTypes['MarkupOutput'], ParentType, ContextType>;
  controls?: Resolver<Maybe<Array<ResolversTypes['Control']>>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosWireframeResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MacrosWireframe'] = ResolversParentTypes['MacrosWireframe'],
> = {
  type?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Macros'] = ResolversParentTypes['Macros'],
> = {
  lighting?: Resolver<Maybe<ResolversTypes['LightingMacros']>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MacrosOutput'] = ResolversParentTypes['MacrosOutput'],
> = {
  value?: Resolver<Maybe<ResolversTypes['Macros']>, ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeviceSubscriptionEventResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['DeviceSubscriptionEvent'] = ResolversParentTypes['DeviceSubscriptionEvent'],
> = {
  items?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['SubscriptionDeviceType'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosSubscriptionEventResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MacrosSubscriptionEvent'] = ResolversParentTypes['MacrosSubscriptionEvent'],
> = {
  items?: Resolver<Array<ResolversTypes['Macros']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['SubscriptionMacrosType'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  getUser?: Resolver<
    Maybe<ResolversTypes['UserOutput']>,
    ParentType,
    ContextType,
    RequireFields<QuerygetUserArgs, 'input'>
  >;
  getUsers?: Resolver<
    Maybe<ResolversTypes['GetUsersOutput']>,
    ParentType,
    ContextType,
    RequireFields<QuerygetUsersArgs, 'input'>
  >;
  getMacrosWireframes?: Resolver<Array<ResolversTypes['MacrosWireframe']>, ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = {
  signIn?: Resolver<
    Maybe<ResolversTypes['SignInOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationsignInArgs, 'input'>
  >;
  signOut?: Resolver<Maybe<ResolversTypes['DefaultOutput']>, ParentType, ContextType>;
  createUser?: Resolver<
    Maybe<ResolversTypes['CreateUserOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationcreateUserArgs, 'input'>
  >;
  deleteUser?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationdeleteUserArgs, 'input'>
  >;
  setPassword?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationsetPasswordArgs, 'input'>
  >;
  setRole?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationsetRoleArgs, 'input'>
  >;
  activateTwoFa?: Resolver<Maybe<ResolversTypes['ActivateTwoFaOutput']>, ParentType, ContextType>;
  confirmTwoFa?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationconfirmTwoFaArgs, 'input'>
  >;
  verifyTwoFa?: Resolver<
    Maybe<ResolversTypes['TwoFaOtpOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationverifyTwoFaArgs, 'input'>
  >;
  deactivateTwoFa?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationdeactivateTwoFaArgs, 'input'>
  >;
  refreshAccessToken?: Resolver<Maybe<ResolversTypes['RefreshAccessTokenOutput']>, ParentType, ContextType>;
  setControlValue?: Resolver<
    ResolversTypes['Device'],
    ParentType,
    ContextType,
    RequireFields<MutationsetControlValueArgs, 'input'>
  >;
  markupDevice?: Resolver<
    ResolversTypes['Device'],
    ParentType,
    ContextType,
    RequireFields<MutationmarkupDeviceArgs, 'input'>
  >;
  markupControl?: Resolver<
    ResolversTypes['Device'],
    ParentType,
    ContextType,
    RequireFields<MutationmarkupControlArgs, 'input'>
  >;
  setupMacros?: Resolver<
    ResolversTypes['MacrosOutput'],
    ParentType,
    ContextType,
    RequireFields<MutationsetupMacrosArgs, 'input'>
  >;
  updateMacros?: Resolver<
    ResolversTypes['MacrosOutput'],
    ParentType,
    ContextType,
    RequireFields<MutationupdateMacrosArgs, 'input'>
  >;
  removeMacros?: Resolver<
    ResolversTypes['MacrosOutput'],
    ParentType,
    ContextType,
    RequireFields<MutationremoveMacrosArgs, 'input'>
  >;
};

export type SubscriptionResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription'],
> = {
  device?: SubscriptionResolver<ResolversTypes['DeviceSubscriptionEvent'], 'device', ParentType, ContextType>;
  macros?: SubscriptionResolver<ResolversTypes['MacrosSubscriptionEvent'], 'macros', ParentType, ContextType>;
};

export type Resolvers<ContextType = MercuriusContext> = {
  LightingMacrosState?: LightingMacrosStateResolvers<ContextType>;
  LightingMacrosSettingButton?: LightingMacrosSettingButtonResolvers<ContextType>;
  LightingMacrosSettingIllumination?: LightingMacrosSettingIlluminationResolvers<ContextType>;
  LightingMacrosSettingLighting?: LightingMacrosSettingLightingResolvers<ContextType>;
  LightingMacrosSettings?: LightingMacrosSettingsResolvers<ContextType>;
  LightingMacrosOutputLighting?: LightingMacrosOutputLightingResolvers<ContextType>;
  LightingMacrosOutput?: LightingMacrosOutputResolvers<ContextType>;
  LightingMacros?: LightingMacrosResolvers<ContextType>;
  UserOutput?: UserOutputResolvers<ContextType>;
  GetUsersOutput?: GetUsersOutputResolvers<ContextType>;
  SignInOutput?: SignInOutputResolvers<ContextType>;
  CreateUserOutput?: CreateUserOutputResolvers<ContextType>;
  ActivateTwoFaOutput?: ActivateTwoFaOutputResolvers<ContextType>;
  TwoFaOtpOutput?: TwoFaOtpOutputResolvers<ContextType>;
  RefreshAccessTokenOutput?: RefreshAccessTokenOutputResolvers<ContextType>;
  Upload?: GraphQLScalarType;
  DefaultOutput?: DefaultOutputResolvers<ContextType>;
  Error?: ErrorResolvers<ContextType>;
  PaginationOutput?: PaginationOutputResolvers<ContextType>;
  TitleOutput?: TitleOutputResolvers<ContextType>;
  MarkupOutput?: MarkupOutputResolvers<ContextType>;
  Control?: ControlResolvers<ContextType>;
  Device?: DeviceResolvers<ContextType>;
  MacrosWireframe?: MacrosWireframeResolvers<ContextType>;
  Macros?: MacrosResolvers<ContextType>;
  MacrosOutput?: MacrosOutputResolvers<ContextType>;
  DeviceSubscriptionEvent?: DeviceSubscriptionEventResolvers<ContextType>;
  MacrosSubscriptionEvent?: MacrosSubscriptionEventResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = MercuriusContext> = {
  auth?: authDirectiveResolver<any, any, ContextType>;
};

export type Loader<TReturn, TObj, TParams, TContext> = (
  queries: Array<{
    obj: TObj;
    params: TParams;
  }>,
  context: TContext & {
    reply: import('fastify').FastifyReply;
  },
) => Promise<Array<import('mercurius-codegen').DeepPartial<TReturn>>>;
export type LoaderResolver<TReturn, TObj, TParams, TContext> =
  | Loader<TReturn, TObj, TParams, TContext>
  | {
      loader: Loader<TReturn, TObj, TParams, TContext>;
      opts?: {
        cache?: boolean;
      };
    };
export interface Loaders<TContext = import('mercurius').MercuriusContext & { reply: import('fastify').FastifyReply }> {
  LightingMacrosState?: {
    forceOn?: LoaderResolver<Scalars['Boolean'], LightingMacrosState, {}, TContext>;
  };

  LightingMacrosSettingButton?: {
    deviceId?: LoaderResolver<Scalars['String'], LightingMacrosSettingButton, {}, TContext>;
    controlId?: LoaderResolver<Scalars['String'], LightingMacrosSettingButton, {}, TContext>;
    type?: LoaderResolver<ControlType, LightingMacrosSettingButton, {}, TContext>;
    trigger?: LoaderResolver<Scalars['Boolean'], LightingMacrosSettingButton, {}, TContext>;
  };

  LightingMacrosSettingIllumination?: {
    deviceId?: LoaderResolver<Scalars['String'], LightingMacrosSettingIllumination, {}, TContext>;
    controlId?: LoaderResolver<Scalars['String'], LightingMacrosSettingIllumination, {}, TContext>;
    type?: LoaderResolver<ControlType, LightingMacrosSettingIllumination, {}, TContext>;
    trigger?: LoaderResolver<Scalars['Int'], LightingMacrosSettingIllumination, {}, TContext>;
  };

  LightingMacrosSettingLighting?: {
    deviceId?: LoaderResolver<Scalars['String'], LightingMacrosSettingLighting, {}, TContext>;
    controlId?: LoaderResolver<Scalars['String'], LightingMacrosSettingLighting, {}, TContext>;
    type?: LoaderResolver<ControlType, LightingMacrosSettingLighting, {}, TContext>;
    level?: LoaderResolver<LightingLevel, LightingMacrosSettingLighting, {}, TContext>;
  };

  LightingMacrosSettings?: {
    buttons?: LoaderResolver<Array<LightingMacrosSettingButton>, LightingMacrosSettings, {}, TContext>;
    illuminations?: LoaderResolver<Array<LightingMacrosSettingIllumination>, LightingMacrosSettings, {}, TContext>;
    lightings?: LoaderResolver<Array<LightingMacrosSettingLighting>, LightingMacrosSettings, {}, TContext>;
  };

  LightingMacrosOutputLighting?: {
    deviceId?: LoaderResolver<Scalars['String'], LightingMacrosOutputLighting, {}, TContext>;
    controlId?: LoaderResolver<Scalars['String'], LightingMacrosOutputLighting, {}, TContext>;
    value?: LoaderResolver<Scalars['String'], LightingMacrosOutputLighting, {}, TContext>;
  };

  LightingMacrosOutput?: {
    lightings?: LoaderResolver<Array<LightingMacrosOutputLighting>, LightingMacrosOutput, {}, TContext>;
  };

  LightingMacros?: {
    id?: LoaderResolver<Scalars['ID'], LightingMacros, {}, TContext>;
    type?: LoaderResolver<MacrosType, LightingMacros, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], LightingMacros, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], LightingMacros, {}, TContext>;
    labels?: LoaderResolver<Array<Scalars['String']>, LightingMacros, {}, TContext>;
    state?: LoaderResolver<LightingMacrosState, LightingMacros, {}, TContext>;
    settings?: LoaderResolver<LightingMacrosSettings, LightingMacros, {}, TContext>;
    output?: LoaderResolver<LightingMacrosOutput, LightingMacros, {}, TContext>;
    createdAt?: LoaderResolver<Scalars['String'], LightingMacros, {}, TContext>;
    updatedAt?: LoaderResolver<Scalars['String'], LightingMacros, {}, TContext>;
  };

  UserOutput?: {
    id?: LoaderResolver<Scalars['ID'], UserOutput, {}, TContext>;
    role?: LoaderResolver<UserRole, UserOutput, {}, TContext>;
    status?: LoaderResolver<UserStatus, UserOutput, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    email?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    createdAt?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    updatedAt?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
  };

  GetUsersOutput?: {
    users?: LoaderResolver<Array<UserOutput>, GetUsersOutput, {}, TContext>;
    pagination?: LoaderResolver<PaginationOutput, GetUsersOutput, {}, TContext>;
  };

  SignInOutput?: {
    accessToken?: LoaderResolver<Maybe<Scalars['String']>, SignInOutput, {}, TContext>;
    isTwoFaActivated?: LoaderResolver<Scalars['Boolean'], SignInOutput, {}, TContext>;
    error?: LoaderResolver<Error, SignInOutput, {}, TContext>;
  };

  CreateUserOutput?: {
    user?: LoaderResolver<Maybe<UserOutput>, CreateUserOutput, {}, TContext>;
    error?: LoaderResolver<Error, CreateUserOutput, {}, TContext>;
  };

  ActivateTwoFaOutput?: {
    code?: LoaderResolver<Scalars['String'], ActivateTwoFaOutput, {}, TContext>;
    qr?: LoaderResolver<Scalars['String'], ActivateTwoFaOutput, {}, TContext>;
  };

  TwoFaOtpOutput?: {
    accessToken?: LoaderResolver<Scalars['String'], TwoFaOtpOutput, {}, TContext>;
  };

  RefreshAccessTokenOutput?: {
    accessToken?: LoaderResolver<Scalars['String'], RefreshAccessTokenOutput, {}, TContext>;
  };

  DefaultOutput?: {
    message?: LoaderResolver<Maybe<Scalars['String']>, DefaultOutput, {}, TContext>;
  };

  Error?: {
    code?: LoaderResolver<Scalars['Int'], Error, {}, TContext>;
    message?: LoaderResolver<Scalars['String'], Error, {}, TContext>;
  };

  PaginationOutput?: {
    total?: LoaderResolver<Scalars['Int'], PaginationOutput, {}, TContext>;
    page?: LoaderResolver<Scalars['Int'], PaginationOutput, {}, TContext>;
    limit?: LoaderResolver<Scalars['Int'], PaginationOutput, {}, TContext>;
  };

  TitleOutput?: {
    ru?: LoaderResolver<Scalars['String'], TitleOutput, {}, TContext>;
    en?: LoaderResolver<Scalars['String'], TitleOutput, {}, TContext>;
  };

  MarkupOutput?: {
    title?: LoaderResolver<TitleOutput, MarkupOutput, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], MarkupOutput, {}, TContext>;
    order?: LoaderResolver<Scalars['Int'], MarkupOutput, {}, TContext>;
    color?: LoaderResolver<Scalars['String'], MarkupOutput, {}, TContext>;
  };

  Control?: {
    id?: LoaderResolver<Scalars['ID'], Control, {}, TContext>;
    title?: LoaderResolver<TitleOutput, Control, {}, TContext>;
    order?: LoaderResolver<Scalars['Int'], Control, {}, TContext>;
    readonly?: LoaderResolver<Scalars['Boolean'], Control, {}, TContext>;
    type?: LoaderResolver<ControlType, Control, {}, TContext>;
    units?: LoaderResolver<Scalars['String'], Control, {}, TContext>;
    max?: LoaderResolver<Scalars['Float'], Control, {}, TContext>;
    min?: LoaderResolver<Scalars['Float'], Control, {}, TContext>;
    precision?: LoaderResolver<Scalars['Float'], Control, {}, TContext>;
    value?: LoaderResolver<Scalars['String'], Control, {}, TContext>;
    topic?: LoaderResolver<Maybe<Scalars['String']>, Control, {}, TContext>;
    error?: LoaderResolver<Scalars['String'], Control, {}, TContext>;
    meta?: LoaderResolver<Scalars['String'], Control, {}, TContext>;
    labels?: LoaderResolver<Array<Scalars['String']>, Control, {}, TContext>;
    markup?: LoaderResolver<MarkupOutput, Control, {}, TContext>;
  };

  Device?: {
    id?: LoaderResolver<Scalars['ID'], Device, {}, TContext>;
    driver?: LoaderResolver<Scalars['String'], Device, {}, TContext>;
    title?: LoaderResolver<TitleOutput, Device, {}, TContext>;
    error?: LoaderResolver<Scalars['String'], Device, {}, TContext>;
    meta?: LoaderResolver<Scalars['String'], Device, {}, TContext>;
    labels?: LoaderResolver<Array<Scalars['String']>, Device, {}, TContext>;
    markup?: LoaderResolver<MarkupOutput, Device, {}, TContext>;
    controls?: LoaderResolver<Maybe<Array<Control>>, Device, {}, TContext>;
  };

  MacrosWireframe?: {
    type?: LoaderResolver<Scalars['ID'], MacrosWireframe, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], MacrosWireframe, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], MacrosWireframe, {}, TContext>;
    settings?: LoaderResolver<Scalars['String'], MacrosWireframe, {}, TContext>;
  };

  Macros?: {
    lighting?: LoaderResolver<Maybe<LightingMacros>, Macros, {}, TContext>;
  };

  MacrosOutput?: {
    value?: LoaderResolver<Maybe<Macros>, MacrosOutput, {}, TContext>;
    error?: LoaderResolver<Error, MacrosOutput, {}, TContext>;
  };

  DeviceSubscriptionEvent?: {
    items?: LoaderResolver<Array<Device>, DeviceSubscriptionEvent, {}, TContext>;
    type?: LoaderResolver<SubscriptionDeviceType, DeviceSubscriptionEvent, {}, TContext>;
    error?: LoaderResolver<Error, DeviceSubscriptionEvent, {}, TContext>;
  };

  MacrosSubscriptionEvent?: {
    items?: LoaderResolver<Array<Macros>, MacrosSubscriptionEvent, {}, TContext>;
    type?: LoaderResolver<SubscriptionMacrosType, MacrosSubscriptionEvent, {}, TContext>;
    error?: LoaderResolver<Error, MacrosSubscriptionEvent, {}, TContext>;
  };
}
declare module 'mercurius' {
  interface IResolvers extends Resolvers<import('mercurius').MercuriusContext> {}
  interface MercuriusLoaders extends Loaders {}
}
