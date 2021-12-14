import { MappingDefinitionSync, MappingDefinition } from "../../typings";

export const isMappingDefinitionSync = (
  obj: any
): obj is MappingDefinitionSync => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  for (let [_, value] of Object.entries(obj)) {
    if (typeof value !== "function") {
      return false;
    }
  }
  return true;
};

export const isMappingDefinition = (obj: any): obj is MappingDefinition => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  for (let [_, value] of Object.entries(obj)) {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    if (!("asyncMap" in value) && !("map" in value)) {
      return false;
    }
  }
  return true;
};
