export type MappingDefinition<T = any, U = any> = {
  [P in keyof T]:
    | { map: (data: U) => T[P]; asyncMap?: never }
    | { map?: never; asyncMap: (data: U) => Promise<T[P]> }
    | ((data: U) => T[P])
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
    | { map: (data: U) => T[P] }
    | ((data: U) => T[P])
    | (T[P] extends string
        ? T[P]
        : T[P] extends number
        ? T[P]
        : T[P] extends boolean
        ? T[P]
        : never);
};
