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
        success: response.SecurityToken? true : false
      };
      if (result.success) {
        this.securityToken = response.SecurityToken;
        result.token = this.securityToken;
      } else {
        result.error = response.ErrorMessage;
      }
      return result;
    }).catch((err) => {
      throw err;
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
      throw err;
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
      for (let door of this.doors) {
        if (door.id === doorId) {
          door.state = response.AttributeValue;
          door.updated = response.UpdatedTime;
          break;
        }
      }
      const result = {
        success: true,
        state: response.AttributeValue
      };
      return result;
    }).catch((err) => {
      throw err;
    });
  };

  setDoorState(deviceId, state) {
    if (!this.securityToken) {
      const result = {
        success: false,
        error: "Not logged in."
      };
      return result;
    }
    return request({
      method: 'PUT',
      uri: this.endpoint + '/Device/setDeviceAttribute',
      body: {
        DeviceId: deviceId,
        ApplicationId: this.appId,
        AttributeName: 'desireddoorstate',
        AttributeValue: state,
        securityToken: this.securityToken
      },
      json: true
    }).then((response) => {
      setTimeout(() => {
        return this._loopDoorState(deviceId);
      }, 1000);
    }).catch((err) => {
      throw err;
    });
  };

  _loopDoorState(deviceId) {
    return this.getDoorState(deviceId)
      .then((response) => {
        if (response.state == 4 || response.state == 5) {
          setTimeout(() => {
            return this._loopDoorState(deviceId)
          }, 5000);
        } else {
          return response;
        }
      }).catch((err) => {
        throw err;
      });
  };
};

module.exports = MyQ;
