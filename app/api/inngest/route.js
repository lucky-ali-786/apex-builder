// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client.js";
import { codeagent } from "../../../inngest/functions.js";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [codeagent],
});