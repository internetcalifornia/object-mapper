"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectMapper = void 0;
const debug_1 = require("debug");
const log = (0, debug_1.debug)("ObjectMapper");
class ObjectMapper {
    static map(data, definition, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const strict = (_a = options === null || options === void 0 ? void 0 : options.strict) !== null && _a !== void 0 ? _a : true;
            const mappedObject = {};
            const asyncKeys = [];
            for (let [key, value] of Object.entries(definition)) {
                if (typeof value.asyncMap === "function") {
                    asyncKeys.push(key);
                    const res = value.asyncMap(data);
                    mappedObject[key] = res;
                    log("%s => ASYNC %O", key, res);
                    continue;
                }
                else if (typeof value.map === "function") {
                    const res = value.map(data);
                    mappedObject[key] = res;
                    log("%s => %O", res);
                    continue;
                }
                else {
                    if (strict) {
                        throw new Error(`${key} does not have a defined mapping function. To fix set options.strict = false or define map or asyncMap function for it.`);
                    }
                    console.warn("Key %s does not have a mapping function", key);
                    continue;
                }
            }
            for (let key of asyncKeys) {
                log("%s is being resolved", key);
                const res = yield Promise.resolve(mappedObject[key]);
                mappedObject[key] = res;
                log("%s => %O", res);
            }
            return mappedObject;
        });
    }
}
exports.ObjectMapper = ObjectMapper;
exports.default = ObjectMapper;
