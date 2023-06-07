# Object-Mapper

A declarative way to map objects.

## Install

`npm install @campfhir/object-mapper`

## Use

Given a object mapping definition and data it should return a new object.

```typescript
import ObjectMapper from "@campfhir/mapper";

type Person = {
  firstName: string;
  lastName: string;
  ageInYears: number;
  dateOfBirth: Date;
  firstInitial: string;
};
type Person_Database_Record = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
};

const personRecord: Person_Database_Record = {
  first_name: "John",
  last_name: "Doe",
  date_of_birth: "2021-01-01",
};

let personOutcome = await ObjectMapper.map<Person, Person_Database_Record>(
  personRecord,
  {
    // synchronous named function
    dateOfBirth: function dateOfBirth(person) {
      return new Date(person.date_of_birth);
    },

    // async arrow function
    ageInYears: async (_person, partialPerson) => {
      // since dateOfBirth is defined already and is synchronous we should be able to assert the partialPerson date of birth
      partialPerson.dateOfBirth!.should.be.a("Date");
      let n = await new Promise<number>((resolve) => {
        // simulate a network wait from an API
        setTimeout(() => {
          resolve(0);
        }, 30);
      });
      return n;
    },
    // anonymous async function
    firstName: async function getName(person) {
      return person.first_name;
    },
    // synchronous function
    lastName: (person) => person.last_name,
    // literal value
    firstInitial: personRecord.first_name[0],
  }
);
if (!personOutcome.ok) {
  throw new Error("Failed test");
}
const person = personOutcome.val;
person.lastName.should.equal(personRecord.last_name);
person.firstInitial.should.equal(personRecord.first_name[0]);
person.ageInYears.should.be.a("number");
person.dateOfBirth.should.be.a("date");
```

## Process

Each key is processed in the order in which they are declared. This allows the possibility to leverage prior mapping outcomes through the context (which is a partial mapping of the object) and/or error tuples.

### Mapping Function API

```typescript
function (data: T, context: Partial<U>, errors: ErrorMappingTuple) {
  // data is the entire data object you are trying to map with, you probably shouldn't update this object in the function but you can

  // context is partial object you are trying to create as previous functions build this object you can observe those keys
  // if you do not specify option.awaitEach and the previous calls are async there is no guarantee data will exists even though this function is defined later.
  // errors is a list of running errors again some errors might not exists if your function calls are async and the options.awaitEach is false
}

```
