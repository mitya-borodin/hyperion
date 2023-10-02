import { useLayoutEffect } from 'react';

export const usePageTitle = (subTitle = '') => {
  useLayoutEffect(() => {
    let title = import.meta.env.VITE_DOCUMENT_TITLE;

    if (subTitle) {
      title += ` | ${subTitle}`;
    }

    document.title = title;

    return () => {
      document.title = import.meta.env.VITE_DOCUMENT_TITLE;
    };
  });
};
