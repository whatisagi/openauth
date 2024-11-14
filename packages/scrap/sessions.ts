import { object, string } from "valibot";
import { defineSessions } from "../core/src";

export const sessions = defineSessions({
  user: object({
    userID: string(),
    workspaceID: string(),
  }),
  api: object({
    userID: string(),
    workspaceID: string(),
  }),
});
