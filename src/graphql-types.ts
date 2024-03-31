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
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
  _FieldSet: any;
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
  deletedAt?: Maybe<Scalars['String']>;
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

export enum ControlType {
  UNSPECIFIED = 'UNSPECIFIED',
  SWITCH = 'SWITCH',
  ILLUMINATION = 'ILLUMINATION',
  TEXT = 'TEXT',
  ENUM = 'ENUM',
  VALUE = 'VALUE',
  VOLTAGE = 'VOLTAGE',
  TEMPERATURE = 'TEMPERATURE',
  RANGE = 'RANGE',
  PUSH_BUTTON = 'PUSH_BUTTON',
  PRESSURE = 'PRESSURE',
  SOUND_LEVEL = 'SOUND_LEVEL',
  REL_HUMIDITY = 'REL_HUMIDITY',
  ATMOSPHERIC_PRESSURE = 'ATMOSPHERIC_PRESSURE',
  HEAT_SOURCE = 'HEAT_SOURCE',
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
  controls: Array<Control>;
};

export type SetControlValue = {
  deviceId: Scalars['String'];
  controlId: Scalars['String'];
  value: Scalars['String'];
};

/**
 * MacrosShowcase
 *
 * Витрина доступных макросов для установки.
 *
 * Каждый MacrosShowcase содержит json schema для settings и state.
 */
export type MacrosShowcase = {
  __typename?: 'MacrosShowcase';
  type: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  settings: Scalars['String'];
  state: Scalars['String'];
};

/**
 * MacrosSetup
 *
 * По type это тип макроса полученный из ветрины макросов.
 *
 * Данные для заполнения settings и state собираются в соответствии Json Schema в
 * витрине макроса, и передаются в виде Json Text.
 */
export type MacrosSetup = {
  type: Scalars['ID'];
  id: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  labels: Array<Scalars['String']>;
  settings: Scalars['String'];
  state: Scalars['String'];
};

/**
 * Macros
 *
 * По type это тип макроса полученный из ветрины макросов, является уникальный идентификатиоромом типа макроса.
 *
 * Данные переданные в момент setup settings и state возвращаются в виде Json Text.
 */
export type Macros = {
  __typename?: 'Macros';
  type: Scalars['ID'];
  id: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  labels: Array<Scalars['String']>;
  settings: Scalars['String'];
  state: Scalars['String'];
};

export type MacrosOutput = {
  __typename?: 'MacrosOutput';
  macros: Macros;
  error: Error;
};

export type DestroyMacrosInput = {
  id: Scalars['ID'];
};

export type DestroyMacrosOutput = {
  __typename?: 'DestroyMacrosOutput';
  error: Error;
};

export type DeviceSubscriptionEvent = {
  __typename?: 'DeviceSubscriptionEvent';
  type: SubscriptionDeviceType;
  items: Array<Device>;
  error: Error;
};

export type MacrosSubscriptionEvent = {
  __typename?: 'MacrosSubscriptionEvent';
  type: SubscriptionMacrosType;
  macros: Array<Macros>;
  error: Error;
};

export type Query = {
  __typename?: 'Query';
  getUser?: Maybe<UserOutput>;
  getUsers?: Maybe<GetUsersOutput>;
  getMacrosShowcase: Array<MacrosShowcase>;
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
  destroyMacros: DestroyMacrosOutput;
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

export type MutationdestroyMacrosArgs = {
  input: DestroyMacrosInput;
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
  UserRole: UserRole;
  UserStatus: UserStatus;
  GeetestCaptchaInput: GeetestCaptchaInput;
  String: ResolverTypeWrapper<Scalars['String']>;
  UserOutput: ResolverTypeWrapper<UserOutput>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  GetUserInput: GetUserInput;
  GetUsersInput: GetUsersInput;
  GetUsersOutput: ResolverTypeWrapper<GetUsersOutput>;
  SignInInput: SignInInput;
  SignInOutput: ResolverTypeWrapper<SignInOutput>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
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
  ControlType: ControlType;
  SubscriptionDeviceType: SubscriptionDeviceType;
  SubscriptionMacrosType: SubscriptionMacrosType;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  DefaultOutput: ResolverTypeWrapper<DefaultOutput>;
  Error: ResolverTypeWrapper<Error>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
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
  MacrosShowcase: ResolverTypeWrapper<MacrosShowcase>;
  MacrosSetup: MacrosSetup;
  Macros: ResolverTypeWrapper<Macros>;
  MacrosOutput: ResolverTypeWrapper<MacrosOutput>;
  DestroyMacrosInput: DestroyMacrosInput;
  DestroyMacrosOutput: ResolverTypeWrapper<DestroyMacrosOutput>;
  DeviceSubscriptionEvent: ResolverTypeWrapper<DeviceSubscriptionEvent>;
  MacrosSubscriptionEvent: ResolverTypeWrapper<MacrosSubscriptionEvent>;
  Query: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  Subscription: ResolverTypeWrapper<{}>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  GeetestCaptchaInput: GeetestCaptchaInput;
  String: Scalars['String'];
  UserOutput: UserOutput;
  ID: Scalars['ID'];
  GetUserInput: GetUserInput;
  GetUsersInput: GetUsersInput;
  GetUsersOutput: GetUsersOutput;
  SignInInput: SignInInput;
  SignInOutput: SignInOutput;
  Boolean: Scalars['Boolean'];
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
  Int: Scalars['Int'];
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
  MacrosShowcase: MacrosShowcase;
  MacrosSetup: MacrosSetup;
  Macros: Macros;
  MacrosOutput: MacrosOutput;
  DestroyMacrosInput: DestroyMacrosInput;
  DestroyMacrosOutput: DestroyMacrosOutput;
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
  deletedAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  controls?: Resolver<Array<ResolversTypes['Control']>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosShowcaseResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MacrosShowcase'] = ResolversParentTypes['MacrosShowcase'],
> = {
  type?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Macros'] = ResolversParentTypes['Macros'],
> = {
  type?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  labels?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  state?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MacrosOutput'] = ResolversParentTypes['MacrosOutput'],
> = {
  macros?: Resolver<ResolversTypes['Macros'], ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DestroyMacrosOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['DestroyMacrosOutput'] = ResolversParentTypes['DestroyMacrosOutput'],
> = {
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeviceSubscriptionEventResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['DeviceSubscriptionEvent'] = ResolversParentTypes['DeviceSubscriptionEvent'],
> = {
  type?: Resolver<ResolversTypes['SubscriptionDeviceType'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Device']>, ParentType, ContextType>;
  error?: Resolver<ResolversTypes['Error'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosSubscriptionEventResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['MacrosSubscriptionEvent'] = ResolversParentTypes['MacrosSubscriptionEvent'],
> = {
  type?: Resolver<ResolversTypes['SubscriptionMacrosType'], ParentType, ContextType>;
  macros?: Resolver<Array<ResolversTypes['Macros']>, ParentType, ContextType>;
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
  getMacrosShowcase?: Resolver<Array<ResolversTypes['MacrosShowcase']>, ParentType, ContextType>;
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
  destroyMacros?: Resolver<
    ResolversTypes['DestroyMacrosOutput'],
    ParentType,
    ContextType,
    RequireFields<MutationdestroyMacrosArgs, 'input'>
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
  MacrosShowcase?: MacrosShowcaseResolvers<ContextType>;
  Macros?: MacrosResolvers<ContextType>;
  MacrosOutput?: MacrosOutputResolvers<ContextType>;
  DestroyMacrosOutput?: DestroyMacrosOutputResolvers<ContextType>;
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
  UserOutput?: {
    id?: LoaderResolver<Scalars['ID'], UserOutput, {}, TContext>;
    role?: LoaderResolver<UserRole, UserOutput, {}, TContext>;
    status?: LoaderResolver<UserStatus, UserOutput, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    email?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    createdAt?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    updatedAt?: LoaderResolver<Scalars['String'], UserOutput, {}, TContext>;
    deletedAt?: LoaderResolver<Maybe<Scalars['String']>, UserOutput, {}, TContext>;
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
    controls?: LoaderResolver<Array<Control>, Device, {}, TContext>;
  };

  MacrosShowcase?: {
    type?: LoaderResolver<Scalars['ID'], MacrosShowcase, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], MacrosShowcase, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], MacrosShowcase, {}, TContext>;
    settings?: LoaderResolver<Scalars['String'], MacrosShowcase, {}, TContext>;
    state?: LoaderResolver<Scalars['String'], MacrosShowcase, {}, TContext>;
  };

  Macros?: {
    type?: LoaderResolver<Scalars['ID'], Macros, {}, TContext>;
    id?: LoaderResolver<Scalars['ID'], Macros, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    labels?: LoaderResolver<Array<Scalars['String']>, Macros, {}, TContext>;
    settings?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    state?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
  };

  MacrosOutput?: {
    macros?: LoaderResolver<Macros, MacrosOutput, {}, TContext>;
    error?: LoaderResolver<Error, MacrosOutput, {}, TContext>;
  };

  DestroyMacrosOutput?: {
    error?: LoaderResolver<Error, DestroyMacrosOutput, {}, TContext>;
  };

  DeviceSubscriptionEvent?: {
    type?: LoaderResolver<SubscriptionDeviceType, DeviceSubscriptionEvent, {}, TContext>;
    items?: LoaderResolver<Array<Device>, DeviceSubscriptionEvent, {}, TContext>;
    error?: LoaderResolver<Error, DeviceSubscriptionEvent, {}, TContext>;
  };

  MacrosSubscriptionEvent?: {
    type?: LoaderResolver<SubscriptionMacrosType, MacrosSubscriptionEvent, {}, TContext>;
    macros?: LoaderResolver<Array<Macros>, MacrosSubscriptionEvent, {}, TContext>;
    error?: LoaderResolver<Error, MacrosSubscriptionEvent, {}, TContext>;
  };
}
declare module 'mercurius' {
  interface IResolvers extends Resolvers<import('mercurius').MercuriusContext> {}
  interface MercuriusLoaders extends Loaders {}
}
