export type CollectionName = string;
export type DocumentId = string;
export type DocumentChange = {
  type: "SET" | "DELETE";
  path: string[];
  value: string | number | boolean | null | undefined;
};
export type UserData = Partial<Record<string | number, any>>;
export type Callback = (interceptor: Interceptor, changes: DocumentChange[]) => void;
export type Interceptor = UserData & {
  isEnable: () => boolean;
  onInit: (cb: Callback) => void;
  onChange: (cb: Callback) => void;
  dispose: () => void;
};
