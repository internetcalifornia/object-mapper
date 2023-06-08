# Object-Mapper

A declarative way to map objects.

## Install

`npm install @campfhir/object-mapper`

## Use

Given a object mapping definition and data it should return a new object.

## API

The API consist of a single function signature the takes a data object and a definition or schema for how our object should look. This object will return a wrapped Output object consisting of either the new object or a list of errors and a partial object.

### Signature

```typescript
ObjectMapper.map<T extends object, P extends MappingDefinition | MappingDefinitionAsync>(
    data: P,
    definition:
      | MappingDefinition<T, typeof data>
      | MappingDefinitionAsync<T, typeof data>,
    options?: { cloneObjectLiterals?: boolean; awaitEach: boolean; logger?: LoggingFunction }
  ) => Outcome<T> | Promise<Outcome<T>>
```

| Argument                    | Type     | Required | Notes                                                                                                                                                                                            |
| --------------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| data                        | T        | Y        |                                                                                                                                                                                                  |
| definition                  | P        | Y        | a schema of how to transform and shape our desired output                                                                                                                                        |
| options                     | object   |          |                                                                                                                                                                                                  |
| options.awaitEach           | boolean  |          | Determine if each async function should await in before executing the next function _Note: Only applies if definition has async functions defined_                                               |
| options.logger              | function |          | A function that called a points as a logger, has 2 require parameters level and message detailing the log and also can send a 3rd values which is an array of meta values like keys, errors etc. |
| options.cloneObjectLiterals | boolean  |          | If true object literals are cloned before they are assigned as values to the target object _Note: This does not clone objects returned from functions_                                           |

### Mapping Definition

The mapping definition is an object or schema that describes how to transform and data into a target object. Each key in the definition maps a temporary object with the return value of the functions to properties of the same name. Or if value of property is not a function it will be mapped as that object literal.

```typescript
// Example Definition
import { MappingDefinition } from "@campfhir/mapper";

// Maps can consist of key to literal values like numbers, strings, booleans, arrays, object, etc.
// Anything that is not a function is treated as a literal mapping
const literalMap: MappingDefinition = {
  age: 21,
  gender: "male",
  isLoggedIn: false,
  hobbies: ["software"],
  avatar: {
    image: "./image.png",
  },
};

// Maps can also be functions either sync
const syncFunctionMap: MappingDefinition = {
  age: function (data: unknown) {
    if (typeof data.dateOfBirth === "string") {
      return new Date().getYear() - new Date(data.dateOfBirth).getYear();
    }
    // return a default
    return 0;
  },
  gender: function getGender(data: unknown) {
    return "male";
  },
  // arrow function syntax
  isLoggedIn: () => false,
  hobbies: () => ["software"],
  avatar: () => ({ image: "./image.png" }),
};

// Maps can be asynchronous
const asyncFunctionMap: MappingDefinition = {
  age: async function (data: unknown) {
    // simulate awaiting a promise
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    if (typeof data.dateOfBirth === "string") {
      return new Date().getYear() - new Date(data.dateOfBirth).getYear();
    }
    // return a default
    return 0;
  },
  gender: async function getGender(data: unknown) {
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    return "male";
  },
  // arrow function syntax
  isLoggedIn: async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    return false;
  },
  hobbies: async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    return ["software"];
  },
  avatar: async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    return { image: "./image.png" };
  },
};

// And of course you can combine them all together
const asyncFunctionMap: MappingDefinition = {
  age: function (data: unknown) {

    if (typeof data.dateOfBirth === "string") {
      return new Date().getYear() - new Date(data.dateOfBirth).getYear();
    }
    // return a default
    return 0;
  },
  gender: "male",
  // arrow function syntax
  isLoggedIn: () => {
    return false;
  },
  hobbies: async () => {
    await new Promise((resolve) => setTimeout(() => resolve(), 1000));
    return ["software"];
  },
  avatar: { image: "./image.png" };
  },
```

## Mapping Function

When using the mapping function in the object definition the functions has access to a few variables.

```typescript
function (source: P, targetObj: Partial<T>, errors: [key: string, err: Error][]): T[P] | Promise<T[P]> {
  // source is the object used for performing the mapping
  source
  // targetObj is temporary object we are mapping to, each mapping function process in the order in which they are declared
  // This allows you to either further update the target object or have conditional logic based on the object
  // Note: If you are using async function in your definition and do not specify the option.awaitEach = true you may not have resolve they data yet
  targetObj

  // errors is a tuple of keys and errors associated with that key in prior mapping functions
  errors

  return "";
}
```

## Outcome of Map

ObjectMapper.map() return an Outcome or Promise Outcome (if there are async function in the definition). This function will not throw and if it is async it will always resolve (unless something throws in the main loop: e.g. throw inside setTimeout function).
Outcome has a property `ok` that will be `true` if it was able to map and also have a `val` value that will be the target object. If `ok` is `false` that means the mapping was not successful and there will be an `err` property which is an instance of `Error` with an additional `issues` property that contains tuples of keys and errors from each mapping function that threw an Error or rejected a promise. An failed outcome also will return a `partial` property, with properties that it could map to the temporary object.

Review the test scripts for some examples of how you can use outcome at <https://github.com/internetcalifornia/object-mapper.git>.
