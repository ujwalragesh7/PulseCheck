import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(process.env as any);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>({
  authMode: "iam",
});

const DEFAULT_INTERVAL_MINUTES = 5;
const REGION = process.env.AWS_REGION ?? "ap-south-1";

function normalizeInterval(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_INTERVAL_MINUTES;
  }

  return Math.max(1, Math.min(60, Math.floor(value)));
}

async function checkUrl(url: string) {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseCheck/1.0",
      },
    });

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
        error instanceof Error ? error.message : "Connection failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function updateIncident(
  monitorId: string,
  status: string,
  now: string,
  errorMessage?: string,
  statusCode?: number,
) {
  const { data: incidents, errors } =
    await client.models.Incident.list({
      filter: {
        monitorId: { eq: monitorId },
      },
      limit: 100,
    });

  if (errors?.length) {
    console.error("Failed to load incidents:", JSON.stringify(errors));
    return;
  }

  const openIncident = incidents.find(
    (incident) => incident.status === "OPEN",
  );

  if (status === "DOWN" && !openIncident) {
    const result = await client.models.Incident.create({
      monitorId,
      status: "OPEN",
      startedAt: now,
      reason:
        errorMessage ??
        `HTTP ${statusCode ?? "N/A"}`,
    });

    if (result.errors?.length) {
      console.error(
        "Failed to create incident:",
        JSON.stringify(result.errors),
      );
    }

    return;
  }

  if (status === "UP" && openIncident) {
    const startedAt = new Date(openIncident.startedAt).getTime();
    const resolvedAt = new Date(now).getTime();

    const result = await client.models.Incident.update({
      id: openIncident.id,
      status: "RESOLVED",
      resolvedAt: now,
      duration: Math.max(0, Math.floor((resolvedAt - startedAt) / 1000)),
    });

    if (result.errors?.length) {
      console.error(
        "Failed to resolve incident:",
        JSON.stringify(result.errors),
      );
    }
  }
}

export const handler = async () => {
  console.log("PulseCheck monitor check started");

  const { data: settings, errors: settingsErrors } =
    await client.models.MonitoringSettings.list({ limit: 1 });

  if (settingsErrors?.length) {
    throw new Error(
      settingsErrors[0]?.message ?? "Unable to read monitoring state.",
    );
  }

  const platformRunning = settings?.[0]?.monitoringEnabled ?? true;

  if (!platformRunning) {
    console.log("PulseCheck is globally STOPPED.");
    return {
      checked: 0,
      skipped: 0,
      platformStopped: true,
    };
  }

  const { data: monitors, errors } =
    await client.models.Monitor.list({ limit: 1000 });

  if (errors?.length) {
    throw new Error(
      errors[0]?.message ?? "Could not load monitors.",
    );
  }

  let checked = 0;
  let skipped = 0;
  const nowMs = Date.now();

  for (const monitor of monitors) {
    if (!monitor.enabled) {
      skipped++;
      continue;
    }

    const intervalMinutes = normalizeInterval(monitor.checkInterval);
    const lastCheckedMs = monitor.lastChecked
      ? new Date(monitor.lastChecked).getTime()
      : 0;

    if (
      lastCheckedMs > 0 &&
      nowMs - lastCheckedMs < intervalMinutes * 60_000
    ) {
      skipped++;
      continue;
    }

    console.log(`Checking ${monitor.name} -> ${monitor.url}`);

    const result = await checkUrl(monitor.url);
    const now = new Date().toISOString();

    const updateResult = await client.models.Monitor.update({
      id: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      lastChecked: now,
      lastUp: result.status === "UP" ? now : monitor.lastUp,
      lastDown: result.status === "DOWN" ? now : monitor.lastDown,
      errorMessage: result.errorMessage,
    });

    if (updateResult.errors?.length) {
      console.error(
        `Failed to update ${monitor.name}:`,
        JSON.stringify(updateResult.errors),
      );
      skipped++;
      continue;
    }

    const checkResult = await client.models.MonitorCheck.create({
      monitorId: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      checkedAt: now,
      errorMessage: result.errorMessage,
      region: REGION,
    });

    if (checkResult.errors?.length) {
      console.error(
        `Failed to save check for ${monitor.name}:`,
        JSON.stringify(checkResult.errors),
      );
    }

    await updateIncident(
      monitor.id,
      result.status,
      now,
      result.errorMessage,
      result.statusCode,
    );

    checked++;
  }

  console.log(
    `PulseCheck completed. Checked: ${checked}, skipped: ${skipped}`,
  );

  return {
    checked,
    skipped,
    platformStopped: false,
  };
};
