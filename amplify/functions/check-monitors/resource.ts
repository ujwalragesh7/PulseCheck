import { defineFunction } from "@aws-amplify/backend";

export const checkMonitors = defineFunction({
  name: "check-monitors",
  entry: "./handler.ts",
  schedule: "every 1m",
  timeoutSeconds: 60,

  /*
   * This function reads/writes Amplify Data.
   * Keep it in the Data stack to avoid a nested-stack
   * circular dependency.
   */
  resourceGroupName: "data",
});