const MyQ = require('myq-api');
const garageDoor = new MyQ('email', 'password');

// log in to MyQ
garageDoor.login()
   // get all garage door devices
  .then((response) => garageDoor.getDoors()
  ).then((doors) => {
    // log each door state
    doors.forEach((door) => {
      console.log(door.name, door.state);
    });
    return doors;
  // get the state of a single door
  }).then((doors) => garageDoor.getDoorState(doors[0].id)
  // print out state
  ).then((state) => {
    console.log(state);
  }).catch((err) => {
    throw err;
  });
