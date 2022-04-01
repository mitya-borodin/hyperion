export type User = {
  id: string;
  email: string;
  accountName: string;
  theme: Theme;
};

export enum Theme {
  LIGHT = "LIGHT",
  DARK = "DARK",
}
