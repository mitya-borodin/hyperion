import { addMinutes } from 'date-fns';

export const createOtp = () => {
  const otp = `${Math.floor(100_000 + Math.random() * 900_000)}`;
  const expiresIn = addMinutes(new Date(), 2);

  return { otp, expiresIn };
};
