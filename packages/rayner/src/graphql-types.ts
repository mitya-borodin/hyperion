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

export type GetDeviceInput = {
  id: Scalars['ID'];
};

export type GetDeviceOutput = {
  __typename?: 'GetDeviceOutput';
  id: Scalars['ID'];
};

export type CreateDeviceInput = {
  id: Scalars['ID'];
};

export type CreateDeviceOutput = {
  __typename?: 'CreateDeviceOutput';
  id: Scalars['ID'];
};

export type OnDeviceInput = {
  id: Scalars['ID'];
};

export type OnDeviceOutput = {
  __typename?: 'OnDeviceOutput';
  id: Scalars['ID'];
};

export type Query = {
  __typename?: 'Query';
  getDevice: GetDeviceOutput;
};

export type QuerygetDeviceArgs = {
  input: GetDeviceInput;
};

export type Mutation = {
  __typename?: 'Mutation';
  createDevice: CreateDeviceOutput;
};

export type MutationcreateDeviceArgs = {
  input: CreateDeviceInput;
};

export type Subscription = {
  __typename?: 'Subscription';
  onDevice: OnDeviceOutput;
};

export type SubscriptiononDeviceArgs = {
  input: OnDeviceInput;
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
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  GetDeviceInput: GetDeviceInput;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  GetDeviceOutput: ResolverTypeWrapper<GetDeviceOutput>;
  CreateDeviceInput: CreateDeviceInput;
  CreateDeviceOutput: ResolverTypeWrapper<CreateDeviceOutput>;
  OnDeviceInput: OnDeviceInput;
  OnDeviceOutput: ResolverTypeWrapper<OnDeviceOutput>;
  Query: ResolverTypeWrapper<{}>;
  Mutation: ResolverTypeWrapper<{}>;
  Subscription: ResolverTypeWrapper<{}>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  String: ResolverTypeWrapper<Scalars['String']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Upload: Scalars['Upload'];
  GetDeviceInput: GetDeviceInput;
  ID: Scalars['ID'];
  GetDeviceOutput: GetDeviceOutput;
  CreateDeviceInput: CreateDeviceInput;
  CreateDeviceOutput: CreateDeviceOutput;
  OnDeviceInput: OnDeviceInput;
  OnDeviceOutput: OnDeviceOutput;
  Query: {};
  Mutation: {};
  Subscription: {};
  Boolean: Scalars['Boolean'];
  String: Scalars['String'];
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

export type GetDeviceOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['GetDeviceOutput'] = ResolversParentTypes['GetDeviceOutput'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CreateDeviceOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['CreateDeviceOutput'] = ResolversParentTypes['CreateDeviceOutput'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OnDeviceOutputResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['OnDeviceOutput'] = ResolversParentTypes['OnDeviceOutput'],
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query'],
> = {
  getDevice?: Resolver<
    ResolversTypes['GetDeviceOutput'],
    ParentType,
    ContextType,
    RequireFields<QuerygetDeviceArgs, 'input'>
  >;
};

export type MutationResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation'],
> = {
  createDevice?: Resolver<
    ResolversTypes['CreateDeviceOutput'],
    ParentType,
    ContextType,
    RequireFields<MutationcreateDeviceArgs, 'input'>
  >;
};

export type SubscriptionResolvers<
  ContextType = MercuriusContext,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription'],
> = {
  onDevice?: SubscriptionResolver<
    ResolversTypes['OnDeviceOutput'],
    'onDevice',
    ParentType,
    ContextType,
    RequireFields<SubscriptiononDeviceArgs, 'input'>
  >;
};

export type Resolvers<ContextType = MercuriusContext> = {
  Upload?: GraphQLScalarType;
  GetDeviceOutput?: GetDeviceOutputResolvers<ContextType>;
  CreateDeviceOutput?: CreateDeviceOutputResolvers<ContextType>;
  OnDeviceOutput?: OnDeviceOutputResolvers<ContextType>;
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
  GetDeviceOutput?: {
    id?: LoaderResolver<Scalars['ID'], GetDeviceOutput, {}, TContext>;
  };

  CreateDeviceOutput?: {
    id?: LoaderResolver<Scalars['ID'], CreateDeviceOutput, {}, TContext>;
  };

  OnDeviceOutput?: {
    id?: LoaderResolver<Scalars['ID'], OnDeviceOutput, {}, TContext>;
  };
}
declare module 'mercurius' {
  interface IResolvers extends Resolvers<import('mercurius').MercuriusContext> {}
  interface MercuriusLoaders extends Loaders {}
}
