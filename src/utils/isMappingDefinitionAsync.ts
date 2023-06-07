import type { MappingDefinitionAsync } from "../../typings";

/**
 * Test if mapping definition is asynchronous
 *
 * @param obj The object to test
 * @throws Error if obj is not an object or is null
 * @returns true if object has at least one async defined function
 */
export const isMappingDefinitionAsync = (
  obj: unknown
): obj is MappingDefinitionAsync => {
  if (typeof obj !== "object" || obj === null) {
    throw new Error(
      `Definition is expect to be typeof 'object' but got typeof '${typeof obj}'`
    );
  }
  for (let [_, value] of Object.entries(obj) as [string, unknown][]) {
    if (typeof value === "function") {
      if (value.constructor.name === "AsyncFunction") return true;
      continue;
    }
  }
  return false;
};
