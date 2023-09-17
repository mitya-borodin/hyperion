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

export enum UserRole {
  UNKNOWN = 'UNKNOWN',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
}

export enum MacrosType {
  LIGHTING = 'LIGHTING',
}

export enum ControlType {
  SWITCH = 'SWITCH',
  ILLUMINATION = 'ILLUMINATION',
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
  markup: MarkupOutput;
  labels?: Maybe<Array<Scalars['String']>>;
};

export type Device = {
  __typename?: 'Device';
  id: Scalars['ID'];
  driver: Scalars['String'];
  title: TitleOutput;
  error: Scalars['String'];
  meta: Scalars['String'];
  markup: MarkupOutput;
  labels?: Maybe<Array<Scalars['String']>>;
  controls?: Maybe<Array<Control>>;
};

export type Macros = {
  __typename?: 'Macros';
  id: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  type: MacrosType;
  labels?: Maybe<Array<Scalars['String']>>;
  settings: Scalars['String'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type MacrosWireframe = {
  __typename?: 'MacrosWireframe';
  type: Scalars['ID'];
  name: Scalars['String'];
  description: Scalars['String'];
  settings: Scalars['String'];
};

export type MarkupDeviceInput = {
  deviceId: Scalars['ID'];
  markup: MarkupInput;
  labels?: InputMaybe<Array<Scalars['String']>>;
};

export type MarkupDeviceControlInput = {
  deviceId: Scalars['ID'];
  controlId: Scalars['ID'];
  markup: MarkupInput;
  labels?: InputMaybe<Array<Scalars['String']>>;
};

export type SetControlValueInput = {
  deviceId: Scalars['String'];
  constrolId: Scalars['String'];
  value: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  getMacrosWireframes: Array<MacrosWireframe>;
};

export type Mutation = {
  __typename?: 'Mutation';
  markupDevice?: Maybe<DefaultOutput>;
  markupDeviceControl?: Maybe<DefaultOutput>;
  setControlValue?: Maybe<DefaultOutput>;
};

export type MutationmarkupDeviceArgs = {
  input: MarkupDeviceInput;
};

export type MutationmarkupDeviceControlArgs = {
  input: MarkupDeviceControlInput;
};

export type MutationsetControlValueArgs = {
  input: SetControlValueInput;
};

export type Subscription = {
  __typename?: 'Subscription';
  device: Array<Device>;
  macros: Array<Macros>;
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
  MacrosType: MacrosType;
  ControlType: ControlType;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  DefaultOutput: ResolverTypeWrapper<DefaultOutput>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Error: ResolverTypeWrapper<Error>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  PaginationInput: PaginationInput;
  PaginationOutput: ResolverTypeWrapper<PaginationOutput>;
  TitleInput: TitleInput;
  TitleOutput: ResolverTypeWrapper<TitleOutput>;
  MarkupInput: MarkupInput;
  MarkupOutput: ResolverTypeWrapper<MarkupOutput>;
  Control: ResolverTypeWrapper<Control>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Device: ResolverTypeWrapper<Device>;
  Macros: ResolverTypeWrapper<Macros>;
  MacrosWireframe: ResolverTypeWrapper<MacrosWireframe>;
  MarkupDeviceInput: MarkupDeviceInput;
  MarkupDeviceControlInput: MarkupDeviceControlInput;
  SetControlValueInput: SetControlValueInput;
  Query: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  Subscription: ResolverTypeWrapper<{}>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Upload: Scalars['Upload'];
  DefaultOutput: DefaultOutput;
  String: Scalars['String'];
  Error: Error;
  Int: Scalars['Int'];
  PaginationInput: PaginationInput;
  PaginationOutput: PaginationOutput;
  TitleInput: TitleInput;
  TitleOutput: TitleOutput;
  MarkupInput: MarkupInput;
  MarkupOutput: MarkupOutput;
  Control: Control;
  ID: Scalars['ID'];
  Boolean: Scalars['Boolean'];
  Float: Scalars['Float'];
  Device: Device;
  Macros: Macros;
  MacrosWireframe: MacrosWireframe;
  MarkupDeviceInput: MarkupDeviceInput;
  MarkupDeviceControlInput: MarkupDeviceControlInput;
  SetControlValueInput: SetControlValueInput;
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
  markup?: Resolver<ResolversTypes['MarkupOutput'], ParentType, ContextType>;
  labels?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
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
  markup?: Resolver<ResolversTypes['MarkupOutput'], ParentType, ContextType>;
  labels?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  controls?: Resolver<Maybe<Array<ResolversTypes['Control']>>, ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MacrosResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Macros'] = ResolversParentTypes['Macros'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MacrosType'], ParentType, ContextType>;
  labels?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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

export type QueryResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  getMacrosWireframes?: Resolver<Array<ResolversTypes['MacrosWireframe']>, ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = {
  markupDevice?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationmarkupDeviceArgs, 'input'>
  >;
  markupDeviceControl?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationmarkupDeviceControlArgs, 'input'>
  >;
  setControlValue?: Resolver<
    Maybe<ResolversTypes['DefaultOutput']>,
    ParentType,
    ContextType,
    RequireFields<MutationsetControlValueArgs, 'input'>
  >;
};

export type SubscriptionResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription'],
> = {
  device?: SubscriptionResolver<Array<ResolversTypes['Device']>, 'device', ParentType, ContextType>;
  macros?: SubscriptionResolver<Array<ResolversTypes['Macros']>, 'macros', ParentType, ContextType>;
};

export type Resolvers<ContextType = MercuriusContext> = {
  Upload?: GraphQLScalarType;
  DefaultOutput?: DefaultOutputResolvers<ContextType>;
  Error?: ErrorResolvers<ContextType>;
  PaginationOutput?: PaginationOutputResolvers<ContextType>;
  TitleOutput?: TitleOutputResolvers<ContextType>;
  MarkupOutput?: MarkupOutputResolvers<ContextType>;
  Control?: ControlResolvers<ContextType>;
  Device?: DeviceResolvers<ContextType>;
  Macros?: MacrosResolvers<ContextType>;
  MacrosWireframe?: MacrosWireframeResolvers<ContextType>;
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
    markup?: LoaderResolver<MarkupOutput, Control, {}, TContext>;
    labels?: LoaderResolver<Maybe<Array<Scalars['String']>>, Control, {}, TContext>;
  };

  Device?: {
    id?: LoaderResolver<Scalars['ID'], Device, {}, TContext>;
    driver?: LoaderResolver<Scalars['String'], Device, {}, TContext>;
    title?: LoaderResolver<TitleOutput, Device, {}, TContext>;
    error?: LoaderResolver<Scalars['String'], Device, {}, TContext>;
    meta?: LoaderResolver<Scalars['String'], Device, {}, TContext>;
    markup?: LoaderResolver<MarkupOutput, Device, {}, TContext>;
    labels?: LoaderResolver<Maybe<Array<Scalars['String']>>, Device, {}, TContext>;
    controls?: LoaderResolver<Maybe<Array<Control>>, Device, {}, TContext>;
  };

  Macros?: {
    id?: LoaderResolver<Scalars['ID'], Macros, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    type?: LoaderResolver<MacrosType, Macros, {}, TContext>;
    labels?: LoaderResolver<Maybe<Array<Scalars['String']>>, Macros, {}, TContext>;
    settings?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    createdAt?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
    updatedAt?: LoaderResolver<Scalars['String'], Macros, {}, TContext>;
  };

  MacrosWireframe?: {
    type?: LoaderResolver<Scalars['ID'], MacrosWireframe, {}, TContext>;
    name?: LoaderResolver<Scalars['String'], MacrosWireframe, {}, TContext>;
    description?: LoaderResolver<Scalars['String'], MacrosWireframe, {}, TContext>;
    settings?: LoaderResolver<Scalars['String'], MacrosWireframe, {}, TContext>;
  };
}
declare module 'mercurius' {
  interface IResolvers extends Resolvers<import('mercurius').MercuriusContext> {}
  interface MercuriusLoaders extends Loaders {}
}
