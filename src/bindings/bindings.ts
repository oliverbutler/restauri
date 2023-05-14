type ReplaceBigIntWithNumber<T> = {
  [K in keyof T]: T[K] extends bigint ? number : T[K];
};

export type Request = ReplaceBigIntWithNumber<
  import('../../src-tauri/bindings/Request').Request
>;
export type RequestHistory = ReplaceBigIntWithNumber<
  import('../../src-tauri/bindings/RequestHistory').RequestHistory
>;
