const authVersion = 'v5';
const deviceVersion = 'v5.1';

const constants = {
  codes: {
    OK: 'OK',
    INVALID_ARGUMENT: 'ERR_MYQ_INVALID_ARGUMENT',
    LOGIN_REQUIRED: 'ERR_MYQ_LOGIN_REQUIRED',
    AUTHENTICATION_FAILED: 'ERR_MYQ_AUTHENTICATION_FAILED',
    AUTHENTICATION_FAILED_ONE_TRY_LEFT: 'ERR_MYQ_AUTHENTICATION_FAILED_ONE_TRY_LEFT',
    AUTHENTICATION_FAILED_LOCKED_OUT: 'ERR_MYQ_AUTHENTICATION_FAILED_LOCKED_OUT',
    DEVICE_NOT_FOUND: 'ERR_MYQ_DEVICE_NOT_FOUND',
    DEVICE_STATE_NOT_FOUND: 'ERR_MYQ_DEVICE_STATE_NOT_FOUND',
    INVALID_DEVICE: 'ERR_MYQ_INVALID_DEVICE',
    SERVICE_REQUEST_FAILED: 'ERR_MYQ_SERVICE_REQUEST_FAILED',
    SERVICE_UNREACHABLE: 'ERR_MYQ_SERVICE_UNREACHABLE',
    INVALID_SERVICE_RESPONSE: 'ERR_MYQ_INVALID_SERVICE_RESPONSE',
  },
  _actions: {
    door: {
      open: 'open',
      close: 'close',
    },
    light: {
      turnOn: 'turnon',
      turnOff: 'turnoff',
    },
  },
  _stateAttributes: {
    doorState: 'door_state',
    lightState: 'light_state',
  },
  _baseUrls: {
    auth: `https://api.myqdevice.com/api/${authVersion}`,
    device: `https://api.myqdevice.com/api/${deviceVersion}`,
  },
  _routes: {
    login: 'Login',
    account: 'My',
    getDevices: 'Accounts/{accountId}/Devices',
    setDevice: 'Accounts/{accountId}/Devices/{serialNumber}/actions',
  },
  _headers: {
    'Content-Type': 'application/json',
    MyQApplicationId: 'JVM/G9Nwih5BwKgNCjLxiFUQxQijAebyyg8QUHr7JOrP+tuPb8iHfRHKwTmDzHOu',
    ApiVersion: '5.1',
    BrandId: '2',
    Culture: 'en',
  },
};

module.exports = constants;
