import { gql } from '../../clients/utils';

export const lightingMacrosQueryFragment = gql`
  {
    id
    type
    name
    description
    labels
    state {
      forceOn
    }
    settings {
      buttons {
        deviceId
        controlId
        type
        trigger
      }
      illuminations {
        deviceId
        controlId
        type
        trigger
      }
      lightings {
        deviceId
        controlId
        type
        level
      }
    }
    output {
      lightings {
        deviceId
        controlId
        value
      }
    }
    createdAt
    updatedAt
  }
`;
