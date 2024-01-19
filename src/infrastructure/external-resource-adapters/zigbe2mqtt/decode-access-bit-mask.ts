/**
 * ! https://www.zigbee2mqtt.io/guide/usage/exposes.html#access
 */
export const decodeAccessBitMask = (access?: number) => {
  if (!access) {
    access = 1;
  }

  const bitmask = [...Number(access).toString(2)];

  while (bitmask.length < 3) {
    bitmask.unshift('0');
  }

  return {
    // Bit 1: The property can be found in the published state of this device
    canBeFoundInPublishedState: bitmask[2] === '1',
    // Bit 2: The property can be set with a /set command
    canBeSet: bitmask[1] === '1',
    // Bit 3: The property can be retrieved with a /get command (when this bit is true, bit 1 will also be true)
    canBeGet: bitmask[0] === '1',
  };
};
