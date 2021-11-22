import { debug } from "debug";
import type { MappingDefinition } from "../typings";
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
        const asyncKeys: string[] = [];
        for (let [key, value] of Object.entries(definition) as [
          key: string,
          value: any
        ]) {
          if (typeof value.asyncMap === "function") {
            asyncKeys.push(key);
            const res = value.asyncMap(data);
            mappedObject[key] = res;
            log("%s => ASYNC %O", key, res);
            continue;
          } else if (typeof value.map === "function") {
            const res = value.map(data);
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
        for (let key of asyncKeys) {
          log("%s is being resolved", key);
          const res = await Promise.resolve(mappedObject[key]);
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
