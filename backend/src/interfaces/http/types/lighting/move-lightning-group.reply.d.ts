/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface MoveLightningGroupReplySchema {
  location: string;
  state: "ON" | "OFF";
  /**
   * Devices is device ids
   */
  devices: string[];
  createdAt: string;
  updatedAt: string;
}
