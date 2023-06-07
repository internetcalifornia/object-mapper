import ObjectMapper from "../src";
import "mocha";
import chai from "chai";

chai.should();

describe("Given Example in Readme.md", () => {
  describe("When mapping object data", () => {
    it("Successful async methods", async () => {
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

      let personOutcome = await ObjectMapper.map<
        Person,
        Person_Database_Record
      >(personRecord, {
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
      });
      if (!personOutcome.ok) {
        throw new Error("Failed test");
      }
      const person = personOutcome.val;
      person.lastName.should.equal(personRecord.last_name);
      person.firstInitial.should.equal(personRecord.first_name[0]);
      person.ageInYears.should.be.a("number");
      person.dateOfBirth.should.be.a("date");
    });
    it("Successful async methods - await each", async () => {
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

      let personOutcome = await ObjectMapper.map<
        Person,
        Person_Database_Record
      >(
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
        },
        { awaitEach: true }
      );
      if (!personOutcome.ok) {
        throw new Error("Failed test");
      }
      const person = personOutcome.val;
      person.lastName.should.equal(personRecord.last_name);
      person.firstInitial.should.equal(personRecord.first_name[0]);
      person.ageInYears.should.be.a("number");
      person.dateOfBirth.should.be.a("date");
    });
    it("Successful sync methods", async () => {
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

      let personOutcome = ObjectMapper.map<Person, Person_Database_Record>(
        personRecord,
        {
          dateOfBirth: (person) => new Date(person.date_of_birth),

          ageInYears: 0,
          // synchronous mapping
          firstName: function getName(person) {
            return person.first_name;
          },
          lastName: personRecord.last_name,
          // arrow syntax
          firstInitial: (person) => person.first_name[0],
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
    });
  });
});

describe("Given some errors", () => {
  describe("When trying to map an invalid definition", () => {
    it("Should have an error", () => {
      // @ts-expect-error
      const outcome = ObjectMapper.map({}, null);
      if (outcome.ok) throw new Error("Failed test");
      outcome.ok.should.be.false;
      outcome.err.message.should.be.a("string");
    });
  });
  describe("Synchronous function throws", () => {
    it("Should capture an error and issue", () => {
      const outcome = ObjectMapper.map(
        {},
        {
          a: () => {
            throw new Error("something");
          },
        }
      );
      if (outcome.ok) throw new Error("Failed test");
      outcome.err.message.should.be.a("string");
      outcome.err.issues.length.should.equal(1);
    });
  });
  describe("Asynchronous function throws", () => {
    it("Should capture an error and issue - awaitEach", async () => {
      const outcome = await ObjectMapper.map(
        { a: "" },
        {
          a: async function (a) {
            return new Promise((_, reject) => {
              setTimeout(() => {
                return reject(Error("something"));
              }, 10);
            });
          },
        },
        {
          awaitEach: true,
        }
      );
      if (outcome.ok) throw new Error("Failed test");
      outcome.err.message.should.be.a("string");
      outcome.err.issues.length.should.equal(1);
    });
    it("Should capture an error and issue", async () => {
      const outcome = await ObjectMapper.map<{ a: string }, any>(
        { a: "" },
        {
          a: async function (a) {
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                return resolve();
              }, 10);
            });
            throw new Error("Something");
          },
        }
      );
      if (outcome.ok) throw new Error("Failed test");
      outcome.err.message.should.be.a("string");
      outcome.err.issues.length.should.equal(1);
    });
    it("Should capture an error and issue even when a synchronous function throws", async () => {
      const outcome = await ObjectMapper.map<{ a: string; b: any }, any>(
        { a: "" },
        {
          a: async function (a) {
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                return resolve();
              }, 10);
            });
            return "";
          },
          b: () => {
            throw new Error("Something");
          },
        }
      );
      if (outcome.ok) throw new Error("Failed test");
      outcome.err.message.should.be.a("string");
      outcome.err.issues.length.should.equal(1);
    });
  });
});
