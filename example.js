var MyQ = require('myq-api');

var account = new MyQ('email', 'password');

var delay = function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

var data = {};
console.log('Logging in');
account.login()
  .then(function (result) {
    console.log('login result:', result);
    if (result.returnCode !== 0) {
      throw new Error('login unsuccessful!');
    }
    console.log('\nGetting devices/doors of type 5, 7, and 17 on account (check README for all possible types)');
    return account.getDevices([5, 7, 17]);
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
    return account.setDoorState(doors[0].id, 0);
  })
  .then(function (result) {
    console.log('setDoorState result:', result);
    if (result.returnCode !== 0) {
      throw new Error('setDoorState unsuccessful!');
    }
  })
  .then(function () {
    console.log('\nWaiting five seconds before polling state again');
    return delay(5000);
  })
  .then(function () {
    console.log('\nGetting state of first door');
    return account.getDoorState(data.doors[0].id);
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
