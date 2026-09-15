import {
  type ClientSchema,
  a,
  defineData,
} from "@aws-amplify/backend";

import { checkMonitors } from "../functions/check-monitors/resource";
import { adminControl } from "../functions/admin-control/resource";

const schema = a
  .schema({
    Monitor: a
      .model({
        name: a.string().required(),
        url: a.string().required(),
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

    MonitoringSettings: a
      .model({
        monitoringEnabled: a.boolean().default(true),
        uptimeWindowDays: a.integer().default(1),
        platformMessage: a.string(),
      })
      .authorization((allow) => [
        allow.authenticated().to(["read"]),
      ]),

    UserActivity: a
      .model({
        action: a.string().required(),
        username: a.string().required(),
        timestamp: a.datetime().required(),
        metadata: a.string(),
      })
      .authorization((allow) => [allow.owner()]),

    AdminOverview: a.customType({
      platformRunning: a.boolean().required(),
      platformMessage: a.string(),
      uptimeWindowDays: a.integer().required(),
      users: a.customType({
        total: a.integer().required(),
        active: a.integer().required(),
        confirmed: a.integer().required(),
        disabled: a.integer().required(),
        newToday: a.integer().required(),
        new7d: a.integer().required(),
        new30d: a.integer().required(),
        loginsToday: a.integer().required(),
        logins7d: a.integer().required(),
        logins30d: a.integer().required(),
      }),
      monitoring: a.customType({
        total: a.integer().required(),
        healthy: a.integer().required(),
        down: a.integer().required(),
        disabled: a.integer().required(),
        active: a.integer().required(),
        openIncidents: a.integer().required(),
        averageResponseTime: a.integer().required(),
      }),
      generatedAt: a.datetime().required(),
    }),

    PlatformStatus: a.customType({
      monitoringEnabled: a.boolean().required(),
      uptimeWindowDays: a.integer().required(),
      message: a.string(),
    }),

    PlatformControlResult: a.customType({
      monitoringEnabled: a.boolean().required(),
      message: a.string(),
    }),

    adminOverview: a
      .query()
      .returns(a.ref("AdminOverview"))
      .authorization((allow) => [allow.groups(["ADMINS"])])
      .handler(a.handler.function(adminControl)),

    platformStatus: a
      .query()
      .returns(a.ref("PlatformStatus"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(adminControl)),

    setPlatformState: a
      .mutation()
      .arguments({
        enabled: a.boolean().required(),
        message: a.string(),
      })
      .returns(a.ref("PlatformControlResult"))
      .authorization((allow) => [allow.groups(["ADMINS"])])
      .handler(a.handler.function(adminControl)),
  })
  .authorization((allow) => [
    allow.resource(checkMonitors),
    allow.resource(adminControl),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
