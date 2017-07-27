// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js

const request = require('request-promise-native');

const endpoint = 'https://myqexternal.myqdevice.com';
const appId = 'NWknvuBd7LoFHfXmKNMBcgajXtZEgKUh4V7WNzMidrpUUluDpVYVZx+xT4PCM5Kx';
const garageDoorIds = [2, 5, 7, 17];

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
        const result = {
          returnCode: 14,
          error: "Something went wrong. Please try again later!"
        };
        return result;
      }
      const result = {
        returnCode: response.SecurityToken ? 0 : 13
      };
      if (result.returnCode === 0) {
        this.securityToken = response.SecurityToken;
        result.token = this.securityToken;
      } else {
        result.error = response.ErrorMessage;
      }
      return result;
    }).catch((err) => {
      console.log(err);
      const result = {
        returnCode: 14,
        error: "Something went wrong. Please try again later!"
      };
      return result;
    });
  };

  getDoors() {
    if (!this.securityToken) {
      const result = {
        returnCode: 11,
        error: "Not logged in."
      };
      return result;
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
        const result = {
          returnCode: 14,
          error: "Something went wrong. Please try again later!"
        };
        return result;
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
      console.log(err);
      const result = {
        returnCode: 14,
        error: "Something went wrong. Please try again later!"
      };
      return result;
    });
  };

  getDoorState(doorId) {
    if (!this.securityToken) {
      const result = {
        returnCode: 11,
        error: "Not logged in."
      };
      return result;
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
        const result = {
          returnCode: 14,
          error: "Something went wrong. Please try again later!"
        };
        return result;
      }
      const state = parseInt(response.AttributeValue);
      const result = {
        returnCode: 0,
        state
      };
      return result;
    }).catch((err) => {
      console.log(err);
      const result = {
        returnCode: 14,
        error: "Something went wrong. Please try again later!"
      };
      return result;
    });
  };

  setDoorState(doorId, toggle) {
    if (!this.securityToken) {
      const result = {
        returnCode: 11,
        error: "Not logged in."
      };
      return result;
    }

    let newState;
    if (toggle == 0) {
      newState = 2;
    } else if (toggle == 1) {
      newState = 1;
    } else {
      const result = {
        returnCode: 12,
        error: "Toggle has to be either 0 or 1."
      };
      return result;
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
        const result = {
          returnCode: 14,
          error: "Something went wrong. Please try again later!"
        };
        return result;
      }
      const result = {
        returnCode: 0
      };
      return result;
    }).catch((err) => {
      console.log(err);
      const result = {
        returnCode: 14,
        error: "Something went wrong. Please try again later!"
      };
      return result;
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
