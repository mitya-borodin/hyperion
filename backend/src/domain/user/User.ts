export type User = {
  id: number;
  email: string;
  accountName: string;
  theme: Theme;
};

export enum Theme {
  LIGHT = "LIGHT",
  DARK = "DARK",
}
