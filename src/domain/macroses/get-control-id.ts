type GetControlId = {
  deviceId: string;
  controlId: string;
};

export const constructId = ({ deviceId, controlId }: GetControlId) => {
  return `${deviceId}/${controlId}`;
};
