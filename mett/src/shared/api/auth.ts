import { gql, gqlClient } from '../clients/graphql-client';
import type {
  ActivateTwoFaOutput,
  ConfirmTwoFaInput,
  DeactivateTwoFaInput,
  DefaultOutput,
  RefreshAccessTokenOutput,
  SignInInput,
  SignInOutput,
  TwoFaOtpOutput,
  VerifyTwoFaInput,
} from '../entities/graphql-types';

export const signIn = async (input: SignInInput) => {
  const result = await gqlClient<{ signIn: SignInOutput }>(
    gql`
      mutation ($input: SignInInput!) {
        signIn(input: $input) {
          accessToken
          isTwoFaActivated
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

  return result.signIn;
};

export const signOut = async () => {
  const result = await gqlClient<{ signOut: DefaultOutput }>(
    gql`
      mutation {
        signOut {
          message
        }
      }
    `,
    {},
  );

  if (result instanceof Error) return result;

  return result.signOut;
};

export const refreshAccessToken = async () => {
  const result = await gqlClient<{ refreshAccessToken: RefreshAccessTokenOutput }>(
    gql`
      mutation {
        refreshAccessToken {
          accessToken
        }
      }
    `,
    {},
  );

  if (result instanceof Error) return result;

  return result.refreshAccessToken;
};

export const activateTwoFa = async () => {
  const result = await gqlClient<{ activateTwoFa: ActivateTwoFaOutput }>(
    gql`
      mutation {
        activateTwoFa {
          code
          qr
        }
      }
    `,
    {},
    {},
  );

  if (result instanceof Error) return result;

  return result.activateTwoFa;
};

export const confirmTwoFa = async (input: ConfirmTwoFaInput) => {
  const result = await gqlClient<{ confirmTwoFa: DefaultOutput }>(
    gql`
      mutation ($input: ConfirmTwoFaInput!) {
        confirmTwoFa(input: $input) {
          message
        }
      }
    `,
    {
      input,
    },
    {},
  );

  if (result instanceof Error) return result;

  return result.confirmTwoFa;
};

export const verifyTwoFa = async (input: VerifyTwoFaInput) => {
  const result = await gqlClient<{ verifyTwoFa: TwoFaOtpOutput }>(
    gql`
      mutation ($input: VerifyTwoFaInput!) {
        verifyTwoFa(input: $input) {
          accessToken
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.verifyTwoFa;
};

export const deactivateTwoFa = async (input: DeactivateTwoFaInput) => {
  const result = await gqlClient<{ deactivateTwoFa: TwoFaOtpOutput }>(
    gql`
      mutation ($input: DeactivateTwoFaInput!) {
        deactivateTwoFa(input: $input) {
          message
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.deactivateTwoFa;
};
