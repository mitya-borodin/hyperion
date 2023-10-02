/* eslint-disable @typescript-eslint/no-explicit-any */
import { rootStore } from '../../store';
import { ErrorType } from '../utils/error-type';

import type { GqlClientOptions } from './utils';
import { getOperationNameAndType } from './utils';

export { gql } from './utils';
export type { GqlClientOptions } from './utils';

export const gqlClient = async <DATA = any, VARIABLES = any>(
  query: string,
  variables?: VARIABLES,
  options?: GqlClientOptions,
): Promise<DATA | Error> => {
  const { type, name } = getOperationNameAndType(query);

  const headers = {
    'Content-Type': 'application/json',
    credentials: 'include',
    authorization: options?.authorization ?? rootStore.authStore.accessToken ?? '',
    fingerprint: options?.fingerprint ?? rootStore.fingerprintStore.fingerprint ?? '',
    ...options?.headers,
  };

  const body = {
    query,
    variables: variables ?? {},
  };

  try {
    const response = await fetch(`/graphql?${type}=${name}`, {
      headers,
      method: 'post',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        {
          type,
          name,
          headers,
          body,
          method: 'post',
          status: response.status,
          statusText: response.statusText,
        },
        'BAD_REQUEST 🚨',
      );

      return new Error(response.statusText);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error(errors);

      return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
    }

    return data;
  } catch (error: any) {
    console.error(error);

    return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
  }
};
