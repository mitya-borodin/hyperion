import ReactDOM from 'react-dom';

import { Loading } from '..';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GlobalLoading = (): any => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
      <Loading />
    </div>,
    document.body,
  );
};
