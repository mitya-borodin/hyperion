import { gql, gqlClient } from '../../clients/graphql-client';
import type {
  MacrosWireframe,
  SetControlValue,
  Device,
  MarkupDevice,
  MarkupControl,
  MacrosSetup,
  MacrosOutput,
  RemoveMacrosInput,
} from '../../entities/graphql-types';

import { deviceQueryFragment } from './device-query-fragment';
import { lightingMacrosQueryFragment } from './lighting-macros-query-fragment';

export const getMacrosWireframes = async () => {
  const result = await gqlClient<{ getMacrosWireframes: MacrosWireframe[] }>(
    gql`
      query {
        getMacrosWireframes {
          type
          name
          description
          settings
        }
      }
    `,
    {},
    {},
  );

  if (result instanceof Error) return result;

  return result.getMacrosWireframes;
};

export const setControlValue = async (input: SetControlValue) => {
  const result = await gqlClient<{ setControlValue: Device }>(
    gql`
      mutation ($input: SetControlValue!) {
        setControlValue(input: $input) ${deviceQueryFragment}
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.setControlValue;
};

export const markupDevice = async (input: MarkupDevice) => {
  const result = await gqlClient<{ markupDevice: Device }>(
    gql`
      mutation ($input: MarkupDevice!) {
        markupDevice(input: $input) ${deviceQueryFragment}
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.markupDevice;
};

export const markupControl = async (input: MarkupControl) => {
  const result = await gqlClient<{ markupControl: Device }>(
    gql`
      mutation ($input: MarkupControl!) {
        markupControl(input: $input) ${deviceQueryFragment}
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.markupControl;
};

export const setupMacros = async (input: MacrosSetup) => {
  const result = await gqlClient<{ setupMacros: MacrosOutput }>(
    gql`
      mutation ($input: MacrosSetup!) {
        setupMacros(input: $input) {
          value {
            lighting ${lightingMacrosQueryFragment}
          }
          error {
            code
            message
          }
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.setupMacros;
};

export const updateMacros = async (input: MacrosSetup) => {
  const result = await gqlClient<{ updateMacros: MacrosOutput }>(
    gql`
      mutation ($input: MacrosSetup!) {
        updateMacros(input: $input) {
          value {
            lighting ${lightingMacrosQueryFragment}
          }
          error {
            code
            message
          }
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.updateMacros;
};

export const removeMacros = async (input: RemoveMacrosInput) => {
  const result = await gqlClient<{ removeMacros: MacrosOutput }>(
    gql`
      mutation ($input: RemoveMacrosInput!) {
        removeMacros(input: $input) {
          value {
            lighting ${lightingMacrosQueryFragment}
          }
          error {
            code
            message
          }
        }
      }
    `,
    {
      input,
    },
  );

  if (result instanceof Error) return result;

  return result.removeMacros;
};
