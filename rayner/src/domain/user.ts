export enum UserRole {
  UNKNOWN = 'UNKNOWN',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  UNKNOWN = 'UNKNOWN',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export const UNKNOWN_USER_ID = 'UNKNOWN';

export type JwtPayload = {
  userId: string;
  role: UserRole;
  onlyForActivateTwoFa: boolean;
};

export type User = {
  id: string;

  role: UserRole;
  status: UserStatus;

  name: string;
  email: string;

  salt?: string;
  hash?: string;

  isTwoFaActivated?: boolean;
  twoFaSecret?: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};
