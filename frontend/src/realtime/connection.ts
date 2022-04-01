import ReconnectingWebSocket from "reconnecting-websocket";
import { Connection } from "sharedb/lib/client";

let connection: Connection | null = null;

export const getConnection = () => {
  if (connection instanceof Connection) {
    return connection;
  }

  const socket = new ReconnectingWebSocket(`ws://${location.host}/ws`);

  connection = new Connection(socket as any);

  return connection;
};
