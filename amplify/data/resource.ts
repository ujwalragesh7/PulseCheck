import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Monitor: a
    .model({
      name: a.string().required(),
      url: a.string().required(),
      status: a.string().required(),
      responseTime: a.integer(),
      lastChecked: a.datetime(),
      ownerId: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});