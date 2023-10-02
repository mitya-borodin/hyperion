import { observer } from 'mobx-react-lite';

import { usePageTitle } from '@/shared/hooks';

const Devices = observer(() => {
  usePageTitle('Hyperion - Devices');

  return <div>Devices</div>;
});

export default Devices;
