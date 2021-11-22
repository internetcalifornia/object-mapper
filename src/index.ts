import { debug } from "debug";
import type { asyncMap, MappingDefinition, syncMap } from "../typings";
export type { MappingDefinition } from "../typings";

const log = debug("ObjectMapper");
const errLog = log.extend("error");
const warnLog = log.extend("warn");

export abstract class ObjectMapper {
  static async map<T extends object, P = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: { strict?: boolean }
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const strict = options?.strict ?? true;
      const mappedObject: any = {};
      const promises: [key: string, promise: Promise<any>][] = [];
      for (let [key, value] of Object.entries(definition) as [
        key: string,
        value: any
      ]) {
        const mapObject = value as
          | { map: syncMap<any, typeof data>; asyncMap?: never }
          | { map?: never; asyncMap: asyncMap<any, typeof data> };
        if (typeof mapObject.asyncMap === "function") {
          try {
            const res = await mapObject.asyncMap(data);
            mappedObject[key] = res;
            log("%s => ASYNC %O", key, res);
            continue;
          } catch (err) {
            let error: Error;
            if (typeof err === "string") {
              error = new Error(err);
            } else if (err instanceof Error) {
              error = err;
            } else {
              error = new Error("Unknown Error");
            }
            reject(error);
          }
        } else if (typeof mapObject.map === "function") {
          const res = mapObject.map(data);
          mappedObject[key] = res;
          log("%s => %O", res);
          continue;
        } else {
          if (strict) {
            const errMsg = `${key} does not have a defined mapping function. To fix set options.strict = false or define map or asyncMap function for it.`;
            const err = new Error(errMsg);
            errLog(errMsg);
            reject(errMsg);
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
