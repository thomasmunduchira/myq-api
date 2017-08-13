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
  15: 'Invalid parameter(s) provided.',
  16: 'User will be locked out due to too many tries. 1 try left.',
  17: 'User is locked out due to too many tries. Please reset password and try again.'
};
const doorStates = {
  1: 'open',
  2: 'closed',
  3: 'stopped in the middle',
  4: 'going up',
  5: 'going down',
  9: 'not closed'
};
const lightStates = {
  0: 'off',
  1: 'on'
};

const returnError = (returnCode, err) => {
  console.log(`Handled (${returnCode})`);
  if (err) {
    console.log('Error:', err);
  }
  const result = {
    returnCode,
    error: errors[returnCode]
  };
  return result;
};

class MyQ {
  constructor(username, password) {
    this._username = username;
    this._password = password;
  }

  login() {
    if (!this._username || !this._password) {
      return Promise.resolve(returnError(14));
    }

    return request({
      method: 'POST',
      uri: `${endpoint}/api/v4/User/Validate`,
      headers: {
        MyQApplicationId: appId
      },
      body: {
        username: this._username,
        password: this._password
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12);
      } else if (response.ReturnCode === '203') {
        return returnError(14, response);
      } else if (response.ReturnCode === '205') {
        return returnError(16, response);
      } else if (response.ReturnCode === '207') {
        return returnError(17, response);
      } else if (!response.SecurityToken) {
        return returnError(11, response);
      }

      this._securityToken = response.SecurityToken;
      const result = {
        returnCode: 0,
        token: response.SecurityToken
      };
      return result;
    }).catch((err) => {
      if (err.statusCode === 500) {
        return returnError(14, err);
      } else {
        return returnError(11, err);
      }
    });
  }

  getDevices(typeIds) {
    if (!this._securityToken) {
      return Promise.resolve(returnError(13));
    } else if (typeIds === null) {
      return Promise.resolve(returnError(15));
    }

    typeIds = Array.isArray(typeIds) ? typeIds : [typeIds];

    for (let typeId of typeIds) {
      if (!allTypeIds.includes(typeId)) {
        return returnError(15);
      }
    }

    return request({
      method: 'GET',
      uri: `${endpoint}/api/v4/userdevicedetails/get`,
      qs: {
        appId: appId,
        SecurityToken: this._securityToken
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12, response);
      } else if (response.ReturnCode === '-3333') {
        return returnError(13, response);
      } else if (!response.Devices) {
        return returnError(11, response);
      }

      const result = {
        returnCode: 0
      };

      const modifiedDevices = [];
      for (let device of response.Devices) {
        if (!typeIds.includes(device.MyQDeviceTypeId)) {
          continue;
        }

        const modifiedDevice = {
          id: device.MyQDeviceId,
          typeId: device.MyQDeviceTypeId,
          typeName: device.MyQDeviceTypeName,
          serialNumber: device.SerialNumber
        };
        for (let attribute of device.Attributes) {
          if (attribute.AttributeDisplayName === 'online') {
            modifiedDevice.online = attribute.Value === 'True';
          } else if (attribute.AttributeDisplayName === 'desc') {
            modifiedDevice.name = attribute.Value;
          } else if (attribute.AttributeDisplayName === 'doorstate') {
            modifiedDevice.doorState = parseInt(attribute.Value);
            modifiedDevice.doorStateDescription = doorStates[modifiedDevice.doorState];
            modifiedDevice.doorStateUpdated = parseInt(attribute.UpdatedTime);
          } else if (attribute.AttributeDisplayName === 'lightstate') {
            modifiedDevice.lightState = parseInt(attribute.Value);
            modifiedDevice.lightStateDescription = lightStates[modifiedDevice.lightState];
            modifiedDevice.lightStateUpdated = parseInt(attribute.UpdatedTime);
          }
        }
        modifiedDevices.push(modifiedDevice);
      }
      result.devices = modifiedDevices;
      return result;
    }).catch((err) => {
      return returnError(11, err);
    });
  }

  _getDeviceState(id, attributeName) {
    if (!this._securityToken) {
      return Promise.resolve(returnError(13));
    }

    return request({
      method: 'GET',
      uri: `${endpoint}/api/v4/deviceattribute/getdeviceattribute`,
      qs: {
        appId: appId,
        SecurityToken: this._securityToken,
        MyQDeviceId: id,
        AttributeName: attributeName
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12);
      } else if (response.ReturnCode === '-3333') {
        return returnError(13, response);
      } else if (!response.ReturnCode) {
        return returnError(11, response);
      } else if (!response.AttributeValue) {
        return returnError(15, response);
      }

      const state = parseInt(response.AttributeValue);
      const result = {
        returnCode: 0,
        state,
      };
      return result;
    }).catch((err) => {
      if (err.statusCode === 400) {
        return returnError(15, err);
      }

      throw err;
    });
  }

  getDoorState(id) {
    return this._getDeviceState(id, 'doorstate')
      .then((result) => {
        if (result.returnCode !== 0) {
          return result;
        }

        result.doorState = result.state;
        result.doorStateDescription = doorStates[result.doorState];
        delete result.state;
        return result;
      }).catch((err) => {
        return returnError(11, err);
      });
  }

  getLightState(id) {
    return this._getDeviceState(id, 'lightstate')
      .then((result) => {
        if (result.returnCode !== 0) {
          return result;
        }

        result.lightState = result.state;
        result.lightStateDescription = lightStates[result.lightState];
        delete result.state;
        return result;
      }).catch((err) => {
        return returnError(11, err);
      });
  }

  _setDeviceState(id, toggle, attributeName) {
    if (!this._securityToken) {
      return Promise.resolve(returnError(13));
    } else if (toggle !== 0 && toggle !== 1) {
      return Promise.resolve(returnError(15));
    }

    return request({
      method: 'PUT',
      uri: `${endpoint}/api/v4/deviceattribute/putdeviceattribute`,
      headers: {
        MyQApplicationId: appId,
        securityToken: this._securityToken
      },
      body: {
        MyQDeviceId: id,
        AttributeName: attributeName,
        AttributeValue: toggle
      },
      json: true
    }).then((response) => {
      if (!response) {
        return returnError(12, response);
      } else if (response.ReturnCode === '-3333') {
        return returnError(13, response);
      } else if (!response.ReturnCode) {
        return returnError(11, response);
      }

      const result = {
        returnCode: 0
      };
      return result;
    }).catch((err) => {
      if (err.statusCode === 500) {
        return returnError(15, err);
      }

      throw err;
    });
  }

  setDoorState(id, toggle) {
    return this._setDeviceState(id, toggle, 'desireddoorstate')
      .then((result) => {
        return result;
      }).catch((err) => {
        return returnError(11, err);
      });
  }

  setLightState(id, toggle) {
    return this._setDeviceState(id, toggle, 'desiredlightstate')
      .then((result) => {
        return result;
      }).catch((err) => {
        return returnError(11, err);
      });
  }
}

module.exports = MyQ;
