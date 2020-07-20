const MyQ = require('myq-api');

const EMAIL = '<EMAIL>';
const PASSWORD = '<PASSWORD>';

async function main() {
  const account = new MyQ();

  try {
    console.log('Logging in.');
    const loginResult = await account.login(EMAIL, PASSWORD);
    console.log('Login result:');
    console.log(JSON.stringify(loginResult, null, 2));
    console.log(`Short-lived security token: '${loginResult.securityToken}'`);

    console.log(`\nGetting all devices on account`);
    const getDevicesResult = await account.getDevices();
    console.log('getDevices result:');
    console.log(JSON.stringify(getDevicesResult, null, 2));

    const { devices } = getDevicesResult;
    if (devices.length === 0) {
      throw Error('No devices found!');
    }
    console.log('Devices:');
    devices.forEach((device, index) => {
      console.log(
        `Device ${index} - Name: '${device.name}', Serial Number: '${device.serial_number}'`
      );
    });

    const door = devices.find(
      (device) => device.state && MyQ.constants._stateAttributes.doorState in device.state
    );
    if (!door) {
      throw Error('No doors found!');
    }

    console.log(`\nClosing door '${door.name}'`);
    const setDoorStateResult = await account.setDoorState(
      door.serial_number,
      MyQ.actions.door.CLOSE
    );
    console.log('setDoorStateResult:');
    console.log(JSON.stringify(setDoorStateResult, null, 2));

    console.log('Waiting 5 seconds before polling state again');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log(`\nGetting state of door '${door.name}'`);
    const getDoorStateResult = await account.getDoorState(door.serial_number);
    console.log('getDoorState result:');
    console.log(JSON.stringify(getDoorStateResult, null, 2));
    console.log(`State of door '${door.name}': ${getDoorStateResult.deviceState}`);
  } catch (error) {
    console.error('Error received:');
    console.error(error);
    console.error(`Error code: ${error.code}`);
    console.error(`Error message: ${error.message}`);
  }
}

main();
