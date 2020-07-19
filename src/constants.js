const authVersion = 'v5';
const deviceVersion = 'v5.1';

const constants = {
  authBase: `https://api.myqdevice.com/api/${authVersion}`,
  deviceBase: `https://api.myqdevice.com/api/${deviceVersion}`,
  allDeviceTypes: {
    hub: 'hub',
    virtualGarageDoorOpener: 'virtualgaragedooropener',
    wifiGarageDoorOpener: 'wifigaragedooropener',
    wifiGdoGateway: 'wifigdogateway',
  },
  errorMessages: {
    11: 'Something unexpected happened. Please wait a bit and try again.',
    12: 'MyQ service is currently down. Please wait a bit and try again.',
    13: 'Not logged in.',
    14: 'Email and/or password are incorrect.',
    15: 'Invalid parameter(s) provided.',
    16: 'User will be locked out due to too many tries. 1 try left.',
    17: 'User is locked out due to too many tries. Please reset password and try again.',
    18: 'The requested device could not be found.',
    19: 'Unable to determine the state of the requested device.',
    20: 'Could not find that URL. Please file a bug report.',
  },
  doorCommands: {
    close: 'close',
    open: 'open',
  },
  doorStates: {
    1: 'open',
    2: 'closed',
    3: 'stopped in the middle',
    4: 'going up',
    5: 'going down',
    9: 'not closed',
  },
  headers: {
    defaultUserAgent: 'okhttp/3.10.0',
    deviceApiVersion: deviceVersion,
    defaultBrandId: 2,
    defaultCulture: 'en',
    appId: 'JVM/G9Nwih5BwKgNCjLxiFUQxQijAebyyg8QUHr7JOrP+tuPb8iHfRHKwTmDzHOu',
  },
  lightCommands: {
    on: 'on',
    off: 'off',
  },
  lightStates: {
    0: 'turnoff',
    1: 'turnon',
  },
  myQProperties: {
    doorState: 'door_state',
    lastUpdate: 'last_update',
    lightState: 'light_state',
    online: 'online',
  },
  routes: {
    account: '/My',
    getDevices: '/Accounts/{accountId}/Devices',
    login: '/Login',
    setDevice: '/Accounts/{accountId}/Devices/{serialNumber}/actions',
  },
};

module.exports = constants;
