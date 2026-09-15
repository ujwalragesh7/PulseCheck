import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  SchedulerClient,
  GetScheduleCommand,
  UpdateScheduleCommand,
} from "@aws-sdk/client-scheduler";

import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";

import {
  getAmplifyDataClientConfig,
} from "@aws-amplify/backend/function/runtime";

import { env } from "$amplify/env/admin-control";

import type { Schema } from "../../data/resource";

/* ============================================================
   AMPLIFY DATA CLIENT
   ============================================================ */

const {
  resourceConfig,
  libraryOptions,
} = await getAmplifyDataClientConfig(env);

Amplify.configure(
  resourceConfig,
  libraryOptions,
);

const client = generateClient<Schema>({
  authMode: "iam",
});

/* ============================================================
   AWS CLIENTS
   ============================================================ */

const cognito =
  new CognitoIdentityProviderClient({});

const scheduler =
  new SchedulerClient({});

/* ============================================================
   ADMIN
   ============================================================ */

const ADMIN_EMAIL =
  "ujwalragesh2@gmail.com";

/* ============================================================
   ADMIN SECURITY
   ============================================================ */

function assertAdmin(event: any) {
  const claims =
    event.identity?.claims ?? {};

  const email =
    claims.email ??
    claims["cognito:username"];

  const groups =
    claims["cognito:groups"];

  const groupList =
    Array.isArray(groups)
      ? groups
      : typeof groups === "string"
        ? groups.split(",")
        : [];

  if (
    email !== ADMIN_EMAIL &&
    !groupList.includes("ADMINS")
  ) {
    throw new Error(
      "Administrator access required.",
    );
  }
}

/* ============================================================
   PLATFORM SETTINGS
   ============================================================ */

async function getSettings() {
  const {
    data,
    errors,
  } =
    await client.models.MonitoringSettings.list({
      limit: 10,
    });

  if (errors?.length) {
    throw new Error(
      errors[0]?.message ??
        "Could not load platform settings.",
    );
  }

  return data?.[0] ?? null;
}

/* ============================================================
   ENSURE SETTINGS
   ============================================================ */

async function ensureSettings() {
  const existing =
    await getSettings();

  if (existing) {
    return existing;
  }

  const {
    data,
    errors,
  } =
    await client.models.MonitoringSettings.create({
      monitoringEnabled: true,
      uptimeWindowDays: 1,
      platformMessage: "",
    });

  if (errors?.length || !data) {
    throw new Error(
      errors?.[0]?.message ??
        "Could not create platform settings.",
    );
  }

  return data;
}

/* ============================================================
   SCHEDULER CONTROL
   ============================================================ */

async function setSchedulerState(
  enabled: boolean,
) {
  /*
   * Read the existing schedule first.
   * We preserve its current target and schedule expression.
   */

  const current =
    await scheduler.send(
      new GetScheduleCommand({
        Name: env.SCHEDULE_NAME,
      }),
    );

  if (!current.Target) {
    throw new Error(
      "PulseCheck monitor schedule has no target.",
    );
  }

  await scheduler.send(
    new UpdateScheduleCommand({
      Name: env.SCHEDULE_NAME,

      State: enabled
        ? "ENABLED"
        : "DISABLED",

      ScheduleExpression:
        current.ScheduleExpression ??
        "rate(1 minute)",

      FlexibleTimeWindow:
        current.FlexibleTimeWindow ?? {
          Mode: "OFF",
        },

      Target: {
        Arn: current.Target.Arn,
        RoleArn: current.Target.RoleArn,
        Input: current.Target.Input,
      },
    }),
  );
}

/* ============================================================
   COGNITO USERS
   ============================================================ */

async function getUsers() {
  const users: any[] = [];

  let paginationToken:
    | string
    | undefined;

  do {
    const response: any =
      await cognito.send(
        new ListUsersCommand({
          UserPoolId:
            env.USER_POOL_ID,

          Limit: 60,

          PaginationToken:
            paginationToken,
        }),
      );

    users.push(
      ...(response.Users ?? []),
    );

    paginationToken =
      response.PaginationToken;
  } while (paginationToken);

  return users;
}

/* ============================================================
   ADMIN OVERVIEW
   ============================================================ */

async function getAdminOverview() {
  const settings =
    await ensureSettings();

  const users =
    await getUsers();

  /* ==========================================================
     MONITORS
     ========================================================== */

  const {
    data: monitors,
    errors: monitorErrors,
  } =
    await client.models.Monitor.list({
      limit: 10000,
    });

  if (monitorErrors?.length) {
    throw new Error(
      monitorErrors[0]?.message ??
        "Could not load monitors.",
    );
  }

  /* ==========================================================
     INCIDENTS
     ========================================================== */

  const {
    data: incidents,
    errors: incidentErrors,
  } =
    await client.models.Incident.list({
      limit: 10000,
    });

  if (incidentErrors?.length) {
    throw new Error(
      incidentErrors[0]?.message ??
        "Could not load incidents.",
    );
  }

  /* ==========================================================
     USER ACTIVITY
     ========================================================== */

  const {
    data: activities,
    errors: activityErrors,
  } =
    await client.models.UserActivity.list({
      limit: 10000,
    });

  if (activityErrors?.length) {
    throw new Error(
      activityErrors[0]?.message ??
        "Could not load activity.",
    );
  }

  /* ==========================================================
     TIME WINDOWS
     ========================================================== */

  const now =
    Date.now();

  const dayAgo =
    now -
    24 *
      60 *
      60 *
      1000;

  const weekAgo =
    now -
    7 *
      24 *
      60 *
      60 *
      1000;

  const monthAgo =
    now -
    30 *
      24 *
      60 *
      60 *
      1000;

  /* ==========================================================
     USERS
     ========================================================== */

  const activeUsers =
    users.filter(
      (user) =>
        user.Enabled !== false,
    ).length;

  const confirmedUsers =
    users.filter(
      (user) =>
        user.UserStatus ===
        "CONFIRMED",
    ).length;

  /* ==========================================================
     LOGIN ACTIVITY
     ========================================================== */

  const loginActivities =
    activities.filter(
      (activity) =>
        activity.action ===
        "LOGIN",
    );

  const getActivityTime = (
    activity: any,
  ) =>
    new Date(
      activity.timestamp ??
        activity.createdAt ??
        0,
    ).getTime();

  const loginsToday =
    loginActivities.filter(
      (activity) =>
        getActivityTime(
          activity,
        ) >= dayAgo,
    ).length;

  const logins7d =
    loginActivities.filter(
      (activity) =>
        getActivityTime(
          activity,
        ) >= weekAgo,
    ).length;

  const logins30d =
    loginActivities.filter(
      (activity) =>
        getActivityTime(
          activity,
        ) >= monthAgo,
    ).length;

  /* ==========================================================
     MONITORING
     ========================================================== */

  const healthy =
    monitors.filter(
      (monitor) =>
        monitor.enabled &&
        monitor.status ===
          "UP",
    ).length;

  const down =
    monitors.filter(
      (monitor) =>
        monitor.enabled &&
        monitor.status ===
          "DOWN",
    ).length;

  const disabled =
    monitors.filter(
      (monitor) =>
        !monitor.enabled,
    ).length;

  const active =
    monitors.filter(
      (monitor) =>
        monitor.enabled,
    ).length;

  /* ==========================================================
     INCIDENTS
     ========================================================== */

  const openIncidents =
    incidents.filter(
      (incident) =>
        incident.status ===
        "OPEN",
    ).length;

  /* ==========================================================
     RESPONSE TIME
     ========================================================== */

  const responseTimes =
    monitors
      .filter(
        (monitor) =>
          monitor.enabled &&
          monitor.responseTime !=
            null,
      )
      .map(
        (monitor) =>
          monitor.responseTime as number,
      );

  const averageResponseTime =
    responseTimes.length
      ? Math.round(
          responseTimes.reduce(
            (a, b) => a + b,
            0,
          ) /
            responseTimes.length,
        )
      : 0;

  /* ==========================================================
     RESULT
     ========================================================== */

  return {
    platformRunning:
      settings.monitoringEnabled ??
      true,

    platformMessage:
      settings.platformMessage ??
      "",

    uptimeWindowDays:
      settings.uptimeWindowDays ??
      1,

    users: {
      total:
        users.length,

      active:
        activeUsers,

      confirmed:
        confirmedUsers,

      disabled:
        users.length -
        activeUsers,

      newToday:
        users.filter(
          (user) =>
            new Date(
              user.UserCreateDate ??
                0,
            ).getTime() >=
            dayAgo,
        ).length,

      new7d:
        users.filter(
          (user) =>
            new Date(
              user.UserCreateDate ??
                0,
            ).getTime() >=
            weekAgo,
        ).length,

      new30d:
        users.filter(
          (user) =>
            new Date(
              user.UserCreateDate ??
                0,
            ).getTime() >=
            monthAgo,
        ).length,

      loginsToday,

      logins7d,

      logins30d,
    },

    monitoring: {
      total:
        monitors.length,

      healthy,

      down,

      disabled,

      active,

      openIncidents,

      averageResponseTime,
    },

    generatedAt:
      new Date().toISOString(),
  };
}

/* ============================================================
   ADMIN OVERVIEW FUNCTION
   ============================================================ */

export const handler:
  Schema["adminOverview"]["functionHandler"] =
  async (event) => {
    assertAdmin(event);

    return getAdminOverview();
  };

/* ============================================================
   START / STOP PLATFORM
   ============================================================ */

export const setPlatformState:
  Schema["setPlatformState"]["functionHandler"] =
  async (event) => {
    assertAdmin(event);

    const enabled =
      event.arguments.enabled;

    const message =
      event.arguments.message ??
      "";

    const settings =
      await ensureSettings();

    const {
      errors,
    } =
      await client.models.MonitoringSettings.update({
        id: settings.id,

        monitoringEnabled:
          enabled,

        platformMessage:
          message,
      });

    if (errors?.length) {
      throw new Error(
        errors[0]?.message ??
          "Could not update platform state.",
      );
    }

    await setSchedulerState(
      enabled,
    );

    return {
      monitoringEnabled:
        enabled,

      message,
    };
  };

/* ============================================================
   PLATFORM STATUS
   ============================================================ */

export const getPlatformStatus:
  Schema["platformStatus"]["functionHandler"] =
  async () => {
    const settings =
      await ensureSettings();

    return {
      monitoringEnabled:
        settings.monitoringEnabled ??
        true,

      uptimeWindowDays:
        settings.uptimeWindowDays ??
        1,

      message:
        settings.platformMessage ??
        "",
    };
  };