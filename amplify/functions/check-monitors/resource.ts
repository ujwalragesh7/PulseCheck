import { defineFunction } from "@aws-amplify/backend";

export const checkMonitors = defineFunction({
  name: "check-monitors",
  entry: "./handler.ts",
});