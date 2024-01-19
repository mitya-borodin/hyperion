export type RefreshSession = {
  id: number;
  fingerprint: string;
  userId: string;
  refreshToken: string;
  expiresIn: Date;
  createdAt: Date;
};
