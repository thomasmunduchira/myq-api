const MyQ = require('liftmaster-api');
const garageDoor = new MyQ('email', 'password');

// log in to MyQ
garageDoor.login()
   // get all garage door devices
  .then((response) => garageDoor.getDevices()
  ).then((devices) => {
    // log each door state
    devices.forEach((device) => {
      console.log(device.name, doorStates[device.state]);
    });
    return devices;
  // get the state of a single door
  }).then((devices) => garageDoor.getDoorState(devices[0].id)
  // print out state
  ).then((state) => {
    console.log(state);
  }).catch((err) => {
    throw err;
  });
