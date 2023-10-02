import { gql } from '../../clients/utils';

export const deviceQueryFragment = gql`
  {
    id
    driver
    title {
      ru
      en
    }
    error
    meta
    labels
    markup {
      title {
        ru
        en
      }
      description
      order
      color
    }
    controls {
      id
      title {
        ru
        en
      }
      order
      readonly
      type
      units
      max
      min
      precision
      value
      topic
      error
      meta
      labels
      markup {
        title {
          ru
          en
        }
        description
        order
        color
      }
    }
  }
`;
