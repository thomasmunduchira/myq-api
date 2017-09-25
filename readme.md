# myq-api

Interface with your [MyQ](https://www.liftmaster.com/for-homes/myq-connected-home) devices. Works and tested with both Chamberlain and LiftMaster.

## Installation

```bash
yarn add myq-api   or   npm install myq-api
```

## Usage Overview

### new MyQ(email, password)

Initialize credentials of the user using email and password.

| Parameters | Required | Type   | Details         |
|------------|----------|--------|-----------------|
| email      | true     | String | User email      |
| password   | true     | String | User password   |

Example code:
```js
var MyQ = require('myq-api');
var account = new MyQ('email', 'password');
```

### account.login()

Logs into the MyQ account and generates a security token. This security token must be generated before you access the rest of this API. Note that this security token is short-term and will not work after some time.

Example code:
```js
account.login()
  .then(function (result) {
    console.log(result);
  }).catch(function (err) {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0,
  "token": "2sdf99a10-3190zdsv13-nn13"
}
```

### account.getDevices(typeIds)

Returns devices on the account.

| Parameter | Required | Type    | Details |
|-----------|----------|---------|---------|
| typeIds   | true     | Type ID | Either an array of Type IDs or a singular Type ID. See Possible Values for more info |

Example code:
```js
account.getDevices([3, 15, 17])
  .then(function (result) {
    console.log(result);
  }).catch(function (err) {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0,
  "devices": [
    {
      "id": 481404100,
      "typeId": 3,
      "typeName": "LampModule",
      "serialNumber": "DAIIOW14411AW",
      "online": true,
      "name": "Light",
      "lightState": 0,
      "lightStateDescription": "off"
      "lightStateUpdated": 1501609106061
    },
    {
      "id": 2323893289,
      "typeId": 15,
      "typeName": "Gateway WGDO AC",
      "serialNumber": "DS4613424DJJS",
      "online": true,
      "name": "Home"
    },
    {
      "id": 1631093013,
      "typeId": 17,
      "typeName": "Garage Door Opener WGDO",
      "serialNumber": "DS4l424DJJS",
      "online": true,
      "name": "Garage",
      "doorState": 1,
      "doorStateDescription": "open"
      "doorStateUpdated": 1501609106061
    }
  ]
}
```

### account.getDoorState(id)

Retrieves the latest state of the requested door.

| Parameter | Required | Type    | Details |
|-----------|----------|---------|---------|
| id        | true     | Integer | Door ID |

Example code:
```js
account.getDoorState(door.id)
  .then(function (result) {
    console.log(result);
  }).catch(function (err) {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0,
  "doorState": 2, // See Possible Values
  "doorStateDescription": "closed"
}
```

### account.getLightState(id)

Retrieves the latest state of the requested light.

| Parameter | Required | Type    | Details  |
|-----------|----------|---------|----------|
| id        | true     | Integer | Light ID |

Example code:
```js
account.getLightState(light.id)
  .then(function (result) {
    console.log(result);
  }).catch(function (err) {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0,
  "lightState": 1, // See Possible Values
  "lightStateDescription": "on"
}
```

### account.setDoorState(id, toggle)

Set the requested door to open or close. Returns a confirmation once complete. Note that the door might not be opened or closed fully by the time this function returns.

| Parameter | Required | Type        | Details                           |
|-----------|----------|-------------|-----------------------------------|
| id        | true     | Integer     | Door ID                           |
| toggle    | true     | Door Toggle | See Possible Values for more info |

Example code:
```js
account.setDoorState(door.id, 1)
  .then(function (result) {
    console.log(result);
  }).catch(function (err) {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0
}
```

### account.setLightState(id, toggle)

Set the requested light to on or off. Returns a confirmation once complete.

| Parameter | Required | Type         | Details                           |
|-----------|----------|--------------|-----------------------------------|
| id        | true     | Integer      | Light ID                          |
| toggle    | true     | Light Toggle | See Possible Values for more info |

Example code:
```js
account.setLightState(light.id, 1)
  .then(function (result) {
    console.log(result);
  }).catch(function (err) {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0
}
```

## Possible Values

| Type ID | Description                    |
|---------|--------------------------------|
| 1       | Gateway                        |
| 2       | GDO                            |
| 3       | Light                          |
| 5       | Gate                           |
| 7       | VGDO Garage Door               |
| 9       | Commercial Door Operator (CDO) |
| 13      | Camera                         |
| 15      | WGDO Gateway AC                |
| 16      | WGDO Gateway DC                |
| 17      | WGDO Garage Door               |

| Door Toggle | Description |
|-------------|-------------|
| 0           | close door  |
| 1           | open door   |

| doorState | Description           |
|-----------|-----------------------|
| 1         | open                  |
| 2         | closed                |
| 3         | stopped in the middle |
| 4         | going up              |
| 5         | going down            |
| 9         | not closed            |

| Light Toggle | Description    |
|--------------|----------------|
| 0            | turn off light |
| 1            | turn on light  |

| lightState   | Description |
|--------------|-------------|
| 0            | off         |
| 1            | on          |

## Return Codes

Each call to the API will include a return code as well as an error message if applicable. The return codes as well their correlated messages have been listed here for convenience.

| Return Code | Message                                                                         |
|-------------|---------------------------------------------------------------------------------|
| 0           | Successful!                                                                     |
| 11          | Something unexpected happened. Please wait a bit and try again.                 |
| 12          | MyQ service is currently down. Please wait a bit and try again.                 |
| 13          | Not logged in.                                                                  |
| 14          | Email and/or password are incorrect.                                            |
| 15          | Invalid parameter(s) provided.                                                  |
| 16          | User will be locked out due to too many tries. 1 try left.                      |
| 17          | User is locked out due to too many tries. Please reset password and try again.  |

Example returned object if call is unsuccessful:
```js
{
  returnCode: 14,
  message: "Email and/or password are incorrect."
}
```

Since the underlying MyQ API is volatile, there might be changes unforeseen by the current version of this software. An extra message detailing the request error that it encountered will be returned whenever possible.
```js
{
  returnCode: 11,
  message: "Something unexpected happened. Please wait a bit and try again."
  unhandledError: // request error
}
```
Please create a GitHub issue when this happens.

## Promises

This API depends on a native ES6 Promise implementation to be [supported](http://caniuse.com/promises).
If your environment doesn't support ES6 Promises, you can [polyfill](https://github.com/jakearchibald/es6-promise).

## Contributing

If you would like to contribute enhancements or fixes, please do the following:
1. Fork the repository and clone it locally.
2. Make your changes.
3. Create a pull request.

## Author

[Thomas Munduchira](https://thomasmunduchira.com/) ([thomas@thomasmunduchira.com](mailto:thomas@thomasmunduchira.com))

## Original Author

[Chad Smith](http://twitter.com/chadsmith) ([chad@nospam.me](mailto:chad@nospam.me))

## License

[MIT](https://github.com/thomasmunduchira/myq-api/blob/master/LICENSE)
