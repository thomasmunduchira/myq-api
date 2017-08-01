// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js

const request = require('request-promise-native');

const endpoint = 'https://myqexternal.myqdevice.com';
const appId = 'NWknvuBd7LoFHfXmKNMBcgajXtZEgKUh4V7WNzMidrpUUluDpVYVZx+xT4PCM5Kx';
const allTypeIds = [1, 2, 3, 5, 7, 9, 13, 15, 16, 17];
const errors = {
  11: 'Something unexpected happened. Please wait a bit and try again.',
  12: 'MyQ service is currently down. Please wait a bit and try again.',
  13: 'Not logged in.',
  14: 'Email and/or password are incorrect.',
  15: 'Invalid parameter provided.',
  16: 'User is locked out due to too many tries. Please go to the MyQ website and click "Forgot Password" to reset the password and gain access to the account. Note that it might take a while before being able to login through this application again - this error might keep popping up despite having unlocked the account.'
};

const returnError = (returnCode) => {
  const result = {
    returnCode,
    error: errors[returnCode]
  };
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
        return returnError(14);
      }
    }).catch((err) => {
      if (err.message === 'Error: read ECONNRESET') {
        return returnError(16);
      } else {
        console.error(err);
        return returnError(11);
      }
    });
  };

  getDevices(typeIds) {
    if (!this.securityToken) {
      return returnError(13);
    } else if (typeIds === null) {
      return returnError(15);
    }

    typeIds = Array.isArray(typeIds) ? typeIds : [typeIds];

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

      const result = {
        returnCode: 0,
      };

      for (let typeId of typeIds) {
        if (!allTypeIds.includes(typeId)) {
          return returnError(15);
        }
      };

      const modifiedDevices = [];
      for (let device of response.Devices) {
        if (typeIds.includes(device.MyQDeviceTypeId)) {
          const modifiedDevice = {
            id: device.MyQDeviceId,
            typeId: device.MyQDeviceTypeId,
            typeName: device.MyQDeviceTypeName,
            serialNumber: device.SerialNumber
          };
          for (let attribute of device.Attributes) {
            if (attribute.AttributeDisplayName === 'online') {
              modifiedDevice.online = attribute.Value === 'True';
            }
            if (attribute.AttributeDisplayName === 'desc') {
              modifiedDevice.name = attribute.Value;
            }
            if (attribute.AttributeDisplayName === 'doorstate') {
              modifiedDevice.doorState = parseInt(attribute.Value);
              modifiedDevice.doorStateUpdated = parseInt(attribute.UpdatedTime);
            }
            if (attribute.AttributeDisplayName === 'lightstate') {
              modifiedDevice.lightState = parseInt(attribute.Value);
              modifiedDevice.lightStateUpdated = parseInt(attribute.UpdatedTime);
            }
          }
          modifiedDevices.push(modifiedDevice);
        }
      }
      result.devices = modifiedDevices;
      return result;
    }).catch((err) => {
      console.error(err);
      return returnError(11);
    });
  }

  _getDeviceState(id, attributeName) {
    if (!this.securityToken) {
      return returnError(13);
    }

    return request({
      method: 'GET',
      uri: endpoint + '/api/v4/deviceattribute/getdeviceattribute',
      qs: {
        appId: appId,
        SecurityToken: this.securityToken,
        MyQDeviceId: id,
        AttributeName: attributeName
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
      throw err;
    });
  };

  getDoorState(id) {
    return this._getDeviceState(id, 'doorstate')
      .then((result) => {
        if (result.returnCode !== 0) {
          return result;
        }

        result.doorState = result.state;
        delete result.state;
        return result;
      }).catch((err) => {
        console.error(err);
        return returnError(11);
      });
  };

  getLightState(id) {
    return this._getDeviceState(id, 'lightstate')
      .then((result) => {
        if (result.returnCode !== 0) {
          return result;
        }

        result.lightState = result.state;
        delete result.state;
        return result;
      }).catch((err) => {
        console.error(err);
        return returnError(11);
      });
  };

  _setDeviceState(id, toggle, attributeName) {
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
        MyQDeviceId: id,
        AttributeName: attributeName,
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
      throw err;
    });
  };

  setDoorState(id, toggle) {
    return this._setDeviceState(id, toggle, 'desireddoorstate')
      .then((result) => {
        return result;
      }).catch((err) => {
        console.error(err);
        return returnError(11);
      });
  };

  setLightState(id, toggle) {
    return this._setDeviceState(id, toggle, 'desiredlightstate')
      .then((result) => {
        return result;
      }).catch((err) => {
        console.error(err);
        return returnError(11);
      });
  };

  _loopDoorState(doorId, newState) {
    return this.getDoorState(doorId)
      .then((result) => {
        if (result.returnCode !== 0) {
          return result;
        }
        
        if (result.state === newState) {
          return result;
        } else {
          setTimeout(() => {
            return this._loopDoorState(doorId, newState);
          }, 2500);
        }
      }).catch((err) => {
        throw err;
      });
  };
};

module.exports = MyQ;
