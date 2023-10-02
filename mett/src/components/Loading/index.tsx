import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';

const antIcon = <LoadingOutlined spin />;

type LoadingProps = {
  size?: 'large';
};

export const Loading = ({size}: LoadingProps) => {
  return <Spin size={size || 'large'} indicator={antIcon} />;
};
