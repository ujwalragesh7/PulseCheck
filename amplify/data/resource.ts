import {
  type ClientSchema,
  a,
  defineData,
} from "@aws-amplify/backend";

import { checkMonitors } from "../functions/check-monitors/resource";

const schema = a
  .schema({
    Monitor: a
      .model({
        name: a.string().required(),
        url: a.string().required(),
        monitorType: a.string().default("HTTP"),
        method: a.string().default("GET"),
        expectedStatusCode: a.integer().default(200),
        expectedBodyText: a.string(),
        timeoutSeconds: a.integer().default(10),
        port: a.integer(),
        dnsRecordType: a.string().default("A"),
        dnsExpectedValue: a.string(),
        sslExpiryWarningDays: a.integer().default(14),
        requestHeadersJson: a.string(),
        requestBody: a.string(),
        status: a.string().default("UNKNOWN"),
        responseTime: a.integer(),
        statusCode: a.integer(),
        lastChecked: a.datetime(),
        lastUp: a.datetime(),
        lastDown: a.datetime(),
        uptime24h: a.float().default(100),
        uptime7d: a.float().default(100),
        uptime30d: a.float().default(100),
        uptimeWindowDays: a.integer().default(1),
        enabled: a.boolean().default(true),
        checkInterval: a.integer().default(5),
        errorMessage: a.string(),
        checks: a.hasMany("MonitorCheck", "monitorId"),
        incidents: a.hasMany("Incident", "monitorId"),
      })
      .authorization((allow) => [allow.owner()]),

    MonitorCheck: a
      .model({
        monitorId: a.id().required(),
        monitor: a.belongsTo("Monitor", "monitorId"),
        status: a.string().required(),
        statusCode: a.integer(),
        responseTime: a.integer(),
        checkedAt: a.datetime().required(),
        errorMessage: a.string(),
        region: a.string().default("ap-south-1"),
      })
      .authorization((allow) => [allow.owner()]),

    Incident: a
      .model({
        monitorId: a.id().required(),
        monitor: a.belongsTo("Monitor", "monitorId"),
        status: a.string().default("OPEN"),
        startedAt: a.datetime().required(),
        resolvedAt: a.datetime(),
        duration: a.integer(),
        reason: a.string(),
      })
      .authorization((allow) => [allow.owner()]),

    UserActivity: a
      .model({
        action: a.string().required(),
        username: a.string().required(),
        timestamp: a.datetime().required(),
        metadata: a.string(),
      })
      .authorization((allow) => [allow.owner()]),

  })
  .authorization((allow) => [
    allow.resource(checkMonitors),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});