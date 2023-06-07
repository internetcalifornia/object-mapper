import "mocha";
import chai from "chai";
import { isMappingDefinitionAsync } from "../src";
chai.should();

describe("Given an object definition", () => {
  describe("When object does not have async functions as properties", () => {
    const def = {
      a: () => "b",
      c: "d",
    };
    it("Should return false", () => {
      const res = isMappingDefinitionAsync(def);
      res.should.be.false;
    });
  });
  describe("When object has async functions as properties in arrow function syntax", () => {
    const def = {
      a: async () => "b",
      c: "d",
    };
    it("Should return true", () => {
      const res = isMappingDefinitionAsync(def);
      res.should.be.true;
    });
  });
  describe("When object has async functions as properties in anonymous function syntax", () => {
    const def = {
      a: async function () {
        return "b";
      },
      c: "d",
    };
    it("Should return true", () => {
      const res = isMappingDefinitionAsync(def);
      res.should.be.true;
    });
  });
  describe("When object has async functions as properties in named function syntax", () => {
    const def = {
      a: async function getB() {
        return "b";
      },
      c: "d",
    };
    it("Should return true", () => {
      const res = isMappingDefinitionAsync(def);
      res.should.be.true;
    });
  });
  describe("When object has async functions as properties in named arrow function syntax", () => {
    const getB = async () => "B";
    const def = {
      a: getB,
      c: "d",
    };
    it("Should return true", () => {
      const res = isMappingDefinitionAsync(def);
      res.should.be.true;
    });
  });
});
