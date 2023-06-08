export type MappingDefinition<T = any, U = any> = {
  [P in keyof T]:
    | ((data: U, context: Partial<T>, errors: MappingErrorTuple) => T[P])
    | T[P];
};

export type MappingDefinitionAsync<T = any, U = any> = {
  [P in keyof T]:
    | MappingDefinition<T, U>[P]
    | ((
        data: U,
        context: Partial<T>,
        errors: MappingErrorTuple
      ) => Promise<T[P]>);
};

export type MappingErrorTuple = [key: string, error: Error][];

export type MappingError = Error & {
  issues: MappingErrorTuple;
};

export type Outcome<T = any> =
  | { ok: false; err: MappingError; partial?: Partial<T> }
  | { ok: true; val: T };

export type LoggingFunction = (
  level: "error" | "debug" | "info",
  message: string,
  ...args: any[]
) => void | Promise<void>;
