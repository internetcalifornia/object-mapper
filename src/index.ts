import { debug } from "debug";
import type { asyncMap, MappingDefinition, syncMap } from "../typings";
export type { MappingDefinition } from "../typings";

const log = debug("ObjectMapper");

export abstract class ObjectMapper {
  static async map<T extends object, P = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: { strict?: boolean }
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
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
            const res = mapObject.asyncMap(data);
            promises.push([key, res]);
            log("%s => ASYNC %O", key, res);
            continue;
          } else if (typeof mapObject.map === "function") {
            const res = mapObject.map(data);
            mappedObject[key] = res;
            log("%s => %O", res);
            continue;
          } else {
            if (strict) {
              throw new Error(
                `${key} does not have a defined mapping function. To fix set options.strict = false or define map or asyncMap function for it.`
              );
            }
            console.warn("Key %s does not have a mapping function", key);
            continue;
          }
        }
        for (let [key, promise] of promises) {
          log("%s is being resolved", key);
          const res = await promise;
          mappedObject[key] = res;
          log("%s => %O", res);
        }
        return resolve(mappedObject);
      } catch (err) {
        return reject(err);
      }
    });
  }
}

export default ObjectMapper;
