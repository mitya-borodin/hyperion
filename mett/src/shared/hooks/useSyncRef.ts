import { useRef } from 'react';

export const useSyncRef = <T>(current: T) => {
  const ref = useRef(current);

  ref.current = current;

  return ref;
};
