import { MacrosOptions } from '../../../../domain/macroses/macros-engine';
import { Error as GraphQlError, MacrosSubscriptionEvent } from '../../../../graphql-types';
import { SubscriptionMacrosType, SubscriptionTopic } from '../subscription';

import { toGraphQlMacros } from './to-graphql-macros';

type ToGraphQlSubscriptionDevice = {
  macros: MacrosOptions[];
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
        macros: macros.map((element) => toGraphQlMacros(element)),
        type,
        error,
      },
    },
  };
};
