import { MappingDefinition } from "../typings";
export declare abstract class ObjectMapper {
    static map<T extends object, P = any>(data: P, definition: MappingDefinition<T, typeof data>, options?: {
        strict?: boolean;
    }): Promise<T>;
}
export default ObjectMapper;
