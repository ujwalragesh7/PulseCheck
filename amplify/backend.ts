import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { checkMonitors } from "./functions/check-monitors/resource";

defineBackend({
  auth,
  data,
  checkMonitors,
});