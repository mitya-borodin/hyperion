import { Form, Input, Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useStore } from '@/store';

export const VerifyTwoFaModal = observer(() => {
  const { authStore } = useStore();

  const navigate = useNavigate();
  const location = useLocation();

  const [totp, setTotp] = useState('');

  const onOk = async () => {
    const verifyTwoFaResult = await authStore.verifyTwoFa(totp);

    if (verifyTwoFaResult instanceof Error) {
      return;
    }

    navigate(location.state?.from || '/', { replace: true });
  };

  const renderContent = () => {
    return (
      <div className="flex flex-col">
        <Form.Item label="Enter the 6-digit code from Google Authenticator">
          <Input
            type="number"
            placeholder="Totp"
            value={totp}
            onChange={(e) => {
              const inputValue = e.target.value;

              if (inputValue.length <= 6) {
                setTotp(inputValue);
              }
            }}
          />
        </Form.Item>
      </div>
    );
  };

  return (
    <Modal
      title="Verify 2FA"
      centered
      maskClosable={false}
      closable={false}
      open={authStore.openVerifyTwoFaModal}
      okText="Submit"
      onOk={onOk}
      cancelText="Cancel"
      onCancel={() => authStore.destroy()}
    >
      {renderContent()}
    </Modal>
  );
});
