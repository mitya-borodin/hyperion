import { User, UserRole } from '../domain/user';
import { FindParameters, FindResult } from '../helpers/find-types';

export type CreateUserParameters = Pick<User, 'name' | 'email' | 'role' | 'hash' | 'salt'>;

export type UserOutput = Omit<User, 'hash' | 'salt'>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IUserRepository {
  get(referenceId: string): Promise<Error | User>;

  find(parameters: FindParameters): Promise<Error | FindResult<User>>;

  create(parameters: CreateUserParameters): Promise<Error | UserOutput>;

  delete(id: string): Promise<Error | UserOutput>;

  setRole(id: string, role: UserRole): Promise<Error | UserOutput>;

  setPassword(id: string, password: string): Promise<Error | UserOutput>;
}
