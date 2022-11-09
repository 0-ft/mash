/**
 * Utility script to generate JSON schemas for express validation from
 * TypeScript types in request-types.ts
 */
import {buildGenerator, getProgramFromFiles} from "typescript-json-schema"

const settings = {
    required: true,
    ref: false,
}

const compilerOptions = {
    strictNullChecks: true,
    esModuleInterop: true
}

const program = getProgramFromFiles(["request-types.ts"], compilerOptions, "./src")

// const schema = generateSchema(program, "DeleteCalendarRequest", settings)
const generator = buildGenerator(program, settings)!;

// if (!fs.existsSync("schemas")) {
//     fs.mkdirSync("schemas", {recursive: true});
// }
//
// fs.writeFileSync(
//     "schemas/request-schemas.ts",
//     `// FILE GENERATED FROM request_types.ts - DO NOT EDIT\n\n` +
//     `export default ${JSON.stringify(schema?.definitions, null, 2)}`
// )