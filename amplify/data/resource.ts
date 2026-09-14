import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});