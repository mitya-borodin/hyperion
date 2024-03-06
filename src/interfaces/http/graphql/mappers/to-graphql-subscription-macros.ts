import { MacrosEject } from '../../../../domain/macros/macros';
import { Error as GraphQlError, MacrosSubscriptionEvent } from '../../../../graphql-types';
import { SubscriptionMacrosType, SubscriptionTopic } from '../subscription';

import { toGraphQlMacros } from './to-graphql-macros';

type ToGraphQlSubscriptionDevice = {
  macros: MacrosEject[];
  type: SubscriptionMacrosType;
  error: GraphQlError;
};

export const toGraphQlSubscriptionMacros = ({
  macros,
  type,
  error,
}: ToGraphQlSubscriptionDevice): {
  topic: SubscriptionTopic;
  payload: {
    macros: MacrosSubscriptionEvent;
  };
} => {
  return {
    topic: SubscriptionTopic.MACROS,
    payload: {
      macros: {
        type,
        macros: macros.map((element) => toGraphQlMacros(element)),
        error,
      },
    },
  };
};
