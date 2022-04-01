import { v4 } from "uuid";

export function getSalt(): string {
  return `${Math.round(new Date().valueOf() * Math.random())}:${v4()}`;
}
