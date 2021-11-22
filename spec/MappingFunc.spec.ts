import "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { MappingDefinition } from "../typings";
import { ObjectMapper } from "../src";
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
      const output = await ObjectMapper(def, data);
      JSON.stringify(output).should.equal(JSON.stringify(expected));
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
          }, 300);
        });
      },
    },
    isOk: {
      map: (data) => "2",
    },
  };

  describe("When mapping function called", () => {
    it("Should return an object matching the expected type", (done) => {
      const data = {};
      ObjectMapper(def, data)
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
      ObjectMapper(def, data)
        .should.eventually.be.rejectedWith(
          Error,
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
      let res = await ObjectMapper(def, data, { strict: false });

      JSON.stringify(res).should.equal(
        JSON.stringify({
          help: true,
          isOk: "2",
        })
      );
    }).slow(9000);
  });
});
