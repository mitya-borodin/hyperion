import { Button, Col, Form, Input, Row, Typography } from 'antd';
import { observer } from 'mobx-react-lite';

import { ErrorType } from '../../shared/utils/error-type';

import { ActivationTwoFaModal } from './components/activation-two-fa-modal';
import { VerifyTwoFaModal } from './components/verify-two-fa-modal';

import { getCaptcha } from '@/shared/utils/captcha';
import { useStore } from '@/store';

const { Title } = Typography;

type SignInFields = {
  email: string;
  password: string;
};

const SignIn = observer(() => {
  const { authStore } = useStore();

  const onFinish = async (values: SignInFields) => {
    const captcha = await getCaptcha();

    if (captcha.status !== 'success') {
      return new Error(ErrorType.INVALID_CAPTCHA);
    }

    await authStore.signIn({
      captchaCheck: captcha.data,
      email: values.email,
      password: values.password,
    });

    return undefined;
  };

  return (
    <>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex max-w-lg flex-1 flex-col gap-y-4">
          <Row>
            <Col sm={{ offset: 8 }}>
              <Title level={3}>Sign In</Title>
            </Col>
          </Row>
          <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} autoComplete="off" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  type: 'email',
                  message: 'The input is not valid E-mail!',
                },
                {
                  required: true,
                  message: 'Please input your E-mail!',
                },
              ]}
            >
              <Input disabled={authStore.signInIsInProgress} />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your password !' }]}
            >
              <Input.Password disabled={authStore.signInIsInProgress} autoComplete="new-password" />
            </Form.Item>
            <Form.Item wrapperCol={{ xs: { span: 24 }, sm: { span: 6, offset: 8 } }}>
              <Button type="primary" htmlType="submit" className="w-full" loading={authStore.signInIsInProgress}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
      <ActivationTwoFaModal />
      <VerifyTwoFaModal />
    </>
  );
});

export default SignIn;
