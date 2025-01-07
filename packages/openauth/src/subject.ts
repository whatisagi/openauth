import type { v1 } from "@standard-schema/spec"
import { Prettify } from "./util.js"

/**
 * Subject schema is a map of types that are used to define the subjects.
 */
export type SubjectSchema = Record<string, v1.StandardSchema>

/** @internal */
export type SubjectPayload<T extends SubjectSchema> = Prettify<
  {
    [type in keyof T & string]: {
      type: type
      properties: v1.InferOutput<T[type]>
    }
  }[keyof T & string]
>

export function createSubjects<Schema extends SubjectSchema = {}>(
  types: Schema,
): Schema {
  return { ...types }
}
