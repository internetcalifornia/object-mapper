export type MappingDefinition<T = any, U = any> = {
  [P in keyof T]:
    | { map: (data: U, context: Partial<T>) => T[P]; asyncMap?: never }
    | {
        map?: never;
        asyncMap: (data: U, context: Partial<T>) => Promise<T[P]>;
      }
    | ((data: U, context: Partial<T>) => T[P])
    | (T[P] extends string
        ? T[P]
        : T[P] extends number
        ? T[P]
        : T[P] extends boolean
        ? T[P]
        : never);
};

export type MappingDefinitionSync<T = any, U = any> = {
  [P in keyof T]:
    | { map: (data: U, context?: Partial<T>) => T[P] }
    | ((data: U, context?: Partial<T>) => T[P])
    | (T[P] extends string
        ? T[P]
        : T[P] extends number
        ? T[P]
        : T[P] extends boolean
        ? T[P]
        : never);
};
