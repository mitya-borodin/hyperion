import { makeAutoObservable } from 'mobx';

import { api } from '../shared/api';
import type { SignInInput } from '../shared/entities/graphql-types';
import { ErrorCode, ErrorType } from '../shared/utils/error-type';

import type { RootStoreInterface } from '.';

export const createAuthStore = (rootStore: RootStoreInterface) => {
  return makeAutoObservable({
    accessToken: '',
    sessionIsActive: false,

    signInIsInProgress: false,

    isTwoFaActivated: false,
    emailForTwoFaActivation: '',
    dataForTwoFaActivation: {
      code: '',
      qr: '',
    },

    get openActivationTwoFaModal() {
      return this.accessToken && this.isTwoFaActivated === false;
    },

    get openVerifyTwoFaModal() {
      return !this.accessToken && this.isTwoFaActivated === true;
    },

    setAccessToken(accessToken: string) {
      this.accessToken = accessToken;
    },

    setSessionIsActive(sessionIsActive: boolean) {
      this.sessionIsActive = sessionIsActive;
    },

    setIsTwoFaActivated(isTwoFaActivated: boolean) {
      this.isTwoFaActivated = isTwoFaActivated;
    },

    setEmailForTwoFaActivation(email: string) {
      this.emailForTwoFaActivation = email;
    },

    setSignInIsInProgress(signInIsInProgress: boolean) {
      this.signInIsInProgress = signInIsInProgress;
    },

    setDataForTwoFaActivation(code: string, qr: string) {
      this.dataForTwoFaActivation = {
        code,
        qr,
      };
    },

    destroyDataForTwoFaActivation() {
      this.isTwoFaActivated = false;
      this.emailForTwoFaActivation = '';
      this.dataForTwoFaActivation = {
        code: '',
        qr: '',
      };
    },

    destroy() {
      this.accessToken = '';
      this.sessionIsActive = false;
      this.signInIsInProgress = false;
      this.destroyDataForTwoFaActivation();
    },

    async runSession() {
      console.log('An attempt to establish a working session has begun 🚀');

      const { globalLoadingStore, notificationStore, userStore } = rootStore;

      const loadingKey = 'runSession';

      globalLoadingStore.on(loadingKey);

      const refreshAccessToken = await api.refreshAccessToken();

      globalLoadingStore.off(loadingKey);

      if (refreshAccessToken instanceof Error) {
        this.destroy();
        userStore.destroy();

        console.log('Failed to establish a working session 🚨');

        return 'GoToSignIn';
      }

      this.setAccessToken(refreshAccessToken.accessToken);

      const getUserResult = await userStore.getUser();

      if (getUserResult instanceof Error) {
        notificationStore.push({ message: 'Get user error 🚨' });

        this.destroy();
        userStore.destroy();

        return 'GoToSignIn';
      }

      this.setSessionIsActive(true);

      console.log('The working session has been successfully installed ✅');

      return 'GoToIndex';
    },

    async signIn(input: SignInInput) {
      const { notificationStore } = rootStore;

      this.setSignInIsInProgress(true);

      const signInResult = await api.signIn(input);

      if (signInResult instanceof Error) {
        notificationStore.push({ type: 'error', message: 'Sign in error 🚨' });

        this.setSignInIsInProgress(false);

        return 'GoToSignIn';
      }

      if (signInResult.error.code !== ErrorCode.ALL_RIGHT) {
        notificationStore.push({
          type: 'error',
          message: 'Sign in failed 🚨',
          description: signInResult.error?.message ?? '',
        });

        this.setSignInIsInProgress(false);

        return 'GoToSignIn';
      }

      this.setEmailForTwoFaActivation(input.email);
      this.setIsTwoFaActivated(signInResult.isTwoFaActivated);
      this.setAccessToken(signInResult.accessToken ?? '');

      if (this.isTwoFaActivated === false) {
        await this.activateTwoFa();
      }

      this.setSignInIsInProgress(false);

      return 'GoToIndex';
    },

    async refreshAccessToken(): Promise<Promise<'StayHere' | 'GoToSignIn'>> {
      const refreshAccessTokenResult = await api.refreshAccessToken();

      if (refreshAccessTokenResult instanceof Error) {
        return this.signOut();
      }

      this.setAccessToken(refreshAccessTokenResult.accessToken);

      return 'StayHere';
    },

    async signOut(): Promise<'GoToSignIn'> {
      const { globalLoadingStore, userStore } = rootStore;

      const loadingKey = 'signOut';

      globalLoadingStore.on(loadingKey);

      await api.signOut();

      globalLoadingStore.off(loadingKey);

      this.destroy();
      userStore.destroy();

      return 'GoToSignIn';
    },

    async activateTwoFa() {
      const globalKey = 'activateTwoFa';

      const { notificationStore, globalLoadingStore } = rootStore;

      globalLoadingStore.on(globalKey);

      const dataForTwoFaActivation = await api.activateTwoFa();

      globalLoadingStore.off(globalKey);

      if (dataForTwoFaActivation instanceof Error) {
        notificationStore.push({ message: 'Unable to activate TwoFa, please contact support 🚨' });

        return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
      }

      this.setDataForTwoFaActivation(dataForTwoFaActivation.code, dataForTwoFaActivation.qr);

      return undefined;
    },

    async confirmTwoFa(totp: string) {
      const { notificationStore, globalLoadingStore } = rootStore;

      const globalKey = 'confirmTwoFa';

      globalLoadingStore.on(globalKey);

      const confirmTwoFaResult = await api.confirmTwoFa({ totp });

      globalLoadingStore.off(globalKey);

      this.destroyDataForTwoFaActivation();

      if (confirmTwoFaResult instanceof Error) {
        notificationStore.push({ message: 'TwoFa was not confirmed 🚨' });

        return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
      }

      this.setIsTwoFaActivated(true);

      return 'GoToDashboard';
    },

    async verifyTwoFa(totp: string) {
      const { notificationStore, globalLoadingStore, userStore } = rootStore;

      const globalKey = 'verifyTwoFa';

      globalLoadingStore.on(globalKey);

      const verifyTwoFaResult = await api.verifyTwoFa({
        email: this.emailForTwoFaActivation,
        totp,
      });

      globalLoadingStore.off(globalKey);

      if (verifyTwoFaResult instanceof Error) {
        notificationStore.push({ message: 'Totp is not correct 🚨' });

        this.destroy();
        userStore.destroy();

        return new Error(ErrorType.UNEXPECTED_BEHAVIOR);
      }

      this.setAccessToken(verifyTwoFaResult.accessToken);
      await this.runSession();

      return undefined;
    },
  });
};
