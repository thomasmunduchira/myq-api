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

Logs into your LiftMaster account and returns your account security token. This token is saved internally so you don't have to use this token or pass it back in any way. Running this function is a prerequisite to running all other functions that make up this API.

```js
garageDoor.login()
  .then((token) => {

  }).catch((err) => {
    console.log(err);
  });
```

### garageDoor.getDoors()

Returns an array of garage doors on the account.

```js
garageDoor.getDoors()
  .then((doors) => {

  }).catch((err) => {
    console.log(err);
  });
```

### garageDoor.getDoorState(id)

Retrieves the latest state of the requested door.

Door states: 1 = open, 2 = closed, 3 = stopped, 4 = opening, 5 = closing.

```js
const door = garageDoor.doors[0];
garageDoor.getDoorState(door.id)
  .then((state) => {

  }).catch((err) => {
    console.log(err);
  });
```

### garageDoor.setDoorState(id, toggle)

Set the requested door to open or close. Returns an updated state once complete.

Toggles: 0 = close, 1 = open

Door states: 1 = open, 2 = closed, 3 = stopped, 4 = opening, 5 = closing.

```js
const door = garageDoor.doors[0];
garageDoor.setDoorState(door.id, 1)
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
