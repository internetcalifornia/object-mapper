# Object-Mapper

A declarative way to map objects.

## Install

`npm install @campfhir/object-mapper`

## Use

Given a object mapping definition and data it should return a new object.

```typescript
import ObjectMapper from "@campfhir/object-mapper";

type Person = {
  firstName: string;
  lastName: string;
  ageInYears: number;
  dateOfBirth: Date;
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
    ageInYears: {
      asyncMap: (person) =>
        new Promise<number>((resolve) => {
          // simulate a network wait from an API
          setTimeout(() => {
            resolve(0);
          }, 300);
        }),
    },
    firstName: {
      map: (person) => person.first_name,
    },
    lastName: {
      map: (person) => person.last_name,
    },
  }
);
```
