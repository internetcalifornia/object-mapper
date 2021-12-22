import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { MappingDefinition, MappingDefinitionSync } from "../typings";
import { isMappingDefinition, isMappingDefinitionSync } from "../src";
chai.use(chaiAsPromised);
chai.should();

describe("Given an object", () => {
  describe("When object conforms to MappingDefinition", () => {
    const def: MappingDefinition = {
      d: {
        asyncMap: () => new Promise((resolve) => resolve(true)),
      },
      c: {
        map: () => 4,
      },
    };
    it("Should return true", () => {
      const res = isMappingDefinition(def);
      res.should.be.true;
    });
  });
});

describe("Given an object", () => {
  describe("When object does NOT conforms to MappingDefinition", () => {
    const def = {
      d: {
        asyncMap: () => new Promise((resolve) => resolve(true)),
      },
      c: {
        RANDOM: true,
      },
    };
    it("Should return false", () => {
      const res = isMappingDefinition(def);
      res.should.be.false;
    });
  });
});

describe("Given an object", () => {
  describe("When object conforms to MappingDefinitionSync", () => {
    const def: MappingDefinitionSync = {
      d: () => 4,
      c: () => true,
    };
    it("Should return true", () => {
      const res = isMappingDefinitionSync(def);
      res.should.be.true;
    });
  });
});

describe("Given an object", () => {
  describe("When object does NOT conforms to MappingDefinitionSync", () => {
    const def = {
      d: () => "f",
      d2: {
        something: true,
      },
    };
    it("Should return false", () => {
      const res = isMappingDefinitionSync(def);
      res.should.be.false;
    });
  });
});

describe("Given an object", () => {
  describe("When object does NOT conforms to MappingDefinitionSync", () => {
    const def = {
      d2: {},
      d: () => "f",
    };
    it("Should return false", () => {
      const res = isMappingDefinition(def);
      res.should.be.false;
    });
  });
});

describe("Given a non-object value", () => {
  describe("When testing for MappingDefinition", () => {
    it("Should return false", () => {
      const res = isMappingDefinition(4);
      res.should.be.false;
    });
  });
});

describe("Given a non-object value", () => {
  describe("When testing for MappingDefinitionSync", () => {
    it("Should return false", () => {
      const res = isMappingDefinitionSync(4);
      res.should.be.false;
    });
  });
});
