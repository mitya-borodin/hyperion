import { HyperionDevice } from '../../../../domain/hyperion-device';
import { DeviceSubscriptionEvent, Error as GraphQlError } from '../../../../graphql-types';
import { SubscriptionDeviceType, SubscriptionTopic } from '../subscription';

import { toGraphQlDevice } from './to-graphql-device';

type ToGraphQlSubscriptionDevice = {
  devices: HyperionDevice[];
  type: SubscriptionDeviceType;
  error: GraphQlError;
};

export const toGraphQlSubscriptionDevice = ({
  devices: hyperionDevices,
  type,
  error,
}: ToGraphQlSubscriptionDevice): {
  topic: SubscriptionTopic;
  payload: {
    device: DeviceSubscriptionEvent;
  };
} => {
  return {
    topic: SubscriptionTopic.DEVICE,
    payload: {
      device: {
        items: hyperionDevices.map((element) => toGraphQlDevice(element)),
        type,
        error,
      },
    },
  };
};
