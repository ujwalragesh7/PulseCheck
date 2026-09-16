import { defineBackend } from "@aws-amplify/backend";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { checkMonitors } from "./functions/check-monitors/resource";

export const backend = defineBackend({
  auth,
  data,
  checkMonitors,
});
