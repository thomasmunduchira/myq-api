const MyQ = require('myq-api');

const account = new MyQ('email', 'password');

const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

const data = {};
console.log('Logging in');
account
  .login()
  .then(result => {
    console.log('login result:', result);
    if (result.returnCode !== 0) {
      throw new Error('login unsuccessful!');
    }
    console.log(
      'Getting devices/doors of type 5, 7, and 17 on account (check README for all possible types)'
    );
    return account.getDevices([5, 7, 17]);
  })
  .then(result => {
    console.log('getDevices result:', result);
    if (result.returnCode !== 0) {
      throw new Error('getDevices unsuccessful!');
    }

    const doors = result.devices;
    if (doors.length === 0) {
      throw new Error('No doors found!');
    }
    console.log('Devices:');
    for (let i = 0; i < doors.length; i += 1) {
      const door = doors[i];
      console.log(`Name: ${door.name}, State: ${door.doorState}`);
    }
    return doors;
  })
  .then(doors => {
    data.doors = doors;
    console.log('Closing first door');
    return account.setDoorState(doors[0].id, 0);
  })
  .then(result => {
    console.log('setDoorState result:', result);
    if (result.returnCode !== 0) {
      throw new Error('setDoorState unsuccessful!');
    }
  })
  .then(() => {
    console.log('Waiting five seconds before polling state again');
    return delay(5000);
  })
  .then(() => {
    console.log('Getting state of first door');
    return account.getDoorState(data.doors[0].id);
  })
  .then(result => {
    console.log('getDoorState result:', result);
    if (result.returnCode !== 0) {
      throw new Error('getDoorState unsuccessful!');
    }

    console.log(`State: ${result.doorState}`);
  })
  .catch(err => {
    console.error(err);
  });
