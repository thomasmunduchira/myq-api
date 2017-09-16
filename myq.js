// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js
const request = require('request-promise-native');

const constants = require('./config/constants');

const returnError = (returnCode, err) => {
  console.log(`Handled (${returnCode})`);
  if (err) {
    console.log('Error:', err);
  }
  const result = {
    returnCode,
    error: constants.errors[returnCode],
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
      uri: `${constants.endpoint}/api/v4/User/Validate`,
      headers: {
        MyQApplicationId: constants.appId,
      },
      body: {
        username: this._username,
        password: this._password,
      },
      json: true,
    })
      .then(response => {
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
          token: response.SecurityToken,
        };
        return result;
      })
      .catch(err => {
        if (err.statusCode === 500) {
          return returnError(14, err);
        }
        return returnError(11, err);
      });
  }

  getDevices(typeIdParams) {
    if (!this._securityToken) {
      return Promise.resolve(returnError(13));
    } else if (typeIdParams === null) {
      return Promise.resolve(returnError(15));
    }

    const typeIds = Array.isArray(typeIdParams) ? typeIdParams : [typeIdParams];

    for (let i = 0; i < typeIds.length; i += 1) {
      const typeId = typeIds[i];
      if (!constants.allTypeIds.includes(typeId)) {
        return returnError(15);
      }
    }

    return request({
      method: 'GET',
      uri: `${constants.endpoint}/api/v4/userdevicedetails/get`,
      qs: {
        appId: constants.appId,
        SecurityToken: this._securityToken,
      },
      json: true,
    })
      .then(response => {
        if (!response) {
          return returnError(12, response);
        } else if (response.ReturnCode === '-3333') {
          return returnError(13, response);
        } else if (!response.Devices) {
          return returnError(11, response);
        }

        const result = {
          returnCode: 0,
        };

        const modifiedDevices = [];
        for (let i = 0; i < response.Devices.length; i += 1) {
          const device = response.Devices[i];
          if (typeIds.includes(device.MyQDeviceTypeId)) {
            const modifiedDevice = {
              id: device.MyQDeviceId,
              typeId: device.MyQDeviceTypeId,
              typeName: device.MyQDeviceTypeName,
              serialNumber: device.SerialNumber,
            };
            for (let j = 0; j < device.Attributes.length; j += 1) {
              const attribute = device.Attributes[j];
              if (attribute.AttributeDisplayName === 'online') {
                modifiedDevice.online = attribute.Value === 'True';
              } else if (attribute.AttributeDisplayName === 'desc') {
                modifiedDevice.name = attribute.Value;
              } else if (attribute.AttributeDisplayName === 'doorstate') {
                modifiedDevice.doorState = parseInt(attribute.Value, 10);
                modifiedDevice.doorStateDescription =
                  constants.doorStates[modifiedDevice.doorState];
                modifiedDevice.doorStateUpdated = parseInt(attribute.UpdatedTime, 10);
              } else if (attribute.AttributeDisplayName === 'lightstate') {
                modifiedDevice.lightState = parseInt(attribute.Value, 10);
                modifiedDevice.lightStateDescription =
                  constants.lightStates[modifiedDevice.lightState];
                modifiedDevice.lightStateUpdated = parseInt(attribute.UpdatedTime, 10);
              }
            }
            modifiedDevices.push(modifiedDevice);
          }
        }
        result.devices = modifiedDevices;
        return result;
      })
      .catch(err => returnError(11, err));
  }

  _getDeviceState(id, attributeName) {
    if (!this._securityToken) {
      return Promise.resolve(returnError(13));
    }

    return request({
      method: 'GET',
      uri: `${constants.endpoint}/api/v4/deviceattribute/getdeviceattribute`,
      qs: {
        appId: constants.appId,
        SecurityToken: this._securityToken,
        MyQDeviceId: id,
        AttributeName: attributeName,
      },
      json: true,
    })
      .then(response => {
        if (!response) {
          return returnError(12);
        } else if (response.ReturnCode === '-3333') {
          return returnError(13, response);
        } else if (!response.ReturnCode) {
          return returnError(11, response);
        } else if (!response.AttributeValue) {
          return returnError(15, response);
        }

        const state = parseInt(response.AttributeValue, 10);
        const result = {
          returnCode: 0,
          state,
        };
        return result;
      })
      .catch(err => {
        if (err.statusCode === 400) {
          return returnError(15, err);
        }

        throw err;
      });
  }

  getDoorState(id) {
    return this._getDeviceState(id, 'doorstate')
      .then(result => {
        if (result.returnCode !== 0) {
          return result;
        }

        const newResult = JSON.parse(JSON.stringify(result));
        newResult.doorState = newResult.state;
        newResult.doorStateDescription = constants.doorStates[newResult.doorState];
        delete newResult.state;
        return newResult;
      })
      .catch(err => returnError(11, err));
  }

  getLightState(id) {
    return this._getDeviceState(id, 'lightstate')
      .then(result => {
        if (result.returnCode !== 0) {
          return result;
        }

        const newResult = JSON.parse(JSON.stringify(result));
        newResult.lightState = newResult.state;
        newResult.lightStateDescription = constants.lightStates[newResult.lightState];
        delete newResult.state;
        return newResult;
      })
      .catch(err => returnError(11, err));
  }

  _setDeviceState(id, toggle, attributeName) {
    if (!this._securityToken) {
      return Promise.resolve(returnError(13));
    } else if (toggle !== 0 && toggle !== 1) {
      return Promise.resolve(returnError(15));
    }

    return request({
      method: 'PUT',
      uri: `${constants.endpoint}/api/v4/deviceattribute/putdeviceattribute`,
      headers: {
        MyQApplicationId: constants.appId,
        securityToken: this._securityToken,
      },
      body: {
        MyQDeviceId: id,
        AttributeName: attributeName,
        AttributeValue: toggle,
      },
      json: true,
    })
      .then(response => {
        if (!response) {
          return returnError(12, response);
        } else if (response.ReturnCode === '-3333') {
          return returnError(13, response);
        } else if (!response.ReturnCode) {
          return returnError(11, response);
        }

        const result = {
          returnCode: 0,
        };
        return result;
      })
      .catch(err => {
        if (err.statusCode === 500) {
          return returnError(15, err);
        }

        throw err;
      });
  }

  setDoorState(id, toggle) {
    return this._setDeviceState(id, toggle, 'desireddoorstate')
      .then(result => result)
      .catch(err => returnError(11, err));
  }

  setLightState(id, toggle) {
    return this._setDeviceState(id, toggle, 'desiredlightstate')
      .then(result => result)
      .catch(err => returnError(11, err));
  }
}

module.exports = MyQ;
