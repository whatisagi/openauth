import { object, string } from "valibot";
import { createSubjects } from "../../core/src/index.js";

export const subjects = createSubjects({
  user: object({
    email: string(),
  }),
  api: object({
    userID: string(),
    workspaceID: string(),
  }),
});
