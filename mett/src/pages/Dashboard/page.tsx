import { observer } from 'mobx-react-lite';

import { usePageTitle } from '@/shared/hooks';

const Dashboard = observer(() => {
  usePageTitle('Hyperion - Dashboard');

  return <div>Dashboard</div>;
});

export default Dashboard;
