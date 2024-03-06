type GetControlId = {
  deviceId: string;
  controlId: string;
};

export const getControlId = ({ deviceId, controlId }: GetControlId) => {
  return `${deviceId}/${controlId}`;
};
