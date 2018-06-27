// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js
const axios = require('axios');

const constants = require('./constants');

const returnError = (returnCode, err) => {
  const result = {
    returnCode,
    message: constants.errorMessages[returnCode],
  };
  if (err) {
    result.unhandledError = err;
  }
  return result;
};

const getDeviceState = (id, attributeName) => {
  if (!this.securityToken) {
    return Promise.resolve(returnError(13));
  }

  return axios({
    method: 'get',
    url: `${constants.endpoint}/api/v4/deviceattribute/getdeviceattribute`,
    params: {
      appId: constants.appId,
      SecurityToken: this.securityToken,
      MyQDeviceId: id,
      AttributeName: attributeName,
    },
  })
    .then(response => {
      if (!response || !response.data) {
        return returnError(12);
      }

      const { data } = response;

      if (data.ReturnCode === '-3333') {
        return returnError(13);
      } else if (!data.ReturnCode) {
        return returnError(11);
      } else if (!data.AttributeValue) {
        return returnError(15);
      }

      const state = parseInt(data.AttributeValue, 10);
      const result = {
        returnCode: 0,
        state,
      };
      return result;
    })
    .catch(err => {
      if (err.statusCode === 400) {
        return returnError(15);
      }

      return returnError(11, err);
    });
};

const setDeviceState = (id, toggle, attributeName) => {
  if (!this.securityToken) {
    return Promise.resolve(returnError(13));
  } else if (toggle !== 0 && toggle !== 1) {
    return Promise.resolve(returnError(15));
  }

  return axios({
    method: 'put',
    url: `${constants.endpoint}/api/v4/deviceattribute/putdeviceattribute`,
    headers: {
      MyQApplicationId: constants.appId,
      securityToken: this.securityToken,
    },
    data: {
      MyQDeviceId: id,
      AttributeName: attributeName,
      AttributeValue: toggle,
    },
  })
    .then(response => {
      if (!response || !response.data) {
        return returnError(12);
      }

      const { data } = response;

      if (data.ReturnCode === '-3333') {
        return returnError(13);
      } else if (!data.ReturnCode) {
        return returnError(11);
      }

      const result = {
        returnCode: 0,
      };
      return result;
    })
    .catch(err => {
      if (err.statusCode === 500) {
        return returnError(15);
      }

      return returnError(11, err);
    });
};

class MyQ {
  constructor(username, password) {
    this.username = username;
    this.password = password;
  }

  login() {
    if (!this.username || !this.password) {
      return Promise.resolve(returnError(14));
    }

    return axios({
      method: 'post',
      url: `${constants.endpoint}/api/v4/User/Validate`,
      headers: {
        MyQApplicationId: constants.appId,
      },
      data: {
        username: this.username,
        password: this.password,
      },
    })
      .then(response => {
        if (!response || !response.data) {
          return returnError(12);
        }

        const { data } = response;

        if (data.ReturnCode === '203') {
          return returnError(14);
        } else if (data.ReturnCode === '205') {
          return returnError(16);
        } else if (data.ReturnCode === '207') {
          return returnError(17);
        } else if (!data.SecurityToken) {
          return returnError(11);
        }

        this.securityToken = data.SecurityToken;
        const result = {
          returnCode: 0,
          token: data.SecurityToken,
        };
        return result;
      })
      .catch(err => {
        if (err.statusCode === 500) {
          return returnError(14);
        }

        return returnError(11, err);
      });
  }

  getDevices(typeIdParams) {
    if (!this.securityToken) {
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

    return axios({
      method: 'get',
      url: `${constants.endpoint}/api/v4/userdevicedetails/get`,
      headers: {
        MyQApplicationId: constants.appId,
        securityToken: this.securityToken,
      },
    })
      .then(response => {
        if (!response || !response.data) {
          return returnError(12);
        }

        const { data } = response;

        if (data.ReturnCode === '-3333') {
          return returnError(13);
        } else if (!data.Devices) {
          return returnError(11);
        }

        const result = {
          returnCode: 0,
        };

        const modifiedDevices = [];
        for (let i = 0; i < data.Devices.length; i += 1) {
          const device = data.Devices[i];
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

  getDoorState(id) {
    return getDeviceState(id, 'doorstate')
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
    return getDeviceState(id, 'lightstate')
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

  setDoorState(id, toggle) {
    return setDeviceState(id, toggle, 'desireddoorstate')
      .then(result => result)
      .catch(err => returnError(11, err));
  }

  setLightState(id, toggle) {
    return setDeviceState(id, toggle, 'desiredlightstate')
      .then(result => result)
      .catch(err => returnError(11, err));
  }
}

module.exports = MyQ;
