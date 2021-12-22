export type MappingDefinition<T extends object = any, U = any> = {
  [P in keyof T]:
    | { map: (data: U) => P; asyncMap?: never }
    | { map?: never; asyncMap: (data: U) => Promise<T[P]> }
    | ((data: U) => T[P]);
};

export type MappingDefinitionSync<T extends object = any, U = any> = {
  [P in keyof T]: { map: (data: U) => T[P] } | ((data: U) => T[P]);
};
