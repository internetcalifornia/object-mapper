import type { MappingDefinition, MappingDefinitionSync } from "../typings";
import { isMappingDefinitionSync, isMappingDefinition, logger } from "./utils";

const logError = logger.extend("error");

export abstract class ObjectMapper {
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>
  ): Promise<T>;
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: { synchronous: false }
  ): Promise<T>;
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinitionSync<T, typeof data>,
    options?: { synchronous: true }
  ): T;
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinitionSync<T, typeof data>
  ): T;
  static map<T extends object, P = any>(
    data: P,
    definition:
      | MappingDefinition<T, typeof data>
      | MappingDefinitionSync<T, typeof data>,
    options?: { synchronous?: boolean }
  ): T | Promise<T> {
    const synchronous = options?.synchronous;
    if (!isMappingDefinition(definition)) {
      return new Promise((_, reject) => {
        reject("Not a proper definition");
      });
    }
    if (synchronous !== false) {
      // synchronous is explicitly true or undefined
      if (synchronous == true || isMappingDefinitionSync(definition)) {
        const mappedObject: any = {};
        for (let [key, value] of Object.entries(definition)) {
          if (
            typeof value === "string" ||
            typeof value === "boolean" ||
            typeof value === "number"
          ) {
            mappedObject[key] = value;
            continue;
          }
          const fn = value as
            | ((data: P, context?: any) => any)
            | { map: (data: P, context?: any) => any };
          if (typeof fn === "function") {
            mappedObject[key] = fn(data, mappedObject);
            continue;
          }

          mappedObject[key] = fn.map(data, mappedObject);
        }
        return mappedObject;
      }
    }
    return new Promise(async (resolve, reject) => {
      const mappedObject: any = {};

      for (let [key, value] of Object.entries(definition) as [
        key: string,
        value: any
      ]) {
        const fn = value as
          | { map: (data: any, context?: any) => any; asyncMap?: never }
          | {
              map?: never;
              asyncMap: (data: any, context?: any) => Promise<any>;
            }
          | ((data: any, context?: any) => any);

        if (typeof fn === "function") {
          mappedObject[key] = fn(data, mappedObject);
          continue;
        }
        if (
          typeof fn === "string" ||
          typeof fn === "boolean" ||
          typeof fn === "number"
        ) {
          mappedObject[key] = fn;
          continue;
        }

        if (typeof fn.asyncMap === "function") {
          try {
            const res = await fn.asyncMap(data, context);
            mappedObject[key] = res;
            logger("%s => ASYNC %O", key, res);
            continue;
          } catch (err) {
            return reject(err);
          }
        } else if (typeof fn.map === "function") {
          const res = fn.map(data, mappedObject);
          mappedObject[key] = res;
          logger("%s => %O", res);
          continue;
        } else {
          const errMsg = `${key} does not have a defined mapping function. To fix set options.strict = false or define map or asyncMap function for it.`;
          logError(errMsg);
          return reject(errMsg);
        }
      }

      logger("Resolved mapped object");
      return resolve(mappedObject);
    });
  }
}

export type { MappingDefinition, MappingDefinitionSync } from "../typings";
export { isMappingDefinition, isMappingDefinitionSync } from "./utils";
export default ObjectMapper;
