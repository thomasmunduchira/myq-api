# myq-api

Interface with your [MyQ](https://www.liftmaster.com/for-homes/myq-connected-home?gclid=CjwKCAjw2NvLBRAjEiwAF98GMePqZknk7-vCeYlvOITPCbuuhbUBgB8XqIF61GsimwJAmjQHIZvgLRoCgSMQAvD_BwE&gclsrc=aw.ds) devices.

This is an updated API forked from [this repository](https://github.com/chadsmith/node-liftmaster). This module uses ES6 syntax and promises.

Pull requests welcome!

## Installation

```bash
npm install myq-api --save
```

or 

```bash
yarn add myq-api
```

## Usage Overview

### new MyQ(email, password)

Initialize credentials of the user.

| Parameters | Required | Type   | Details         |
|------------|----------|--------|-----------------|
| email      | true     | String | User email      |
| password   | true     | String | User password   |

Example code:
```js
const MyQ = require('myq-api');
const account = new MyQ('email', 'password');
```

### account.login()

Logs into your MyQ account and returns your account security token. Running this function is a prerequisite to running other functions that make up this API.

Example code:
```js
account.login()
  .then((result) => {

  }).catch((err) => {
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
  .then((result) => {

  }).catch((err) => {
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
      "lightState": 2,
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
      "doorState": 2,
      "doorStateUpdated": 1501609106061
    }
  ]
}
```

### account.getDoorState(id)

Retrieves the latest state of the requested door.

| Parameter | Required | Type    | Details |
|-----------|----------|---------|---------|
| id        | true     | Integer | Door id |

Example code:
```js
account.getDoorState(door.id)
  .then((result) => {

  }).catch((err) => {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0,
  "doorState": doorState // See Possible Values
}
```

### account.getLightState(id)

Retrieves the latest state of the requested light.

| Parameter | Required | Type    | Details  |
|-----------|----------|---------|----------|
| id        | true     | Integer | Light id |

Example code:
```js
account.getLightState(light.id)
  .then((result) => {

  }).catch((err) => {
    console.error(err);
  });
```

Example returned object if call is successful:
```js
{
  "returnCode": 0,
  "lightState": lightState // See Possible Values
}
```

### account.setDoorState(id, toggle)

Set the requested door to open or close. Returns a confirmation once complete. Note that the door might not be opened or closed fully by the time this function returns.

| Parameter | Required | Type        | Details                           |
|-----------|----------|-------------|-----------------------------------|
| id        | true     | Integer     | Door id                           |
| toggle    | true     | Door Toggle | See Possible Values for more info |

Example code:
```js
account.setDoorState(door.id, 1)
  .then((result) => {

  }).catch((err) => {
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
| id        | true     | Integer      | Light id                          |
| toggle    | true     | Light Toggle | See Possible Values for more info |

Example code:
```js
account.setLightState(light.id, 1)
  .then((result) => {

  }).catch((err) => {
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

| Type ID | Meaning                        |
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

| Door Toggle | Meaning    |
|-------------|------------|
| 0           | close door |
| 1           | open door  |

| doorState | Meaning               |
|-----------|-----------------------|
| 1         | open                  |
| 2         | closed                |
| 3         | stopped in the middle |
| 4         | going up              |
| 5         | going down            |
| 9         | not closed            |

| Light Toggle | Meaning        |
|--------------|----------------|
| 0            | turn off light |
| 1            | turn on light  |

| lightState   | Meaning |
|--------------|---------|
| 0            | off     |
| 1            | on      |

## Return Codes

Each call to the API will include a return code as well as an error message if applicable. The return codes as well their correlated messages have been listed here for convenience.

| Return Code | Message                                                         |
|-------------|-----------------------------------------------------------------|
| 0           | Successful!                                                     |
| 11          | Something unexpected happened. Please wait a bit and try again. |
| 12          | MyQ service is currently down. Please wait a bit and try again. |
| 13          | Not logged in.                                                  |
| 14          | Email and/or password are incorrect.                            |
| 15          | Invalid parameter provided.                                     |
| 16          | User is locked out due to too many tries. Please go to the MyQ website and click "Forgot Password" to reset the password and gain access to the account. Note that it might take a while before being able to login through this application again - this error might keep popping up despite having unlocked the account. |

Example returned object if call is unsuccessful:
```js
{
  returnCode: 14,
  error: "Email and/or password are incorrect."
}
```

## TODO

See the [issue tracker](http://github.com/thomasmunduchira/node-liftmaster/issues) for more.

## Author

[Thomas Munduchira]() ([thomas@thomasmunduchira.com](mailto:thomas@thomasmunduchira.com))

## Original Author

[Chad Smith](http://twitter.com/chadsmith) ([chad@nospam.me](mailto:chad@nospam.me))

## License

This project is [UNLICENSED](http://unlicense.org/) and not endorsed by or affiliated with [Chamberlain](https://www.chamberlain.com/) or [LiftMaster](https://www.liftmaster.com/).
