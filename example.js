var
  MyQ = require('liftmaster'),
  garageDoor = new MyQ('chad@developer.email', 'correct horse battery staple'),
  doorStates = {
    '1': 'open',
    '2': 'closed',
    '4': 'opening',
    '5': 'closing'
  };

// log in to MyQ
garageDoor.login(function(err, res) {
  if(err) throw err;

  // get all garage door devices
  garageDoor.getDevices(function(err, devices) {
    if(err) throw err;

    // log each door state
    devices.forEach(function(device) {
      console.log(device.name, doorStates[device.state]);
    });

    // get the status of a single door
    var device = devices[0];
    garageDoor.getDoorState(device.id, function(err, device) {
      if(err) throw err;
      console.log(device);
    });

    // open that door
    garageDoor.setDoorState(device.id, 1, function(err, device) {
      if(err) throw err;
      console.log(device);
    });
  });
});
