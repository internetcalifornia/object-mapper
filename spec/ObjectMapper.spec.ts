import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { MappingDefinition } from "../typings";
import ObjectMapper from "../src";
chai.use(chaiAsPromised);
chai.should();

describe("Given an object and a mapping definition", () => {
  const def: MappingDefinition<{ help: boolean; isOk: "1" | "2" }, {}> = {
    help: {
      asyncMap: (data) => {
        return new Promise((resolve, _) => {
          setTimeout(() => {
            resolve(true);
          }, 300);
        });
      },
    },
    isOk: {
      map: (data) => "2",
    },
  };

  describe("When mapping function called", () => {
    it("Should return an object matching the expected type", async () => {
      const expected = {
        help: true,
        isOk: "2",
      };
      const data = {};
      const output = await ObjectMapper.map(data, def);
      output.help.should.be.true;
      output.isOk.should.equal("2");
    }).slow(9000);
  });
});

describe("Given an object and a mapping definition where promise is rejected", () => {
  const def: MappingDefinition<{ help: boolean; isOk: "1" | "2" }, {}> = {
    help: {
      asyncMap: (data) => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Bad request"));
          }, 1700);
        });
      },
    },
    isOk: {
      asyncMap: (data) => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Bad request"));
          }, 1000);
        });
      },
    },
  };

  describe("When mapping function called", () => {
    it("Should return an object matching the expected type", (done) => {
      const data = {};
      ObjectMapper.map(data, def)
        .should.eventually.be.rejectedWith(Error, "Bad request")
        .notify(done);
    }).slow(9000);
  });
});

describe("Given an object and a mapping definition where key is not defined correctly", () => {
  const def: MappingDefinition<{ help: boolean; isOk: "1" | "2" }, {}> = {
    help: {
      map: (_) => true,
    },
    isOk: {
      map: (_) => "2",
    },
    // @ts-expect-error
    badIdea: {},
  };

  describe("When mapping function called", () => {
    it("Should throw an error", (done) => {
      const data = {};
      ObjectMapper.map(data, def)
        .should.eventually.be.rejectedWith(
          "badIdea does not have a defined mapping function. To fix set options.strict = false or define map or asyncMap function for it."
        )
        .notify(done);
    }).slow(9000);
  });
});

describe("Given an object and a mapping definition where key is not defined correctly", () => {
  const def: MappingDefinition<{ help: boolean; isOk: "1" | "2" }, {}> = {
    help: {
      map: (_) => true,
    },
    isOk: {
      map: (_) => "2",
    },
    // @ts-expect-error
    badIdea: {},
  };

  describe("When mapping function called", () => {
    it("Should throw an error", async () => {
      const data = {};
      let res = await ObjectMapper.map(data, def, { strict: false });

      res.help.should.be.true;
      res.isOk.should.equal("2");
    }).slow(9000);
  });
});

describe("Given a object definition and data", () => {
  describe("When called", () => {
    it("Should return a mapped object", async () => {
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
      person.ageInYears.should.equal(0);
      person.ageInYears.should.be.a("number");
      person.firstName.should.equal("John");
      person.lastName.should.equal("Doe");
      person.dateOfBirth.should.be.a("Date");
    });
  });
});

describe("Given a object definition THAT fails and data", () => {
  describe("When called", () => {
    it("Should catch error", async () => {
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
      try {
        let person = await ObjectMapper.map<Person, Person_Database_Record>(
          personRecord,
          {
            dateOfBirth: {
              map: (person) => new Date(person.date_of_birth),
            },
            ageInYears: {
              asyncMap: (person) => {
                throw new Error("Fail");
              },
            },
            firstName: {
              asyncMap: async (person) => {
                throw new Error("Fail 2");
              },
            },
            lastName: {
              map: (person) => person.last_name,
            },
          }
        );
      } catch (error) {
        let err = error as Error;
        if (err.message === "Fail") return;
        throw err;
      }
    });
  });
});
