import { defineFunction } from "@aws-amplify/backend";

export const checkMonitors = defineFunction({
  name: "check-monitors",
  entry: "./handler.ts",

  /*
   * This function reads/writes Amplify Data.
   * Keep it in the Data stack to avoid a nested-stack
   * circular dependency.
   */
  resourceGroupName: "data",
});