# node-liftmaster

Control your [LiftMaster MyQ](http://www.liftmaster.com/lmcv2/connectedhome.htm) garage door openers.

## Installation

npm install liftmaster

## Usage overview

### new MyQ(email, password)

    var MyQ = require('liftmaster'),
      garageDoor = new MyQ('chad@developer.email', 'correct horse battery staple');

### garageDoor.login(callback)


Logs in to your MyLiftMaster account and returns a security token

    garageDoor.login(function(err, res) {
      if(err) throw err;
      console.log(res);

### garageDoor.getDevices(callback)

Returns an array of garage door devices on the account.

      garageDoor.getDevices(function(err, devices) {
        if(err) throw err;
        
        devices.forEach(function(device) {
          console.log(device.name, device);
      });

### garageDoor.getDoorState(id, callback)

Retrieves the latest state of the requested door.

      var device = garageDoor.devices[0];
      garageDoor.getDoorState(device.id, function(err, device) {
        if(err) throw err;
        console.log(device);
      });

### garageDoor.setDoorState(id, state, callback)

Set the requested door to open or close. Returns an updated state once complete.

Known door states: 1 = open, 2 = closed, 4 = opening, 5 = closing

      garageDoor.setDoorState(device.id, 1, function(err, device) {
        if(err) throw err;
        console.log(device);
      });

## TODO

See the [issue tracker](http://github.com/chadsmith/node-liftmaster/issues) for more.

## Author

[Chad Smith](http://twitter.com/chadsmith) ([chad@nospam.me](mailto:chad@nospam.me)).

## License

This project is [UNLICENSED](http://unlicense.org/) and not endorsed by or affiliated with [LiftMaster](http://www.liftmaster.com/).