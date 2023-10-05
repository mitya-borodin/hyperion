import { observer } from 'mobx-react-lite';

import { usePageTitle } from '@/shared/hooks';

const Users = observer(() => {
  usePageTitle('Users');

  return <div>Users</div>;
});

export default Users;
