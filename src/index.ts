import { debug } from "debug";
import type {
  asyncMap,
  MappingDefinition,
  MappingDefinitionSync,
  syncMap,
} from "../typings";
import { isMappingDefinitionSync } from "./utils/isTypes";
export type { MappingDefinition } from "../typings";
export { isMappingDefinition, isMappingDefinitionSync } from "./utils/isTypes";
const log = debug("ObjectMapper");
const errLog = log.extend("error");
const warnLog = log.extend("warn");

export abstract class ObjectMapper {
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: { strict?: boolean }
  ): Promise<T>;
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: { strict?: boolean; synchronous: false }
  ): Promise<T>;
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinitionSync<T, typeof data>,
    options?: { strict?: boolean; synchronous: true }
  ): T;
  static map<T extends object, P = any>(
    data: P,
    definition: MappingDefinitionSync<T, typeof data>,
    options?: { strict?: boolean }
  ): T;
  static map<T extends object, P = any>(
    data: P,
    definition:
      | MappingDefinition<T, typeof data>
      | MappingDefinitionSync<T, typeof data>,
    options?: { strict?: boolean; synchronous?: boolean }
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
      const strict = options?.strict ?? true;
      const mappedObject: any = {};
      for (let [key, value] of Object.entries(definition) as [
        key: string,
        value: any
      ]) {
        const fn = value as
          | { map: syncMap<any, typeof data>; asyncMap?: never }
          | { map?: never; asyncMap: asyncMap<any, typeof data> }
          | syncMap<any, typeof data>;
        if (typeof fn === "function") {
          mappedObject[key] = fn(data);
          continue;
        }
        if (typeof fn.asyncMap === "function") {
          try {
            const res = await fn.asyncMap(data);
            mappedObject[key] = res;
            log("%s => ASYNC %O", key, res);
            continue;
          } catch (err) {
            return reject(err);
          }
        } else if (typeof fn.map === "function") {
          const res = fn.map(data);
          mappedObject[key] = res;
          log("%s => %O", res);
          continue;
        } else {
          if (strict) {
            const errMsg = `${key} does not have a defined mapping function. To fix set options.strict = false or define map or asyncMap function for it.`;
            errLog(errMsg);
            return reject(errMsg);
          }
          warnLog("Key %s does not have a mapping function", key);
          continue;
        }
      }

      log("Resolved mapped object");
      return resolve(mappedObject);
    });
  }
}

export default ObjectMapper;
