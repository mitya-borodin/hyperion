export type IlluminationHistory = {
  readonly id: string;
  /**
   * illuminationID is unique name of illumination.
   */
  readonly illuminationID: string;
  readonly turnedOnAt: string;
  readonly turnedOffAt: string;
  readonly duration: string;
};
