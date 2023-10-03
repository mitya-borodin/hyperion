import { User as PrismaUser } from '@prisma/client';

import { User, UserRole, UserStatus } from '../../domain/user';

export const toDomainUser = (prismaUser: PrismaUser): User => {
  let role: UserRole = UserRole.UNKNOWN;

  if (prismaUser.role === UserRole.VIEWER) {
    role = UserRole.VIEWER;
  }

  if (prismaUser.role === UserRole.OPERATOR) {
    role = UserRole.OPERATOR;
  }

  if (prismaUser.role === UserRole.ADMIN) {
    role = UserRole.ADMIN;
  }

  let status: UserStatus = UserStatus.UNKNOWN;

  if (prismaUser.status === UserStatus.ACTIVE) {
    status = UserStatus.ACTIVE;
  }

  if (prismaUser.status === UserStatus.DELETED) {
    status = UserStatus.DELETED;
  }

  return {
    id: prismaUser.id,
    name: prismaUser.name ?? undefined,
    email: prismaUser.email,
    role,
    status,
    hash: prismaUser.hash ?? undefined,
    salt: prismaUser.salt ?? undefined,
    isTwoFaActivated: prismaUser.isTwoFaActivated ?? undefined,
    twoFaSecret: prismaUser.twoFaSecret ?? undefined,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
    deletedAt: prismaUser.deletedAt ?? undefined,
  };
};
