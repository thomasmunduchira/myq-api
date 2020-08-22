# myq-api

![node-current](https://img.shields.io/node/v/myq-api)
![npm](https://img.shields.io/npm/dt/myq-api)
![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/thomasmunduchira/myq-api/latest_push/master)
![Coveralls github](https://img.shields.io/coveralls/github/thomasmunduchira/myq-api)
![Stryker mutation score](https://badge.stryker-mutator.io/github.com/thomasmunduchira/myq-api/master)
![GitHub](https://img.shields.io/github/license/thomasmunduchira/myq-api)

Interface with your [myQ](https://www.myq.com/products) devices using this npm module. Works with both Chamberlain and LiftMaster.

Supports:
* Opening or closing a door.
* Checking whether a door is open or closed.
* Turning on or turning off a light.
* Checking whether a light is turned on or turned off.
* Getting the metadata and state of all devices on an account.
* Getting the metadata and state of a specific device.
* A few other advanced usages documented below.

## Installation

Latest version:
```bash
npm install https://github.com/thomasmunduchira/myq-api.git
```

Older version that is currently live on npm:
```bash
npm install myq-api
```

## Examples

See [example.js](https://github.com/thomasmunduchira/myq-api/blob/master/example.js) and [example_async.js](https://github.com/thomasmunduchira/myq-api/blob/master/example_async.js) for end-to-end examples of using this module. Configure `EMAIL` and `PASSWORD` in these examples to enable running them against your own myQ account!

## API
* [new MyQ()](#new-myq)
* [login(email, password)](#loginemail-password)
* [getDevices()](#getdevices)
* [getDevice(serialNumber)](#getdeviceserialnumber)
* [getDoorState(serialNumber)](#getdoorstateserialnumber)
* [getLightState(serialNumber)](#getlightstateserialnumber)
* [setDoorState(serialNumber, action)](#setdoorstateserialnumber-action)
* [setLightState(serialNumber, action)](#setlightstateserialnumber-action)
* [_getAccountId()](#_getaccountid)
* [_getDeviceState(serialNumber, _stateAttribute)](#_getdevicestateserialnumber-_stateattribute)
* [_setDeviceState(serialNumber, _action, _stateAttribute)](#_setdevicestateserialnumber-_action-_stateattribute)
* [_executeServiceRequest(_config)](#_executeservicerequest_config)

## Usage

### new MyQ()

Initialize the MyQ API.

This used to take in an email and password, but these parameters have been deprecated in favor of login(username, password).

```js
const MyQ = require('myq-api');

const account = new MyQ();
```

### login(email, password)

Log into a myQ account and fetch a security token.

This must be called before the rest of this API is called. This used to take in no parameters, but the interface has been updated to take in the account email and password.

Note that the security token is short-lived and will not work after some time, so this might have to be called again to retrieve a new security token.

| Parameter | Required | Type   | Details                      |
|-----------|----------|--------|------------------------------|
| email     | yes      | string | Email for the myQ account    |
| password  | yes      | string | Password for the myQ account |

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function login() {
  try {
    const account = new MyQ();
    const result = await account.login(email, password)
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK",
  "securityToken": <securityToken>
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if arguments are not sufficiently validated beforehand)
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `AUTHENTICATION_FAILED`
* `AUTHENTICATION_FAILED_ONE_TRY_LEFT`
* `AUTHENTICATION_FAILED_LOCKED_OUT`

### getDevices()

Get the metadata and state of all devices on the myQ account.

login() must be called before this.

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account.getDevices())
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
}
```

async/await example:
```js
const MyQ = require('myq-api');

async function getDevices() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account.getDevices();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK",
  "devices": [device1, device2, ...]
}
```

For robust error handling, catch and handle the following errors:
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`

### getDevice(serialNumber)

Get the metadata and state of a specific device on the myQ account.

login() must be called before this.

| Parameter    | Required | Type    | Details                 |
|--------------|----------|---------|-------------------------|
| serialNumber | yes      | string  | Serial number of device |

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account.getDevice(serialNumber)
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function getDevice() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account.getDevice(serialNumber);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK",
  "device": <device>
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if argument is not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`

### getDoorState(serialNumber)

Check whether a door on the myQ account is open or closed.

login() must be called before this.

Note that this can report back intermediary states between open and closed as well.

| Parameter    | Required | Type    | Details               |
|--------------|----------|---------|-----------------------|
| serialNumber | yes      | string  | Serial number of door |

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account.getDoorState(serialNumber)
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function getDoorState() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account.getDoorState(serialNumber);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK",
  "deviceState": <deviceState>
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if argument is not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`
* `INVALID_DEVICE`

### getLightState(serialNumber)

Check whether a light on the myQ account is turned on or turned off.

login() must be called before this.

| Parameter    | Required | Type    | Details                |
|--------------|----------|---------|------------------------|
| serialNumber | yes      | string  | Serial number of light |

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account.getLightState(serialNumber)
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function getLightState() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account.getLightState(serialNumber);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK"
  "deviceState": <deviceState>
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if argument is not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`
* `INVALID_DEVICE`

### setDoorState(serialNumber, action)

Open or close a door on the myQ account.

login() must be called before this.

| Parameter    | Required | Type   | Details                                                                                |
|--------------|----------|--------|----------------------------------------------------------------------------------------|
| serialNumber | yes      | string | Serial number of door                                                                  |
| action       | yes      | symbol | Action to request on door (either `MyQ.actions.door.OPEN` or `MyQ.actions.door.CLOSE`) |

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account.setDoorState(serialNumber, MyQ.actions.door.OPEN)
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function setDoorState() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account.setDoorState(serialNumber, MyQ.actions.door.OPEN);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK"
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if arguments are not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`
* `INVALID_DEVICE`

### setLightState(serialNumber, action)

Turn on or turn off a light on the myQ account.

login() must be called before this.

| Parameter    | Required | Type   | Details                                                                                         |
|--------------|----------|--------|-------------------------------------------------------------------------------------------------|
| serialNumber | yes      | string | Serial number of light                                                                          |
| action       | yes      | symbol | Action to request on light (either `MyQ.actions.light.TURN_ON` or `MyQ.actions.light.TURN_OFF`) |

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account.setLightState(serialNumber, MyQ.actions.light.TURN_ON)
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function setLightState() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account.setLightState(serialNumber, MyQ.actions.light.TURN_ON);
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK"
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if arguments are not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`
* `INVALID_DEVICE`

### _getAccountId()

Get the account ID of the myQ account.

This is meant for internal use, but this is exposed in case one wants to fetch the account ID. login() must be called before this.

```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account._getAccountId()
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function getAccountId() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account._getAccountId();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK",
  "accountId": <accountId>
}
```

For robust error handling, catch and handle the following errors:
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`

### _getDeviceState(serialNumber, _stateAttribute)

Get the value of a state attribute for a device on the myQ account.

This is meant for internal use, but this is exposed in case one wants to fetch artibrary state attributes for a device. login() must be called before this.

| Parameter       | Required | Type   | Details                           |
|-----------------|----------|--------|-----------------------------------|
| serialNumber    | yes      | string | Serial number of device           |
| _stateAttribute | yes      | string | State attribute to fetch value of |

```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account._getDeviceState(serialNumber, 'door_state')
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function getDeviceState() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account._getDeviceState(serialNumber, 'door_state');
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK",
  "deviceState": <deviceState>
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if arguments are not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`
* `DEVICE_STATE_NOT_FOUND`

### _setDeviceState(serialNumber, _action, _stateAttribute)

Initiate an action for a device on the myQ account.

This is meant for internal use, but this is exposed in case one wants to initiate arbitrary actions for a device (e.g. for a device without first-class support in this API). login() must be called before this.

The _stateAttribute parameter would not be needed here normally. Since a 500 error is returned from the service when a state update is not supported on a device, however, we check that the state attribute we want to update is present on the device before we attempt a state update.

| Parameter       | Required | Type   | Details                                          |
|-----------------|----------|--------|--------------------------------------------------|
| serialNumber    | yes      | string | Serial number of device                          |
| _action         | yes      | string | Action to request on device                      |
| _stateAttribute | yes      | string | State attribute to ensure presence of beforehand |

```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account._setDeviceState(serialNumber, 'open', 'door_state')
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function setDeviceState() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account._setDeviceState(serialNumber, 'open', 'door_state');
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful:
```js
{
  "code": "OK"
}
```

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if arguments are not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `DEVICE_NOT_FOUND`
* `DEVICE_STATE_NOT_FOUND`

### _executeServiceRequest(_config)

Execute a myQ service request.

This is meant for internal use, but this is exposed in case one wants to send arbitrary requests to the myQ service.

Default values for header fields are used if they are not explicitly specified. Specify null for such fields in order to avoid sending them as part of the request. In particular, the SecurityToken field is set to the cached security token by default if it is not explicitly specified. If the SecurityToken field is not specified and the security token is not cached, an error is thrown. Specify a null SecurityToken in order to avoid sending it as part of the request and prevent the error from being thrown.

| Parameter | Required | Type   | Details                                                       |
|-----------|----------|--------|---------------------------------------------------------------|
| _config   | yes      | object | [axios config](https://github.com/axios/axios#request-config) |

```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password)
  .then(function(result) {
    return account._executeServiceRequest({
      baseURL: constants._baseUrls.auth,
      url: constants._routes.login,
      method: 'post',
      headers: {
        SecurityToken: null,
      },
      data: {
        Username: email,
        Password: password,
      },
    })
  }).then(function (result) {
    console.log(result);
  }).catch(function (error) {
    console.error(error);
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function executeServiceRequest() {
  try {
    const account = new MyQ();
    await account.login(email, password);
    const result = await account._executeServiceRequest({
      baseURL: constants._baseUrls.auth,
      url: constants._routes.login,
      method: 'post',
      headers: {
        SecurityToken: null,
      },
      data: {
        Username: email,
        Password: password,
      },
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
```

Returned object if call is successful: [axios response](https://github.com/axios/axios#response-schema).

For robust error handling, catch and handle the following errors:
* `INVALID_ARGUMENT` (if argument is not sufficiently validated beforehand)
* `LOGIN_REQUIRED`
* `SERVICE_REQUEST_FAILED`
* `SERVICE_UNREACHABLE`
* `INVALID_SERVICE_RESPONSE`
* `AUTHENTICATION_FAILED`
* `AUTHENTICATION_FAILED_ONE_TRY_LEFT`
* `AUTHENTICATION_FAILED_LOCKED_OUT`
* `DEVICE_NOT_FOUND`

## Error handling

An error returned from the API will include a code as well as an error message if applicable.

| Possible error codes                         | Explanation
|----------------------------------------------|-----------------------------------------------------------------------------------|
| `ERR_MYQ_INVALID_ARGUMENT`                   | Argument is unspecified or invalid.                                               |
| `ERR_MYQ_LOGIN_REQUIRED`                     | login() has not been called yet or security token has expired.                    |
| `ERR_MYQ_AUTHENTICATION_FAILED`              | Authentication attempt failed.                                                    |
| `ERR_MYQ_AUTHENTICATION_FAILED_ONE_TRY_LEFT` | Authentication attempt failed, one try left before user is locked out.            |
| `ERR_MYQ_AUTHENTICATION_FAILED_LOCKED_OUT`   | Authentication attempt failed, account is locked out. Password needs to be reset. |
| `ERR_MYQ_DEVICE_NOT_FOUND`                   | Specified device not found.                                                       |
| `ERR_MYQ_DEVICE_STATE_NOT_FOUND`             | Specified state attribute not found on device.                                    |
| `ERR_MYQ_INVALID_DEVICE`                     | Action cannot be done on device.                                                  |
| `ERR_MYQ_SERVICE_REQUEST_FAILED`             | Service request could not be set up or sent.                                      |
| `ERR_MYQ_SERVICE_UNREACHABLE`                | Service cannot be reached at this time.                                           |
| `ERR_MYQ_INVALID_SERVICE_RESPONSE`           | Invalid response received from service.                                           |

Returned object if a call is unsuccessful:
```js
{
  code: <errorCode>,
  message: <errorMessage>
}
```

Since the underlying myQ API is volatile, there might be changes unforeseen by the current version of this software. If you encounter an unexpected error, please create a [GitHub issue](https://github.com/thomasmunduchira/myq-api/issues).

NOTE: It is recommended that error codes are checked against the provided constants (`MyQ.constants.codes`) instead of hardcoded raw strings.

Example:
```js
const MyQ = require('myq-api');

const account = new MyQ();
account.login(email, password) // assuming parameters are valid here, otherwise INVALID_ARGUMENT can be thrown as well
  .then(function (result) {
    console.log(result);
  }).catch(function (error) {
    if (error.code === MyQ.constants.codes.SERVICE_REQUEST_FAILED) {
      // handle client-side errors when setting up service request
    } else if ([MyQ.constants.codes.SERVICE_UNREACHABLE, MyQ.constants.codes.INVALID_SERVICE_RESPONSE].contains(error.code)) {
      // handle service errors
    } else if (error.code === MyQ.constants.codes.AUTHENTICATION_FAILED) {
      // handle failed authentication
    } else if (error.code === MyQ.constants.codes.AUTHENTICATION_FAILED_ONE_TRY_LEFT) {
      // handle failed authentication, one try left
    } else if (error.code === MyQ.constants.codes.AUTHENTICATION_FAILED_LOCKED_OUT) {
      // handle failed authentication, user locked out
    }
  });
```

async/await example:
```js
const MyQ = require('myq-api');

async function login() {
  try {
    const account = new MyQ();
    const result = await account.login(email, password); // assuming parameters are valid here, otherwise INVALID_ARGUMENT can be thrown as well
    console.log(result);
  } catch (error) {
    if (error.code === MyQ.constants.codes.SERVICE_REQUEST_FAILED) {
      // handle client-side errors when setting up service request
    } else if ([MyQ.constants.codes.SERVICE_UNREACHABLE, MyQ.constants.codes.INVALID_SERVICE_RESPONSE].contains(error.code)) {
      // handle service errors
    } else if (error.code === MyQ.constants.codes.AUTHENTICATION_FAILED) {
      // handle failed authentication
    } else if (error.code === MyQ.constants.codes.AUTHENTICATION_FAILED_ONE_TRY_LEFT) {
      // handle failed authentication, one try left
    } else if (error.code === MyQ.constants.codes.AUTHENTICATION_FAILED_LOCKED_OUT) {
      // handle failed authentication, user locked out
    }
  }
}
```

## Debugging
The [debug](https://www.npmjs.com/package/debug) module has been integrated to log service calls via [axios-debug-log](https://www.npmjs.com/package/axios-debug-log). Simply [set the DEBUG environment variable](https://github.com/visionmedia/debug#usage) to `myq-api` to get detailed logs of service requests, responses, and errors. This is especially helpful if you are running into unexpected errors and want to dig deeper.

## License

[MIT](https://github.com/thomasmunduchira/myq-api/blob/master/LICENSE)
