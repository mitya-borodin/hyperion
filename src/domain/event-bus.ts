export enum EventBus {
  HARDWARE_DEVICE_APPEARED = 'HARDWARE_DEVICE_APPEARED',

  WB_PUBLISH_MESSAGE = 'WB_PUBLISH_MESSAGE',

  /**
   * ! В этом канале публикуются HyperionDevice, который содержит
   * ! единственный изменившейся контрол.
   *
   * ! В процессе появления контролов, данные наслаиваются в БД, и образуют
   * ! список контролов для каждого HyperionDevice.
   *
   * ! Благодаря тому, что отправляется всегда 1 контрол, мы можем понять, что именно он
   * ! является последним состоянием устройства.
   */
  HYPERION_DEVICE_APPEARED = 'HYPERION_DEVICE_APPEARED',

  GQL_PUBLISH_SUBSCRIPTION_EVENT = 'GQL_PUBLISH_SUBSCRIPTION_EVENT',

  ZIGBEE_2_MQTT_SEND_MESSAGE = 'ZIGBEE_2_MQTT_SEND_MESSAGE',
}
