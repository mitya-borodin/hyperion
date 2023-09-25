export const isJson = (json: string) => {
  try {
    return JSON.parse(json) && true;
  } catch {
    return false;
  }
};
