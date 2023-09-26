import { HyperionDevice } from '../../../../domain/hyperion-device';
import { Device as GraphQlDevice } from '../../../../graphql-types';

import { toGraphQLControlType } from './to-graphql-control-type';

export const toGraphQlDevice = (hyperionDevice: HyperionDevice): GraphQlDevice => {
  return {
    id: hyperionDevice.id,
    driver: hyperionDevice.driver,
    title: {
      ru: hyperionDevice.title.ru ?? '',
      en: hyperionDevice.title.en ?? '',
    },
    error: JSON.stringify(hyperionDevice.error),
    meta: JSON.stringify(hyperionDevice.meta),
    labels: hyperionDevice.labels,
    markup: {
      title: {
        ru: hyperionDevice.markup.title.ru ?? '',
        en: hyperionDevice.markup.title.en ?? '',
      },
      description: hyperionDevice.markup.description,
      order: hyperionDevice.markup.order,
      color: hyperionDevice.markup.color,
    },
    controls: hyperionDevice.controls.map((control) => {
      return {
        id: control.id,
        title: {
          ru: control.title.ru ?? '',
          en: control.title.en ?? '',
        },
        order: control.order,
        readonly: control.readonly,
        type: toGraphQLControlType(control.type),
        units: control.units,
        max: control.max,
        min: control.min,
        precision: control.precision,
        value: JSON.stringify(control.value),
        topic: control.topic,
        error: control.error,
        meta: JSON.stringify(control.meta),
        labels: control.labels,
        markup: {
          title: {
            ru: control.markup.title.ru ?? '',
            en: control.markup.title.en ?? '',
          },
          description: control.markup.description,
          order: control.markup.order,
          color: control.markup.color,
        },
      };
    }),
  };
};
