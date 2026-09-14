import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/check-monitors";

import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>({
  authMode: "iam",
});

async function checkUrl(url: string) {
  const started = Date.now();

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseCheck/1.0",
      },
    });

    clearTimeout(timeout);

    return {
      status: response.ok ? "UP" : "DOWN",
      statusCode: response.status,
      responseTime: Date.now() - started,
      errorMessage: response.ok
        ? undefined
        : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "DOWN",
      statusCode: undefined,
      responseTime: Date.now() - started,
      errorMessage:
        error instanceof Error
          ? error.message
          : "Connection failed",
    };
  }
}

export const handler = async () => {
  console.log("========================================");
  console.log("PulseCheck monitor check started");
  console.log("========================================");

  const { data: monitors, errors } =
    await client.models.Monitor.list({
      limit: 1000,
    });

  if (errors?.length) {
    console.error("FAILED TO LOAD MONITORS:");
    console.error(JSON.stringify(errors, null, 2));

    throw new Error(
      `Could not load monitors: ${errors[0]?.message ?? "Unknown error"}`
    );
  }

  console.log(`Monitors found: ${monitors.length}`);

  let checked = 0;

  for (const monitor of monitors) {
    console.log(
      `Checking: ${monitor.name} -> ${monitor.url}`
    );

    if (!monitor.enabled) {
      console.log(`Skipped disabled monitor: ${monitor.name}`);
      continue;
    }

    const result = await checkUrl(monitor.url);
    const now = new Date().toISOString();

    console.log(
      `${monitor.name}: ${result.status} | HTTP ${
        result.statusCode ?? "N/A"
      } | ${result.responseTime}ms`
    );

    const updateResult = await client.models.Monitor.update({
      id: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      lastChecked: now,
      lastUp:
        result.status === "UP"
          ? now
          : monitor.lastUp,
      lastDown:
        result.status === "DOWN"
          ? now
          : monitor.lastDown,
      errorMessage: result.errorMessage,
    });

    if (updateResult.errors?.length) {
      console.error(
        `FAILED TO UPDATE ${monitor.name}:`,
        JSON.stringify(updateResult.errors, null, 2)
      );
    }

    const checkResult =
      await client.models.MonitorCheck.create({
        monitorId: monitor.id,
        status: result.status,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        checkedAt: now,
        errorMessage: result.errorMessage,
        region: "ap-south-1",
      });

    if (checkResult.errors?.length) {
      console.error(
        `FAILED TO SAVE CHECK FOR ${monitor.name}:`,
        JSON.stringify(checkResult.errors, null, 2)
      );
    }

    checked++;
  }

  console.log(
    `PulseCheck completed successfully. Checked: ${checked}`
  );

  return {
    checked,
  };
};