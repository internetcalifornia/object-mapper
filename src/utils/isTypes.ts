import { MappingDefinitionSync, MappingDefinition } from "../../typings";

import { logger as log } from "./logger";
const logger = log.extend("checkDefinition");

export const isMappingDefinitionSync = (
  obj: any
): obj is MappingDefinitionSync => {
  if (typeof obj !== "object" || obj === null) {
    logger("Input is not an object with keys to iterate over");
    return false;
  }
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === "function") {
      logger("%s => function type", key);
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      typeof value === "number"
    ) {
      logger("%s => constant '%s'", key, typeof value);
      continue;
    }
    if (typeof obj === "object" && "map" in obj) {
      logger("%s => explicit map function", key);
      continue;
    }
    logger(
      "%s => improperly defined definition, should be an value with $.map(), a string, boolean, or number, or a function but got %O",
      key,
      obj
    );
    return false;
  }
  logger("Proper synchronous mapping definition");
  return true;
};

export const isMappingDefinition = (obj: any): obj is MappingDefinition => {
  if (typeof obj !== "object" || obj === null) {
    logger("Input is not an object with keys to iterate over");
    return false;
  }
  for (let [key, value] of Object.entries(obj)) {
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      typeof value === "number"
    ) {
      logger("%s => constant '%s'", key, typeof value);
      continue;
    }
    if (typeof value === "function") {
      logger("%s => function type", key);
      continue;
    }
    if (
      value !== null &&
      typeof value === "object" &&
      ("asyncMap" in value || "map" in value)
    ) {
      const s = value as any;
      logger(
        "%s => explicit %s function",
        key,
        s.asyncMap?.name ?? s.map?.name
      );
      continue;
    }
    logger(
      "%s => improperly defined definition, should be an value with $.map() or $.asyncMap(), a string, boolean, or number, or a function but got %O",
      key,
      obj
    );
    return false;
  }
  return true;
};
