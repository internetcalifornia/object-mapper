import type {
  LoggingFunction,
  MappingDefinition,
  MappingDefinitionAsync,
  MappingError,
  Outcome,
} from "../typings";
import { isMappingDefinitionAsync } from "./utils";

export abstract class ObjectMapper {
  /**
   * Synchronously map data according to rules/definition
   *
   * @param data to process
   * @param definition rules for how to transform the data
   * @param options.logger a simple logger function
   * @default options.awaitEach false
   */
  static map<T extends object, P extends MappingDefinition>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: { logger?: LoggingFunction }
  ): Outcome<T>;
  /**
   * Asynchronously map data according to rules/definition
   *
   * @param data to process
   * @param definition rules for how to transform the data
   * @param options.awaitEach should each async function await before moving onto the next key `only applies when async methods are defined in definition`
   * @param options.logger a simple logger function
   * @default options.awaitEach false
   */
  static map<T extends object, P extends MappingDefinitionAsync>(
    data: P,
    definition: MappingDefinitionAsync<T, typeof data>,
    options?: { awaitEach?: boolean; logger?: LoggingFunction }
  ): Promise<Outcome<T>>;

  static map<
    T extends object,
    P extends MappingDefinition | MappingDefinitionAsync
  >(
    data: P,
    definition:
      | MappingDefinition<T, typeof data>
      | MappingDefinitionAsync<T, typeof data>,
    options?: { awaitEach: boolean; logger?: LoggingFunction }
  ): Outcome<T> | Promise<Outcome<T>> {
    const logger = options?.logger ?? (() => {});
    const mappedObject: any = {};
    let isAsyncDefinition: boolean;
    try {
      logger("debug", "Determine if definition is async");
      isAsyncDefinition = isMappingDefinitionAsync(definition);
    } catch (err) {
      logger("error", "Definition is not an object", {
        err,
      });
      const error = err as Error & {
        issues: [key: string, error: unknown][];
      };
      error.issues = [];
      return { ok: false, err: error };
    }
    const errors: [key: string, err: unknown][] = [];
    if (!isAsyncDefinition) {
      logger("debug", "Definition is not async");
      for (let [key, value] of Object.entries(definition)) {
        if (typeof value !== "function") {
          logger("debug", "Mapping via literal", { key });
          mappedObject[key] = value;
          logger("debug", "Mapped value", { key, value });
          continue;
        }
        logger("debug", "Mapping via function", { key });
        const fn = value;
        let val: any;
        try {
          val = fn(data, mappedObject, errors);
        } catch (err) {
          errors.push([key, err]);
          continue;
        }
        logger("debug", "Mapped value", { key, value: val });
        mappedObject[key] = val;
        continue;
      }
      if (errors.length >= 1) {
        const error = new Error("Failed to map results") as MappingError;
        error.issues = errors;
        logger("error", "Mapping was not successful", {
          errorCount: errors.length,
          issues: error.issues,
        });
        return { ok: false, err: error, partial: mappedObject };
      }
      logger("info", "successfully mapped");
      return { ok: true, val: mappedObject };
    }
    const awaitEach = options?.awaitEach ?? false;
    awaitEach
      ? logger("debug", "Awaiting each async function call")
      : logger("debug", "Will resolve as Promise.allSettled");
    const promised: Promise<unknown>[] = [];

    return new Promise(async (resolve) => {
      for (let [key, value] of Object.entries(definition)) {
        if (typeof value === "function") {
          logger("debug", "Mapping via function call", { key });
          const fn = value;
          if (awaitEach) {
            try {
              logger("debug", "Awaiting function call", { key });
              const val = await fn(data, mappedObject, errors);
              mappedObject[key] = val;
              logger("debug", "Mapped value", { key, value: val });
            } catch (err) {
              logger("error", "Failed to map value due to error", { key, err });
              errors.push([key, err as Error]);
            }
            continue;
          }
          if (fn.constructor.name !== "AsyncFunction") {
            logger("debug", "Synchronous function call mapping");
            let val: any;
            try {
              val = fn(data, mappedObject, errors);
            } catch (err) {
              errors.push([key, err]);
              continue;
            }
            mappedObject[key] = val;
            continue;
          }
          logger("debug", "Pushing promise into stack", { key });
          const asyncFn = value as (...args: unknown[]) => Promise<any>;
          promised.push(
            new Promise<void>((resolve, reject) =>
              asyncFn(data, mappedObject, errors)
                .then((result: unknown) => {
                  mappedObject[key] = result;
                  return resolve();
                })
                .catch((err: unknown) => {
                  console.error(`Caught an error on ${key}`);
                  errors.push([key, err]);
                  return reject(err);
                })
            )
          );
          logger("debug", "moving on to next key");
          continue;
        }
        logger("debug", "Mapping via literal");
        const val = value;
        mappedObject[key] = val;
        logger("debug", "Mapped value", { key, value: val });
      }
      if (!awaitEach) {
        logger("debug", "Resolved pushed promises");
        await Promise.allSettled(promised);
      }

      if (errors.length >= 1) {
        const error = new Error("Failed to map results") as MappingError;
        error.issues = errors;
        logger("error", "Mapping was not successful", {
          errorCount: errors.length,
          issues: error.issues,
        });
        return resolve({ ok: false, err: error });
      }
      logger("info", "successfully mapped");
      return resolve({ ok: true, val: mappedObject });
    });
  }
}

export type {
  MappingDefinition,
  MappingDefinitionAsync,
  MappingError,
} from "../typings";
export { isMappingDefinitionAsync } from "./utils";
export default ObjectMapper;
