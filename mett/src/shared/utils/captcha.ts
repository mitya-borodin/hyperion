/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { rootStore } from '@/store';

const loadingKey = 'captcha';

export const getCaptcha = async () => {
  const { globalLoadingStore, notificationStore } = rootStore;

  return new Promise((resolve) => {
    globalLoadingStore.on(loadingKey);
    window.initGeetest4(
      {
        captchaId: import.meta.env.VITE_GEETEST_CAPTCHA_ID,
        language: 'eng',
        product: 'bind',
        protocol: 'https://',
      },
      (captchaObj) => {
        captchaObj
          .onReady(() => {
            globalLoadingStore.off(loadingKey);

            captchaObj.showBox();
          })
          .onError(() => {
            globalLoadingStore.off(loadingKey);
            notificationStore.push({ type: 'error', title: 'Captcha error', description: 'Please, try again' });

            esolve({
              result: {
                data: null,
                status: 'error',
              },
              captchaObj,
            });
          })
          .onSuccess(() => {
            const { captcha_id, ...data } = captchaObj.getValidate();
            resolve({ result: { data, status: 'success' }, captchaObj });
          })
          .onClose(() => {
            resolve({ result: { data: null, status: 'closed' }, captchaObj });
          });
      },
    );
  }).then((data) => {
    data.captchaObj?.destroy();

    return data.result;
  });
};
