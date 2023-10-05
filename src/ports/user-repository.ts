import { User } from '../domain/user';
import { FindParameters, FindResult } from '../helpers/find-types';

export type CreateUserParameters = Required<Pick<User, 'name' | 'email' | 'role' | 'hash' | 'salt'>>;

export type UpdateUserParameters = { id: string } & Partial<
  Pick<User, 'name' | 'email' | 'role' | 'status' | 'hash' | 'salt'> & {
    isTwoFaActivated: boolean;
    twoFaSecret: string;
  }
>;

export type UserOutput = Omit<User, 'hash' | 'salt'>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IUserRepository {
  get(id: string): Promise<Error | User>;

  getByEmail(email: string): Promise<Error | User | null>;

  find(parameters: FindParameters): Promise<Error | FindResult<User>>;

  create(parameters: CreateUserParameters): Promise<Error | UserOutput>;

  update(parameters: UpdateUserParameters): Promise<Error | UserOutput>;

  delete(id: string): Promise<Error | UserOutput>;
}
