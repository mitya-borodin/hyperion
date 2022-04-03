import { Illumination } from "./illumination";

export interface IIlluminationRepository {
  /**
   * ID is unique name of illumination.
   */
  add(id: string): Promise<Illumination>;

  /**
   * ID is unique name of illumination.
   */
  getIllumination(id: string): Promise<Illumination>;

  /**
   * ID is unique name of illumination.
   */
  on(id: string): Promise<Illumination>;

  /**
   * ID is unique name of illumination.
   */
  off(id: string): Promise<Illumination>;
}
