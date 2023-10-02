export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export const UNKNOWN_USER_ID = -1000;

export type JwtPayload = {
  id: number;
  role: UserRole;
};

export type User = {
  id: number;

  role: UserRole;
  status: UserStatus;

  name: string;
  email: string;

  salt?: string;
  hash?: string;

  createdAt: Date;
  updatedAt: Date;
};
