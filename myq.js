// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js

const request = require('request-promise-native');

const endpoint = 'https://myqexternal.myqdevice.com';
const appId = 'NWknvuBd7LoFHfXmKNMBcgajXtZEgKUh4V7WNzMidrpUUluDpVYVZx+xT4PCM5Kx';
const garageDoorIds = [2, 5, 7, 17];
const errors = {
  11: 'Something unexpected happened. Please wait a bit and try again',
  12: 'MyQ service is currently down. Please wait a bit and try again.',
  13: 'User not logged in.',
  14: 'User credentials are not valid.',
  15: 'Toggle provided is not 0 or 1.'
};

const returnError = (returnCode) {
  const result = {
    returnCode,
    error: errors[returnCode]
  }
  return result;
}

class MyQ {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  };

  login() {
    return request({
      method: 'POST',
      uri: endpoint + '/api/v4/User/Validate',
      headers: {
        MyQApplicationId: appId
      },
      body: {
        username: this.username,
        password: this.password
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12);
      }
      if (response.SecurityToken) {
        this.securityToken = response.SecurityToken;
        const result = {
          returnCode: 0,
          token: response.SecurityToken
        };
        return result;
      } else {
        returnError(14);
      }
    }).catch((err) => {
      console.error(err);
      return returnError(11);
    });
  };

  getDoors() {
    if (!this.securityToken) {
      return returnError(13);
    }

    return request({
      method: 'GET',
      uri: endpoint + '/api/v4/userdevicedetails/get',
      qs: {
        appId: appId,
        SecurityToken: this.securityToken
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12);
      }
      const doors = [];
      for (let device of response.Devices) {
        if (garageDoorIds.includes(device.MyQDeviceTypeId)) {
          const door = {
            id: device.MyQDeviceId,
            type: device.MyQDeviceTypeName
          };
          for (let attribute of device.Attributes) {
            if (attribute.AttributeDisplayName === 'desc') {
              door.name = attribute.Value;
            }
            if (attribute.AttributeDisplayName === 'doorstate') {
              door.state = attribute.Value;
              door.updated = attribute.UpdatedTime;
            }
          }
          doors.push(door);
        }
      }
      const result = {
        returnCode: 0,
        doors
      };
      return result;
    }).catch((err) => {
      console.error(err);
      return returnError(11);
    });
  };

  getDoorState(doorId) {
    if (!this.securityToken) {
      return returnError(13);
    }

    return request({
      method: 'GET',
      uri: endpoint + '/api/v4/deviceattribute/getdeviceattribute',
      qs: {
        appId: appId,
        SecurityToken: this.securityToken,
        MyQDeviceId: doorId,
        AttributeName: 'doorstate'
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12);
      }
      const state = parseInt(response.AttributeValue);
      const result = {
        returnCode: 0,
        state
      };
      return result;
    }).catch((err) => {
      console.error(err);
      return returnError(11);
    });
  };

  setDoorState(doorId, toggle) {
    if (!this.securityToken) {
      return returnError(13);
    }

    let newState;
    if (toggle == 0) {
      newState = 2;
    } else if (toggle == 1) {
      newState = 1;
    } else {
      return returnError(15);
    }

    return request({
      method: 'PUT',
      uri: endpoint + '/api/v4/deviceattribute/putdeviceattribute',
      headers: {
        MyQApplicationId: appId,
        securityToken: this.securityToken
      },
      body: {
        MyQDeviceId: doorId,
        AttributeName: 'desireddoorstate',
        AttributeValue: toggle
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12);
      }
      const result = {
        returnCode: 0
      };
      return result;
    }).catch((err) => {
      console.error(err);
      return returnError(11);
    });
  };

  _loopDoorState(doorId, newState) {
    return this.getDoorState(doorId)
      .then((result) => {
        if (result.returnCode === 0) {
          if (result.state === newState) {
            return result;
          } else {
            setTimeout(() => {
              return this._loopDoorState(doorId, newState);
            }, 2500);
          }
        } else {
          return result;
        }
      }).catch((err) => {
        throw err;
      });
  };
};

module.exports = MyQ;
