import { observer } from 'mobx-react-lite';

import { usePageTitle } from '@/shared/hooks';

const Macros = observer(() => {
  usePageTitle('Hyperion - Macros');

  return <div>Macros</div>;
});

export default Macros;
