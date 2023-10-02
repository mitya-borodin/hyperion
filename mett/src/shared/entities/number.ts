export const formatAmount = (amount: number | bigint, options?: { maximumFractionDigits: number }) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });

  return formatter.format(amount);
};
