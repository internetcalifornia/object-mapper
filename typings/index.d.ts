type syncMap<P, U> = ((data: U) => P) | P;
type asyncMap<P, U> = (data: U) => Promise<P>;

const i: syncMap<string, boolean> = (s) => s;

export type MappingDefinition<T extends object = any, U = any> = {
  [P in keyof T]:
    | { map: syncMap<T[P], U>; asyncMap?: never }
    | { map?: never; asyncMap: asyncMap<T[P], U> }
    | syncMap<T[P], U>;
};

export type MappingFunc<T, U extends object> = (
  definition: MappingDefinition<T, U>,
  data: U,
  options?: { strict?: boolean }
) => Promise<T>;

export type MappingDefinitionSync<T extends object = any, U = any> = {
  [P in keyof T]: syncMap<T[P], U>;
};

export type MappingFuncSync<T, U extends object> = (
  definition: MappingDefinitionSync<T, U>,
  data: U,
  options?: { strict?: boolean }
) => T;
