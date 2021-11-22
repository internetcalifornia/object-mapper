type syncMap<P, U> = (data: U) => P;
type asyncMap<P, U> = (data: U) => Promise<P>;

export type MappingDefinition<T extends object = any, U> = {
  [P in keyof T]:
    | { map: syncMap<T[P], U>; asyncMap?: never }
    | { map?: never; asyncMap: asyncMap<T[P], U> };
};

export type MappingFunc<T, U extends object> = (
  definition: MappingDefinition<T, U>,
  data: U,
  options?: { strict?: boolean }
) => Promise<T>;
