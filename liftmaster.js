// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js

const request = require('request-promise-native');

class MyQ {
  constructor(username, password) {
    this.userAgent = 'Chamberlain/3.73';
    this.brandId = '2';
    this.apiVersion = '4.1';
    this.culture = "en";
    this.endpoint = 'https://myqexternal.myqdevice.com';
    this.appId = 'NWknvuBd7LoFHfXmKNMBcgajXtZEgKUh4V7WNzMidrpUUluDpVYVZx+xT4PCM5Kx';
    this.garageDoorIds = [2, 5, 7, 17];
    this.username = username;
    this.password = password;
  };

  login() {
    return request({
      method: 'POST',
      uri: this.endpoint + '/api/v4/User/Validate',
      headers: {
        MyQApplicationId: this.appId
      },
      body: {
        username: this.username,
        password: this.password
      },
      json: true
    }).then((response) => {
      const result = {
        success: response.SecurityToken ? true : false
      };
      if (result.success) {
        this.securityToken = response.SecurityToken;
        result.token = this.securityToken;
      } else {
        result.error = response.ErrorMessage;
      }
      return result;
    }).catch((err) => {
      console.log(err);
    });
  };

  getDoors() {
    if (!this.securityToken) {
      const result = {
        success: false,
        error: "Not logged in."
      };
      return result;
    }

    return request({
      method: 'GET',
      uri: this.endpoint + '/api/v4/userdevicedetails/get',
      qs: {
        appId: this.appId,
        SecurityToken: this.securityToken
      },
      json: true
    }).then((response) => {
      this.doors = [];
      for (let device of response.Devices) {
        if (this.garageDoorIds.includes(device.MyQDeviceTypeId)) {
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
          this.doors.push(door);
        }
      }
      const result = {
        success: true,
        doors: this.doors
      };
      return result;
    }).catch((err) => {
      console.log(err);
    });
  };

  getDoorState(doorId) {
    if (!this.securityToken) {
      const result = {
        success: false,
        error: "Not logged in."
      };
      return result;
    }
    
    return request({
      method: 'GET',
      uri: this.endpoint + '/api/v4/deviceattribute/getdeviceattribute',
      qs: {
        appId: this.appId,
        SecurityToken: this.securityToken,
        MyQDeviceId: doorId,
        AttributeName: 'doorstate'
      },
      json: true
    }).then((response) => {
      const state = parseInt(response.AttributeValue);
      for (let door of this.doors) {
        if (door.id === doorId) {
          door.state = state;
          door.updated = response.UpdatedTime;
          break;
        }
      }
      const result = {
        success: true,
        state
      };
      return result;
    }).catch((err) => {
      console.log(err);
    });
  };

  setDoorState(doorId, toggle) {
    if (!this.securityToken) {
      const result = {
        success: false,
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
        success: false,
        error: "Toggle has to be either 0 or 1."
      };
      return result;
    }

    return request({
      method: 'PUT',
      uri: this.endpoint + '/api/v4/deviceattribute/putdeviceattribute',
      headers: {
        MyQApplicationId: this.appId,
        securityToken: this.securityToken
      },
      body: {
        MyQDeviceId: doorId,
        AttributeName: 'desireddoorstate',
        AttributeValue: toggle
      },
      json: true
    }).then((response) => {
      setTimeout(() => {
        return this._loopDoorState(doorId, newState);
      }, 1000);
    }).catch((err) => {
      console.log(err);
    });
  };

  _loopDoorState(doorId, newState) {
    return this.getDoorState(doorId)
      .then((result) => {
        if (result.success) {
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
