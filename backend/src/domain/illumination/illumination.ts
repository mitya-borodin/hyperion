export type Illumination = {
  /**
   * illuminationID is unique name of illumination.
   */
  readonly id: string;
  readonly location: string;
  readonly state: "on" | "off";
  readonly totalDuration: string;
  readonly needToReplaceLamp: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};
