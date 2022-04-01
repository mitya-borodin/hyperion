export enum InterceptorEvents {
  /**
   * Перед отправкой изменения на сервер должно случиться
   * оптимистичное обновление локального doc.data.
   */
  CHANGE = "INTERCEPTOR_CHANGE",
  NOTIFY_CLIENT = "INTERCEPTOR_NOTIFY_CLIENT",
}

export enum DocumentEvents {
  WAS_INIT = "DOCUMENT_WAS_INIT",
  UPDATE_SNAPSHOT = "DOCUMENT_UPDATE_SNAPSHOT",
  DISPOSE = "DOCUMENT_DISPOSE",
}
