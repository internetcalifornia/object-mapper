# Object-Mapper

A declarative way to map objects.

## Install

`npm install @campfhir/mapper`

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

let person = await ObjectMapper.map<Person, Person_Database_Record>(
  personRecord,
  {
    dateOfBirth: {
      map: (person) => new Date(person.date_of_birth),
    },
    // asynchronous mapping
    ageInYears: {
      asyncMap: (person) =>
        new Promise<number>((resolve) => {
          // simulate a network wait from an API
          setTimeout(() => {
            resolve(0);
          }, 300);
        }),
    },
    // synchronous mapping
    firstName: {
      map: (person) => person.first_name,
    },
    lastName: {
      map: (person) => person.last_name,
    },
    // shorthand sync syntax
    firstInitial: (person) => person.first_name[0],
  }
);
```
