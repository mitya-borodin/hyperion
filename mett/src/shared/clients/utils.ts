// temp hack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gql = (strings: readonly string[], ...values: any[]) => {
  let result = '';

  strings.forEach((current, index) => {
    result += current + (values[index] || '');

    return result;
  });

  return result;
};

export const getOperationNameAndType = (str: string) => {
  const startIndex = str.indexOf('{');
  const name = str
    .slice(startIndex + 1, str.length)
    .split('')
    .reduce(
      (acc, char, _, arr) => {
        if (!['{', '('].includes(char)) {
          return [...acc, char];
        }

        arr.splice(1);

        return acc;
      },
      [''],
    )
    .join('')
    .trim();
  const type = str.includes('mutation') ? 'mutation' : 'query';

  return {
    type,
    name,
  };
};

export type GqlClientOptions = {
  headers?: { [key: string]: string };
  authorization?: string;
  fingerprint?: string;
};
