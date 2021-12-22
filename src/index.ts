import type { MappingDefinition, MappingDefinitionSync } from "../typings";
import { isMappingDefinitionSync, isMappingDefinition, logger } from "./utils";

const logError = logger.extend("error");
const warn = logger.extend("warn");

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
    const synchronous = options?.synchronous ?? false;
    if (synchronous || isMappingDefinitionSync(definition)) {
      const mappedObject: any = {};
      for (let [key, value] of Object.entries(definition)) {
        const fn = value as (data: P) => any;
        mappedObject[key] = fn(data);
      }
      return mappedObject;
    }
    return new Promise(async (resolve, reject) => {
      if (!isMappingDefinition(definition)) {
        reject("Not a proper definition");
        return;
      }

      const mappedObject: any = {};
      for (let [key, value] of Object.entries(definition) as [
        key: string,
        value: any
      ]) {
        const fn = value as
          | { map: (data: any) => any; asyncMap?: never }
          | { map?: never; asyncMap: (data: any) => Promise<any> }
          | ((data: any) => any);

        if (typeof fn === "function") {
          mappedObject[key] = fn(data);
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
            const res = await fn.asyncMap(data);
            mappedObject[key] = res;
            logger("%s => ASYNC %O", key, res);
            continue;
          } catch (err) {
            return reject(err);
          }
        } else if (typeof fn.map === "function") {
          const res = fn.map(data);
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
