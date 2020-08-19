const { myQ, constants } = require('myq-api');

var account = new myQ('email', 'password');

var delay = function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

var device = {};
console.log('Logging in.');
account.login()
  .then(function (result) {
    console.log('Login result:', result);
    if (result.returnCode !== 0) {
      throw new Error('Login unsuccessful.');
    }
    console.log(`\nGetting all devices on account`);
    return account.getDevices();
  })
  .then(result => {
    console.log('Get Devices result: ', result);
    if (result.returnCode !== 0) {
      throw new Error('Failed to find devices.');
    }

    console.log(result);
    const desiredDeviceName = 'Garage Door Opener';
    device = result.devices.find(device => device.name === desiredDeviceName);
    if (!device) {
      throw new Error(`\nCould not find device with name: ${desiredDeviceName}`);
    }

    return account.setDoorOpen(device.serialNumber, false)
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
    return account.getDoorState(device.serialNumber);
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

