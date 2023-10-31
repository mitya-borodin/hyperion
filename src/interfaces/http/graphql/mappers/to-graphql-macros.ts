import { LightingMacros } from '../../../../domain/macroses/lighting-macros';
import { MacrosOptions } from '../../../../domain/macroses/macros-engine';
import { Macros as GraphQlMacros } from '../../../../graphql-types';

export const toGraphQlMacros = (macros: MacrosOptions): GraphQlMacros => {
  /**
   * ! ADD_MACROS
   */
  if (macros.lighting instanceof LightingMacros) {
    return {
      lighting: macros.lighting.toJS(),
    };
  }

  return {};
};
