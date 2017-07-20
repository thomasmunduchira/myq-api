# node-liftmaster

Interface with your [LiftMaster MyQ](http://www.liftmaster.com/lmcv2/connectedhome.htm) garage doors.

This is an updated API forked from [this repository](https://github.com/chadsmith/node-liftmaster). This module uses ES6 syntax and promises.

## Installation

```bash
npm install liftmaster-api --save
```

or 

```bash
yarn add liftmaster-api
```

## Usage Overview

### new MyQ(email, password)

```js
const MyQ = require('liftmaster-api');
const garageDoor = new MyQ('email', 'password');
```

### garageDoor.login()

Logs into your LiftMaster account and returns your account security token.

```js
garageDoor.login()
  .then((token) => {

  }).catch((err) => {
    console.log(err);
  });
```

### garageDoor.getDevices()

Returns an array of garage door devices on the account.

```js
garageDoor.getDevices()
  .then((devices) => {

  }).catch((err) => {
    console.log(err);
  });
```

### garageDoor.getDoorState(id)

Retrieves the latest state of the requested door.

```js
const device = garageDoor.devices[0];
garageDoor.getDoorState(device.id)
  .then((state) => {

  }).catch((err) => {
    console.log(err);
  });
```

### garageDoor.setDoorState(id, state)

Set the requested door to open or close. Returns an updated state once complete.

Known door states: 1 = open, 2 = closed, 4 = opening, 5 = closing.

```js
const device = garageDoor.devices[0];
garageDoor.setDoorState(device.id, 1)
  .then((state) => {

  }).catch((err) => {
    console.log(err);
  });
```

## TODO

See the [issue tracker](http://github.com/thomasmunduchira/node-liftmaster/issues) for more.

## Author

[Thomas Munduchira]() ([thomas@thomasmunduchira.com](mailto:thomas@thomasmunduchira.com))

## Original Author

Special thanks to:
[Chad Smith](http://twitter.com/chadsmith) ([chad@nospam.me](mailto:chad@nospam.me)).

## License

This project is [UNLICENSED](http://unlicense.org/) and not endorsed by or affiliated with [LiftMaster](http://www.liftmaster.com/).
