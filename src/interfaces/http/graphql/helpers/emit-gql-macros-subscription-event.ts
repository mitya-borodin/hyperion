import EventEmitter from 'node:events';

import { EventBus } from '../../../../domain/event-bus';
import { MacrosOptions } from '../../../../domain/macroses/macros-engine';
import { ErrorCode, ErrorMessage } from '../../../../helpers/error-type';
import { toGraphQlSubscriptionMacros } from '../mappers/to-graphql-subscription-macros';
import { SubscriptionMacrosType } from '../subscription';

type EmitGqlMacrosSubscriptionEvent = {
  eventBus: EventEmitter;
  macros: MacrosOptions;
  type: SubscriptionMacrosType;
};

export const emitGqlMacrosSubscriptionEvent = ({ eventBus, macros, type }: EmitGqlMacrosSubscriptionEvent) => {
  eventBus.emit(
    EventBus.GQL_PUBLISH_SUBSCRIPTION_EVENT,
    toGraphQlSubscriptionMacros({
      macros: [macros],
      type,
      error: {
        code: ErrorCode.ALL_RIGHT,
        message: ErrorMessage.ALL_RIGHT,
      },
    }),
  );
};
