import { defineFunction } from "@aws-amplify/backend";

export const adminControl = defineFunction({
  name: "admin-control",
  entry: "./handler.ts",

  /*
   * admin-control is used as a Data resolver and also
   * accesses Amplify Data.
   *
   * Putting it in the Data stack prevents the
   * Data <-> Function circular dependency.
   */
  resourceGroupName: "data",

  /*
   * These names are declared here so Amplify generates
   * the $amplify/env/admin-control typing.
   *
   * backend.ts replaces the values with the real
   * Cognito User Pool ID and Scheduler name.
   */
  environment: {
    USER_POOL_ID: "",
    SCHEDULE_NAME: "",
  },
});