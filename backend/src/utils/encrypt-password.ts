import crypto from "crypto";

export function encryptPassword(password: string, salt: string): string {
  try {
    return crypto.createHmac("sha256", salt).update(password).digest("hex");
  } catch (error) {
    console.error(error);

    return "";
  }
}
