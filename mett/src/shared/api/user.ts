import { gql, gqlClient } from '../clients/graphql-client';
import type {
  CreateUserInput,
  CreateUserOutput,
  DefaultOutput,
  DeleteUserInput,
  GetUserInput,
  GetUsersInput,
  GetUsersOutput,
  SetPasswordInput,
  SetRoleInput,
  UserOutput,
} from '../entities/graphql-types';

export const getUser = async (input: GetUserInput) => {
  const result = await gqlClient<{ getUser: UserOutput }>(
    gql`
      query ($input: GetUserInput!) {
        getUser(input: $input) {
          id
          role
          status
          name
          email
          createdAt
          updatedAt
        }
      }
    `,
    { input },
    {},
  );

  if (result instanceof Error) return result;

  return result.getUser;
};

export const getUsers = async (input: GetUsersInput) => {
  const result = await gqlClient<{ getUsers: GetUsersOutput }>(
    gql`
      query ($input: GetUsersInput!) {
        getUsers(input: $input) {
          users {
            id
            role
            status
            name
            email
            createdAt
            updatedAt
          }
          pagination {
            total
            page
            limit
          }
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.getUsers;
};

export const createUser = async (input: CreateUserInput) => {
  const result = await gqlClient<{ createUser: CreateUserOutput }>(
    gql`
      mutation ($input: CreateUserInput!) {
        createUser(input: $input) {
          user {
            id
            role
            status
            name
            email
            createdAt
            updatedAt
          }
          error {
            code
            message
          }
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.createUser;
};

export const deleteUser = async (input: DeleteUserInput) => {
  const result = await gqlClient<{ deleteUser: DefaultOutput }>(
    gql`
      mutation ($input: DeleteUserInput!) {
        deleteUser(input: $input) {
          message
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.deleteUser;
};

export const setPassword = async (input: SetPasswordInput) => {
  const result = await gqlClient<{ setPassword: DefaultOutput }>(
    gql`
      mutation ($input: SetPasswordInput!) {
        setPassword(input: $input) {
          message
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.setPassword;
};

export const setRole = async (input: SetRoleInput) => {
  const result = await gqlClient<{ setPassword: DefaultOutput }>(
    gql`
      mutation ($input: SetRoleInput!) {
        setRole(input: $input) {
          message
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.setPassword;
};
