import { defineBackend } from "@aws-amplify/backend";

import { CfnSchedule } from "aws-cdk-lib/aws-scheduler";

import {
  Role,
  ServicePrincipal,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";

import { CfnFunction } from "aws-cdk-lib/aws-lambda";

import { auth } from "./auth/resource";
import { data } from "./data/resource";

import {
  checkMonitors,
} from "./functions/check-monitors/resource";

import {
  adminControl,
} from "./functions/admin-control/resource";


/* ============================================================
   BACKEND
   ============================================================ */

const backend = defineBackend({
  auth,
  data,
  checkMonitors,
  adminControl,
});


/* ============================================================
   IMPORTANT
   ============================================================

   checkMonitors and adminControl are both assigned to:

       resourceGroupName: "data"

   Therefore they live inside the Data stack.

   The Scheduler resources are ALSO created inside the
   Data stack.

   This avoids:

       Data -> Scheduler -> Function -> Data

   circular dependencies.
   ============================================================ */

const schedulerStack =
  backend.data.stack;


/* ============================================================
   SCHEDULER IAM ROLE
   ============================================================ */

const schedulerRole =
  new Role(
    schedulerStack,
    "PulseCheckSchedulerRole",
    {
      assumedBy:
        new ServicePrincipal(
          "scheduler.amazonaws.com",
        ),
    },
  );


/*
 * EventBridge Scheduler is allowed to invoke
 * the check-monitors Lambda.
 */

schedulerRole.addToPolicy(
  new PolicyStatement({
    actions: [
      "lambda:InvokeFunction",
    ],

    resources: [
      backend.checkMonitors
        .resources
        .lambda
        .functionArn,
    ],
  }),
);


/* ============================================================
   MONITOR SCHEDULE
   ============================================================ */

const scheduleName =
  "pulsecheck-monitor-schedule";


const monitorSchedule =
  new CfnSchedule(
    schedulerStack,
    "PulseCheckMonitorSchedule",
    {
      name:
        scheduleName,

      scheduleExpression:
        "rate(1 minute)",

      flexibleTimeWindow: {
        mode: "OFF",
      },

      state:
        "ENABLED",

      target: {
        arn:
          backend.checkMonitors
            .resources
            .lambda
            .functionArn,

        roleArn:
          schedulerRole.roleArn,
      },
    },
  );


/* ============================================================
   ALLOW EVENTBRIDGE SCHEDULER TO INVOKE LAMBDA
   ============================================================ */

backend.checkMonitors
  .resources
  .lambda
  .addPermission(
    "AllowPulseCheckScheduler",
    {
      principal:
        new ServicePrincipal(
          "scheduler.amazonaws.com",
        ),

      sourceArn:
        monitorSchedule.attrArn,
    },
  );


/* ============================================================
   ADMIN LAMBDA
   ============================================================ */

const adminLambda =
  backend.adminControl
    .resources
    .lambda;


/* ============================================================
   ADMIN -> SCHEDULER PERMISSIONS
   ============================================================ */

adminLambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "scheduler:GetSchedule",
      "scheduler:UpdateSchedule",
    ],

    resources: [
      monitorSchedule.attrArn,
    ],
  }),
);


/* ============================================================
   ADMIN -> COGNITO PERMISSION
   ============================================================ */

adminLambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:ListUsers",
    ],

    resources: [
      backend.auth
        .resources
        .userPool
        .userPoolArn,
    ],
  }),
);


/* ============================================================
   ADMIN ENVIRONMENT VARIABLES
   ============================================================ */

const adminCfnFunction =
  adminLambda.node
    .defaultChild as CfnFunction;


/*
 * Real Cognito User Pool ID.
 */

adminCfnFunction.addPropertyOverride(
  "Environment.Variables.USER_POOL_ID",
  backend.auth
    .resources
    .userPool
    .userPoolId,
);


/*
 * Real EventBridge Scheduler name.
 */

adminCfnFunction.addPropertyOverride(
  "Environment.Variables.SCHEDULE_NAME",
  scheduleName,
);