import { Form, Image, Input, Modal, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { useStore } from '@/store';

const { Paragraph, Link } = Typography;

export const ActivationTwoFaModal = observer(() => {
  const { authStore } = useStore();

  const [totp, setTotp] = useState('');

  const renderContent = () => {
    return (
      <div className="flex flex-col">
        <Paragraph>
          <ol>
            <li>
              Download{' '}
              <Link target="_blank" rel="noreferrer" href="https://googleauthenticator.org/">
                Google Authenticator
              </Link>
            </li>
            <li>In the App Set up account</li>
            <li>Choose Scan a barcode and scan QR-code or copy key and enter in Google Authenticator.</li>
          </ol>
        </Paragraph>
        <div className="flex items-center justify-center gap-x-4">
          <div className="shrink-0">
            <Image src={authStore.dataForTwoFaActivation.qr} width={150} />
          </div>
          <Paragraph strong className="shrink-0" style={{ margin: 0 }}>
            OR
          </Paragraph>
          <Paragraph copyable style={{ margin: 0 }}>
            {authStore.dataForTwoFaActivation.code}
          </Paragraph>
        </div>
        <div className="flex flex-col">
          <Form.Item label="Enter the 6-digit code from Google Authenticator">
            <Input
              type="number"
              placeholder="Code"
              value={totp}
              onChange={(e) => {
                if (e.target.value.length <= 6) {
                  setTotp(e.target.value);
                }
              }}
            />
          </Form.Item>
        </div>
      </div>
    );
  };

  return (
    <Modal
      centered
      maskClosable={false}
      closable={false}
      title="Enable 2FA"
      open={authStore.openActivationTwoFaModal}
      okText="Confirm"
      onOk={() => authStore.confirmTwoFa(totp)}
      cancelText="Cancel"
      onCancel={() => authStore.destroy()}
    >
      {renderContent()}
    </Modal>
  );
});
