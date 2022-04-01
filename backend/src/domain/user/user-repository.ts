import type { User } from "./user";

export type Token = {
  accessToken: string;
  refreshToken: string;
};

export interface IUserRepository {
  createUser(
    email: string,
    password: string,
    confirmPassword: string,
    fingerprint: string,
  ): Promise<boolean>;

  activateUser(confirmEmailIdent: string): Promise<boolean>;

  login(email: string, password: string, fingerprint: string): Promise<Token | null>;

  refreshToken(refreshToken: string, fingerprint: string): Promise<Token | null>;

  hasRefreshSession(refreshToken: string): Promise<boolean>;

  logout(userId: number, refreshToken: string): Promise<void>;

  getUserById(userId: number): Promise<User | null>;
}
