export type BoilerProperty = {
  topic: string;
  message: string;
  targetTopic: string;
  fwVersion: number | undefined;
  heatingSetpoint: number | undefined;
  hotWaterSetpoint: number | undefined;
  waterPressure: number | undefined;
  boilerStatus: number | undefined;
  errorCode: number | undefined;
  heatingTemperature: number | undefined;
  hotWaterTemperature: number | undefined;
};

export type DirectionRelayProperty = {
  topic: string;
  message: string;
  pin: number;
  type: "DIR" | "ON";
  value: boolean;
};
