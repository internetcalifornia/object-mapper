type syncMap<P, U> = (data: U) => P;
type asyncMap<P, U> = (data: U) => Promise<P>;

export type MappingDefinition<T = any, U = any> = {
  [P in keyof T]:
    | { map: syncMap<T[P], U>; asyncMap?: never }
    | { map?: never; asyncMap: asyncMap<T[P], U> };
};

export type MappingFunc<T = any, U = any> = (
  definition: MappingDefinition<T, U>,
  data: U,
  options?: { strict?: boolean }
) => Promise<T>;
