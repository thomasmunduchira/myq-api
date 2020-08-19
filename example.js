const { myQ, constants } = require('myq-api');

var account = new myQ('email', 'password');

var delay = function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

var data = {};
console.log('Logging in.');
account.login()
  .then(function (result) {
    console.log('Login result:', result);
    if (result.returnCode !== 0) {
      throw new Error('Login unsuccessful.');
    }
    const deviceType = constants.allDeviceTypes.wifiGarageDoorOpener;
    console.log(`\nGetting all ${deviceType} devices on account (check README for all possible types)`);
    return account.getDevices(deviceType);
  })
  .then(result => {
    console.log('Get Devices result: ', result);
    if (result.returnCode !== 0) {
      throw new Error('Failed to find devices.');
    }

    console.log(result);
    const desiredDeviceName = 'Garage Door Opener';
    const device = result.devices.find(device => device.name === desiredDeviceName);
    if (!device) {
      throw new Error(`\nCould not find device with name: ${desiredDeviceName}`);
    }

    return account.setDoorOpen(device.serialNumber, false)
  })
  .then(function (result) {
    console.log('getDevices result:', result);
    if (result.returnCode !== 0) {
      throw new Error('getDevices unsuccessful!');
    }

    var doors = result.devices;
    if (doors.length === 0) {
      throw new Error('No doors found!');
    }
    console.log('Devices:');
    for (var i = 0; i < doors.length; i += 1) {
      var door = doors[i];
      console.log('Name: ' + door.name + ', State: ' + door.doorState);
    }
    return doors;
  })
  .then(function (doors) {
    data.doors = doors;
    console.log('\nClosing first door');
    return account.setDoorOpen(doors[0].serialNumber, false);
  })
  .then(function (result) {
    console.log('setDoorOpen result:', result);
    if (result.returnCode !== 0) {
      throw new Error('setDoorOpen unsuccessful!');
    }
  })
  .then(function () {
    console.log('\nWaiting five seconds before polling state again');
    return delay(5000);
  })
  .then(function () {
    console.log('\nGetting state of first door');
    return account.getDoorState(data.doors[0].serialNumber);
  })
  .then(function (result) {
    console.log('getDoorState result:', result);
    if (result.returnCode !== 0) {
      throw new Error('getDoorState unsuccessful!');
    }

    console.log('State: ' + result.doorState);
  })
  .catch(function (err) {
    console.error(err);
  });

