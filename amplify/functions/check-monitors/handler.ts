import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/check-monitors";
import {
  lookup,
  resolve4,
  resolve6,
  resolveCname,
  resolveMx,
  resolveNs,
  resolveTxt,
} from "node:dns/promises";
import net from "node:net";
import tls from "node:tls";

import type { Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>({ authMode: "iam" });

type MonitorResult = {
  status: "UP" | "DOWN";
  statusCode?: number;
  responseTime: number;
  errorMessage?: string;
};

function timeoutFor(monitor: Schema["Monitor"]["type"]) {
  const configured = Number(monitor.timeoutSeconds ?? 10);
  return Math.min(60, Math.max(2, configured)) * 1000;
}

function parseHeaders(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, value]) => typeof value === "string",
      ) as [string, string][],
    );
  } catch {
    return {};
  }
}

async function checkHttp(monitor: Schema["Monitor"]["type"]): Promise<MonitorResult> {
  const started = Date.now();
  let controller: AbortController | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    controller = new AbortController();
    timeout = setTimeout(() => controller?.abort(), timeoutFor(monitor));

    const method = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(monitor.method ?? "GET")
      ? (monitor.method ?? "GET")
      : "GET";

    const response = await fetch(monitor.url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseCheck/2.0",
        ...parseHeaders(monitor.requestHeadersJson),
      },
      body: method === "GET" || method === "HEAD" ? undefined : monitor.requestBody ?? undefined,
    });

    const responseTime = Date.now() - started;
    const expectedStatus = Number(monitor.expectedStatusCode ?? 200);
    let bodyMatches = true;

    if (monitor.expectedBodyText && method !== "HEAD") {
      const body = await response.text();
      bodyMatches = body.includes(monitor.expectedBodyText);
    }

    if (response.status !== expectedStatus) {
      return {
        status: "DOWN",
        statusCode: response.status,
        responseTime,
        errorMessage: `Expected HTTP ${expectedStatus}, received HTTP ${response.status}`,
      };
    }

    if (!bodyMatches) {
      return {
        status: "DOWN",
        statusCode: response.status,
        responseTime,
        errorMessage: `Expected response text was not found: ${monitor.expectedBodyText}`,
      };
    }

    return {
      status: response.ok ? "UP" : "DOWN",
      statusCode: response.status,
      responseTime,
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "DOWN",
      responseTime: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "Connection failed",
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function connectTcp(host: string, port: number, timeoutMs: number): Promise<number> {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("TCP connection timed out"));
    }, timeoutMs);

    socket.once("connect", () => {
      clearTimeout(timer);
      const elapsed = Date.now() - started;
      socket.end();
      resolve(elapsed);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function checkTcp(monitor: Schema["Monitor"]["type"]): Promise<MonitorResult> {
  const started = Date.now();
  try {
    const url = monitor.url.includes("://") ? new URL(monitor.url) : undefined;
    const host = url?.hostname ?? monitor.url;
    const port = Number(monitor.port ?? url?.port ?? 443);
    const responseTime = await connectTcp(host, port, timeoutFor(monitor));
    return { status: "UP", responseTime };
  } catch (error) {
    return {
      status: "DOWN",
      responseTime: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "TCP connection failed",
    };
  }
}

async function checkDns(monitor: Schema["Monitor"]["type"]): Promise<MonitorResult> {
  const started = Date.now();
  try {
    const hostname = monitor.url
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0]
      .trim();

    const recordType = (monitor.dnsRecordType ?? "A").toUpperCase();
    let values: string[] = [];

    switch (recordType) {
      case "A":
        values = await resolve4(hostname);
        break;
      case "AAAA":
        values = await resolve6(hostname);
        break;
      case "CNAME":
        values = await resolveCname(hostname);
        break;
      case "MX":
        values = (await resolveMx(hostname)).map((entry) => `${entry.exchange} (${entry.priority})`);
        break;
      case "NS":
        values = await resolveNs(hostname);
        break;
      case "TXT":
        values = (await resolveTxt(hostname)).map((entry) => entry.join(""));
        break;
      default:
        throw new Error(`Unsupported DNS record type: ${recordType}`);
    }

    const expected = (monitor.dnsExpectedValue ?? "").trim();
    const matches = expected
      ? values.some((value) => value.trim().toLowerCase() === expected.toLowerCase())
      : true;

    if (!matches) {
      return {
        status: "DOWN",
        responseTime: Date.now() - started,
        errorMessage: `DNS mismatch: expected ${expected}, received ${values.join(", ") || "no records"}`,
      };
    }

    return { status: "UP", responseTime: Date.now() - started };
  } catch (error) {
    return {
      status: "DOWN",
      responseTime: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "DNS resolution failed",
    };
  }
}

function checkTls(host: string, port: number, timeoutMs: number): Promise<tls.PeerCertificate> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("TLS connection timed out"));
    }, timeoutMs);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const certificate = socket.getPeerCertificate();
      socket.end();
      resolve(certificate);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

async function checkSsl(monitor: Schema["Monitor"]["type"]): Promise<MonitorResult> {
  const started = Date.now();
  try {
    const url = monitor.url.includes("://") ? new URL(monitor.url) : new URL(`https://${monitor.url}`);
    const certificate = await checkTls(url.hostname, Number(url.port || 443), timeoutFor(monitor));
    if (!certificate.valid_to) throw new Error("TLS certificate did not provide an expiry date");

    const expiresAt = new Date(certificate.valid_to).getTime();
    const daysLeft = Math.ceil((expiresAt - Date.now()) / 86_400_000);
    const warningDays = Math.max(1, Number(monitor.sslExpiryWarningDays ?? 14));

    if (daysLeft < 0) {
      return {
        status: "DOWN",
        responseTime: Date.now() - started,
        errorMessage: `TLS certificate expired ${Math.abs(daysLeft)} day(s) ago`,
      };
    }

    if (daysLeft <= warningDays) {
      return {
        status: "DOWN",
        responseTime: Date.now() - started,
        errorMessage: `TLS certificate expires in ${daysLeft} day(s)`,
      };
    }

    return { status: "UP", responseTime: Date.now() - started };
  } catch (error) {
    return {
      status: "DOWN",
      responseTime: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : "TLS certificate check failed",
    };
  }
}

async function checkMonitor(monitor: Schema["Monitor"]["type"]): Promise<MonitorResult> {
  switch ((monitor.monitorType ?? "HTTP").toUpperCase()) {
    case "TCP":
      return checkTcp(monitor);
    case "DNS":
      return checkDns(monitor);
    case "SSL":
      return checkSsl(monitor);
    case "API":
    case "HTTP":
    default:
      return checkHttp(monitor);
  }
}

async function trackIncident(
  monitorId: string,
  previousStatus: string | null | undefined,
  result: MonitorResult,
  now: string,
) {
  if (previousStatus !== "DOWN" && result.status === "DOWN") {
    const { errors } = await client.models.Incident.create({
      monitorId,
      status: "OPEN",
      startedAt: now,
      reason: result.errorMessage,
    });
    if (errors?.length) console.error("Incident create failed:", errors);
    return;
  }

  if (previousStatus === "DOWN" && result.status === "UP") {
    const { data: openIncidents, errors } = await client.models.Incident.list({
      filter: { monitorId: { eq: monitorId }, status: { eq: "OPEN" } },
    });
    if (errors?.length) console.error("Incident lookup failed:", errors);

    for (const incident of openIncidents ?? []) {
      const startedAtMs = new Date(incident.startedAt).getTime();
      const durationSeconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));

      const { errors: updateErrors } = await client.models.Incident.update({
        id: incident.id,
        status: "RESOLVED",
        resolvedAt: now,
        duration: durationSeconds,
      });
      if (updateErrors?.length) console.error("Incident resolve failed:", updateErrors);
    }
  }
}

export const handler = async () => {
  console.log("PulseCheck monitor check started");

  const { data: monitors, errors } = await client.models.Monitor.list({ limit: 1000 });
  if (errors?.length) {
    console.error(errors);
    throw new Error("Could not load monitors");
  }

  let checked = 0;
  let skipped = 0;

  for (const monitor of monitors) {
    if (!monitor.enabled) {
      skipped++;
      continue;
    }

    const intervalMinutes = Math.max(1, Number(monitor.checkInterval ?? 5));
    if (monitor.status !== "UNKNOWN" && monitor.lastChecked) {
      const ageMs = Date.now() - new Date(monitor.lastChecked).getTime();
      if (ageMs < intervalMinutes * 60_000) {
        skipped++;
        continue;
      }
    }

    const previousStatus = monitor.status;
    const result = await checkMonitor(monitor);
    const now = new Date().toISOString();

    const { errors: updateErrors } = await client.models.Monitor.update({
      id: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      lastChecked: now,
      lastUp: result.status === "UP" ? now : monitor.lastUp,
      lastDown: result.status === "DOWN" ? now : monitor.lastDown,
      errorMessage: result.errorMessage,
    });

    if (updateErrors?.length) {
      console.error(`Monitor update failed for ${monitor.id}:`, updateErrors);
      skipped++;
      continue;
    }

    const { errors: checkErrors } = await client.models.MonitorCheck.create({
      monitorId: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTime: result.responseTime,
      checkedAt: now,
      errorMessage: result.errorMessage,
      region: process.env.AWS_REGION ?? "ap-south-1",
    });

    if (checkErrors?.length) {
      console.error(`Monitor check history write failed for ${monitor.id}:`, checkErrors);
    }

    await trackIncident(monitor.id, previousStatus, result, now);

    console.log(
      `${monitor.name}: ${monitor.monitorType ?? "HTTP"} ${result.status} ${result.statusCode ?? ""} ${result.responseTime}ms`,
    );
    checked++;
  }

  console.log(`Completed: ${checked} monitors checked; ${skipped} skipped`);
  return { checked, skipped };
};
