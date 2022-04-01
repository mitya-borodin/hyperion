import { encryptPassword } from "./encrypt-password";

export function checkPassword(password: string, salt: string, hashedPassword: string): boolean {
  return encryptPassword(password, salt) === hashedPassword;
}
