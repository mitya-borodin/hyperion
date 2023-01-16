export enum UserRole {
  UNKNOWN = 'UNKNOWN',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
}

export const UNKNOWN_USER_ID = -1000;

export type JwtPayload = {
  id: number;
  role: UserRole;
};

export type User = {
  id: number;
  email: string;
  userRole: UserRole;
  hash?: string;
  salt?: string;
  createdAt: Date;
  updatedAt: Date;
};
