/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GqlClientOptions } from './utils';
import { getOperationNameAndType } from './utils';

export { gql } from './utils';
export type { GqlClientOptions } from './utils';
/**
 * Для того, что понять как составлять объект FormData необходимо посмотреть в эту спецификацию
 * https://github.com/jaydenseric/graphql-multipart-request-spec
 */

export const gqlFormDataClient = async <DATA = any>(
  formData: FormData,
  options?: GqlClientOptions,
): Promise<DATA | Error> => {
  const { type, name } = getOperationNameAndType(JSON.parse(formData.get('operations') as string).query);
  const headers = {
    credentials: 'include',
    // authorization: options?.authorization ?? rootStore.authStore.accessToken ?? '',
    // fingerprint: options?.fingerprint ?? rootStore.fingerprintStore.fingerprint ?? '',
    ...options?.headers,
  };

  try {
    const response = await fetch(`/graphql?${type}=${name}`, {
      headers,
      method: 'post',
      body: formData,
    });

    if (!response.ok) {
      console.error(
        {
          type,
          name,
          headers,
          body: formData,
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

      return new Error(data?.errors?.[0].message ?? '');
    }

    return data;
  } catch (error: any) {
    console.error(error);

    return new Error(error?.error?.errors?.[0].message ?? '');
  }
};
