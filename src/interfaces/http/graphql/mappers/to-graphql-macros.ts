import { MacrosEject } from '../../../../domain/macros/macros';
import { Macros as GraphQlMacros } from '../../../../graphql-types';

export const toGraphQlMacros = (macros: MacrosEject): GraphQlMacros => {
  return {
    type: macros.type,
    id: macros.id,
    name: macros.name,
    description: macros.description,
    labels: macros.labels,
    settings: JSON.stringify(macros.settings),
    state: JSON.stringify(macros.state),
  };
};
