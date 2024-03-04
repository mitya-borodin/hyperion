import EventEmitter from 'node:events';

import { EventBus } from '../../../../domain/event-bus';
import { MacrosEject } from '../../../../domain/macroses/macros';
import { ErrorCode, ErrorMessage } from '../../../../helpers/error-type';
import { toGraphQlSubscriptionMacros } from '../mappers/to-graphql-subscription-macros';
import { SubscriptionMacrosType } from '../subscription';

type EmitGqlMacrosSubscriptionEvent = {
  eventBus: EventEmitter;
  type: SubscriptionMacrosType;
  macros: MacrosEject;
};

export const emitGqlMacrosSubscriptionEvent = ({ eventBus, macros, type }: EmitGqlMacrosSubscriptionEvent) => {
  eventBus.emit(
    EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
    toGraphQlSubscriptionMacros({
      type,
      macros: [macros],
      error: {
        code: ErrorCode.ALL_RIGHT,
        message: ErrorMessage.ALL_RIGHT,
      },
    }),
  );
};
