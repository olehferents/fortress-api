import PushNotifications from 'node-pushnotifications';
// var PushNotifications = require('node-pushnotifications');


const parentSettings = {
  //android
  gcm: {
    id: ''
  },
  //ios
  apn: {
    token: {
      key: process.env.APN_CERT_PARENT,
      keyId: process.env.APN_CERT_PARENT_KEY,
      teamId: process.env.APN_CERT_TEAM_ID
    },
    production: false
  },
  isAlwaysUseFCM: false,
}

const childSettings = {
  //android
  gcm: {
    id: ''
  },
  //ios
  apn: {
    token: {
      key: process.env.APN_CERT_CHILD,
      keyId: process.env.APN_CERT_CHILD_KEY,
      teamId: process.env.APN_CERT_TEAM_ID
    },
    production: false
  },
  isAlwaysUseFCM: false,
}

export const parentPushSettings = new PushNotifications(parentSettings);
export const childPushSettings = new PushNotifications(childSettings);
