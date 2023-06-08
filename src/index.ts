import type {
  LoggingFunction,
  MappingDefinition,
  MappingDefinitionAsync,
  MappingError,
  MappingErrorTuple,
  Outcome,
} from "../typings";
import { isMappingDefinitionAsync } from "./utils";

function attachOriginatingErrorToError(
  error: Error,
  originalError: unknown
): Error {
  return Object.defineProperty(error, "originatingError", originalError as any);
}

/**
 * Return a cloned version of an object
 *
 * @param a value to clone _Note: if value is not an object the value is returned
 */
function clone<T>(value: T): T {
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return Object.assign([], value);
  }
  return Object.assign({}, value);
}

export abstract class ObjectMapper {
  /**
   * Synchronously map data according to rules/definition
   *
   * @param data to process
   * @param definition rules for how to transform the data
   * @param options.logger a simple logger function
   * @param options.cloneObjectLiterals if true literal objects will be cloned before they are mapped to target object
   * @default options.cloneObjectLiterals false
   * @default options.awaitEach false
   */
  static map<T extends object, P extends MappingDefinition = any>(
    data: P,
    definition: MappingDefinition<T, typeof data>,
    options?: {
      cloneObjectLiterals?: boolean;
      logger?: LoggingFunction;
    }
  ): Outcome<T>;
  /**
   * Asynchronously map data according to rules/definition
   *
   * @param data to process
   * @param definition rules for how to transform the data
   * @param options.awaitEach should each async function await before moving onto the next key `only applies when async methods are defined in definition`
   * @param options.logger a simple logger function
   * @param options.cloneObjectLiterals if true literal objects will be cloned before they are mapped to target object
   * @default options.cloneObjectLiterals false
   * @default options.awaitEach false
   */
  static map<T extends object, P extends MappingDefinitionAsync = any>(
    data: P,
    definition: MappingDefinitionAsync<T, typeof data>,
    options?: {
      cloneObjectLiterals?: boolean;
      awaitEach?: boolean;
      logger?: LoggingFunction;
    }
  ): Promise<Outcome<T>>;

  static map<T extends object, P extends MappingDefinitionAsync>(
    data: P,
    definition: MappingDefinitionAsync<T, typeof data>,
    options?: {
      cloneObjectLiterals?: boolean;
      awaitEach: boolean;
      logger?: LoggingFunction;
    }
  ): Outcome<T> | Promise<Outcome<T>> {
    const cloneObjectLiterals = options?.cloneObjectLiterals ?? false;
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
      const error = err as MappingError;
      error.issues = [];
      return { ok: false, err: error };
    }
    const errors: MappingErrorTuple = [];
    if (!isAsyncDefinition) {
      logger("debug", "Definition is not async");
      for (let [key, value] of Object.entries(definition)) {
        if (typeof value !== "function") {
          logger("debug", "Mapping via literal", { key });
          if (cloneObjectLiterals) mappedObject[key] = clone(value);
          else mappedObject[key] = value;
          logger("debug", "Mapped value", { key, value });
          continue;
        }
        logger("debug", "Mapping via function", { key });
        const fn = value;
        let val: any;
        try {
          val = fn(data, mappedObject, errors);
        } catch (err) {
          errors.push([key, err as Error]);
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
        if (typeof value !== "function") {
          logger("debug", "Mapping via literal");
          if (cloneObjectLiterals) mappedObject[key] = clone(value);
          else mappedObject[key] = value;
          logger("debug", "Mapped value", { key, value });
          continue;
        }
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
            if (err instanceof Error) errors.push([key, err]);
            else {
              const thrownError = new Error(
                `Failed to map synchronous function on ${key}`
              );
              attachOriginatingErrorToError(thrownError, err);
              errors.push([key, thrownError]);
            }
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
                if (err instanceof Error) errors.push([key, err]);
                else {
                  const thrownError = new Error(
                    `Failed to map asynchronous function on ${key}`
                  );
                  attachOriginatingErrorToError(thrownError, err);
                  errors.push([key, thrownError]);
                }
                return reject(err);
              })
          )
        );
        logger("debug", "moving on to next key");
        continue;
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
        return resolve({ ok: false, err: error, partial: mappedObject });
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
