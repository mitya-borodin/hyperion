import { User, UserRole, UserStatus } from '../../../../domain/user';
import { UserOutput, UserRole as GraphQlUserRole, UserStatus as GraphQlUserStatus } from '../../../../graphql-types';

export const toGraphQlUser = (user: User): Partial<UserOutput> => {
  let role = GraphQlUserRole.VIEWER;

  if (user.role === UserRole.VIEWER) {
    role = GraphQlUserRole.VIEWER;
  }

  if (user.role === UserRole.OPERATOR) {
    role = GraphQlUserRole.OPERATOR;
  }

  if (user.role === UserRole.ADMIN) {
    role = GraphQlUserRole.ADMIN;
  }

  let status = GraphQlUserStatus.ACTIVE;

  if (user.status === UserStatus.ACTIVE) {
    status = GraphQlUserStatus.ACTIVE;
  }

  if (user.status === UserStatus.DELETED) {
    status = GraphQlUserStatus.DELETED;
  }

  return {
    id: user.id,
    role,
    status,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    deletedAt: user.deletedAt?.toISOString(),
  };
};
