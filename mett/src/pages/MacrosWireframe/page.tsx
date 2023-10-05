import { observer } from 'mobx-react-lite';

import { usePageTitle } from '@/shared/hooks';

const MacrosWireframe = observer(() => {
  usePageTitle('MacrosWireframe');

  return <div>MacrosWireframe</div>;
});

export default MacrosWireframe;
