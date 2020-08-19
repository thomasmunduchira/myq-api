// UPDATED VERSION OF https://github.com/chadsmith/node-liftmaster/blob/master/liftmaster.js
const axios = require('axios');

const constants = require('./constants');

class ErrorHandler {
  static parseBadResponse(response) {
    if (!response) {
      return ErrorHandler.returnError(12, null, response);
    }

    const { data, status } = response;
    if (!status) {
      return ErrorHandler.returnError(12, null, data);
    }
    if (status === 500) {
      return ErrorHandler.returnError(15);
    }
    if ([400, 401].includes(status)) {
      if (data.code === '401.205') {
        return ErrorHandler.returnError(16, null, data);
      }
      if (data.code === '401.207') {
        return ErrorHandler.returnError(17, null, data);
      }
      return ErrorHandler.returnError(14, null, data);
    }
    if (status === 404) {
      // Return an error for a bad serial number.
      if (data.code === '404.401') {
        return ErrorHandler.returnError(18, null, data);
      }

      // Handle generic 404 errors, likely indicating something wrong with this implementation.
      return ErrorHandler.returnError(20);
    }

    return ErrorHandler.returnError(11, null, data);
  }

  static returnError(returnCode, error, response) {
    const result = {
      returnCode,
      message: constants.errorMessages[returnCode],
      providerMessage: null,
      unhandledError: null,
    };
    if (response && response.description) {
      result.providerMessage = response.description;
    }
    if (error) {
      result.unhandledError = error;
    }
    return Promise.resolve(result);
  }
}

class MyQ {
  // Build the object and initialize any properties we're going to use.
  constructor(username, password) {
    this.accountId = null;
    this.username = username;
    this.password = password;
    this.securityToken = null;
  }

  login() {
    if (!this.username || !this.password) {
      return ErrorHandler.returnError(14);
    }

    return this.executeRequest(constants.routes.login, 'post', null, {
      Username: this.username,
      Password: this.password,
    })
      .then(originalResponse => {
        const { response, returnCode } = originalResponse;
        if (returnCode !== 0) {
          throw originalResponse;
        }
        if (!response || !response.data) {
          return ErrorHandler.returnError(12);
        }

        const { data } = response;
        if (!data.SecurityToken) {
          return ErrorHandler.returnError(11);
        }

        const token = data.SecurityToken;
        this.securityToken = token;

        return {
          returnCode: 0,
          token,
        };
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  checkIsLoggedIn() {
    return !!this.securityToken;
  }

  executeRequest(route, method, params, data) {
    const isLoginRequest = route === constants.routes.login;
    const headers = {
      'Content-Type': 'application/json',
      MyQApplicationId: constants.headers.appId,
      'User-Agent': constants.headers.defaultUserAgent,
      ApiVersion: constants.headers.deviceApiVersion,
      BrandId: constants.headers.defaultBrandId,
      Culture: constants.headers.defaultCulture,
    };

    // If we aren't logged in or logging in, throw an error.
    if (!isLoginRequest && !this.checkIsLoggedIn()) {
      return ErrorHandler.returnError(13);
    } else if (!isLoginRequest) {
      // Add our security token to the headers.
      headers.SecurityToken = this.securityToken;
    }

    let baseUrl = constants.deviceBase;

    // Authentication routes need a different base URL.
    if ([constants.routes.login, constants.routes.account].includes(route)) {
      baseUrl = constants.authBase;
    }

    const config = {
      method,
      baseURL: baseUrl,
      url: route,
      headers,
      data,
      params,
    };

    return axios(config).then(response => ({
      returnCode: 0,
      response,
    }));
  }

  getAccountInfo() {
    return this.executeRequest(constants.routes.account, 'get', { expand: 'account' })
      .then(returnValue => {
        if (returnValue.returnCode !== 0) {
          return returnValue;
        }
        const { data } = returnValue.response;
        if (!data || !data.Account || !data.Account.Id) {
          return ErrorHandler.returnError(11);
        }
        this.accountId = data.Account.Id;

        return null;
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  getDevices(typeIdParams) {
    let promise = Promise.resolve();
    if (!this.accountId) {
      promise = this.getAccountInfo();
    }

    let typeIds = Array.isArray(typeIdParams) ? typeIdParams : [typeIdParams];
    typeIds = typeIds.filter(typeId => typeof typeId !== 'undefined');

    for (let i = 0; i < typeIds.length; i += 1) {
      const typeId = typeIds[i];
      if (!Object.values(constants.allDeviceTypes).includes(typeId)) {
        return ErrorHandler.returnError(15);
      }
    }

    return promise
      .then(() =>
        this.executeRequest(
          constants.routes.getDevices.replace('{accountId}', this.accountId),
          'get'
        )
      )
      .then(returnValue => {
        if (returnValue.returnCode !== 0 && typeof returnValue.returnCode !== 'undefined') {
          return returnValue;
        }

        const {
          response: { data },
        } = returnValue;

        const devices = data.items;
        if (!devices) {
          return ErrorHandler.returnError(11);
        }

        const result = {
          returnCode: 0,
        };

        const modifiedDevices = [];
        Object.values(devices).forEach(device => {
          const modifiedDevice = {
            family: device.device_family,
            name: device.name,
            type: device.device_type,
            serialNumber: device.serial_number,
          };

          const { state } = device;
          if (constants.myQProperties.online in state) {
            modifiedDevice.online = state[constants.myQProperties.online];
          }
          if (constants.myQProperties.doorState in state) {
            modifiedDevice.doorState = state[constants.myQProperties.doorState];
            const date = new Date(state[constants.myQProperties.lastUpdate]);
            modifiedDevice.doorStateUpdated = date.toLocaleString();
          }
          if (constants.myQProperties.lightState in state) {
            modifiedDevice.lightState = state[constants.myQProperties.lightState];
            const date = new Date(state[constants.myQProperties.lastUpdate]);
            modifiedDevice.lightStateUpdated = date.toLocaleString();
          }

          if (typeIds.length === 0 || typeIds.includes(modifiedDevice.type)) {
            modifiedDevices.push(modifiedDevice);
          }
        });

        result.devices = modifiedDevices;
        return result;
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  getDeviceState(serialNumber, attributeName) {
    return this.getDevices()
      .then(response => {
        const device = (response.devices || []).find(d => d.serialNumber === serialNumber);
        if (!device) {
          return ErrorHandler.returnError(18);
        } else if (!(attributeName in device)) {
          return ErrorHandler.returnError(19);
        }

        const result = {
          returnCode: 0,
          state: device[attributeName],
        };
        return result;
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  getDoorState(serialNumber) {
    return this.getDeviceState(serialNumber, 'doorState')
      .then(result => {
        if (result.returnCode !== 0) {
          return result;
        }

        const newResult = JSON.parse(JSON.stringify(result));
        newResult.doorState = newResult.state;
        delete newResult.state;
        return newResult;
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  getLightState(serialNumber) {
    return this.getDeviceState(serialNumber, 'lightState')
      .then(result => {
        if (result.returnCode !== 0) {
          return result;
        }

        const newResult = JSON.parse(JSON.stringify(result));
        newResult.lightState = newResult.state;
        delete newResult.state;
        return newResult;
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  setDeviceState(serialNumber, action) {
    let promise = Promise.resolve();
    if (!this.accountId) {
      promise = this.getAccountInfo();
    }

    return promise
      .then(() =>
        this.executeRequest(
          constants.routes.setDevice
            .replace('{accountId}', this.accountId)
            .replace('{serialNumber}', serialNumber),
          'put',
          null,
          { action_type: action }
        )
      )
      .then(returnValue => {
        const { returnCode } = returnValue;
        if (returnCode !== 0 && typeof returnCode !== 'undefined') {
          return returnValue;
        }

        return {
          returnCode: 0,
        };
      })
      .catch(({ response }) => ErrorHandler.parseBadResponse(response));
  }

  setDoorOpen(serialNumber, shouldOpen) {
    let action = constants.doorCommands.close;

    // Take a precaution and check against the string "false" so
    // that someone doesn't inadvertently open their garage.
    if (shouldOpen && shouldOpen !== 'false') {
      action = constants.doorCommands.open;
    }
    return this.setDeviceState(serialNumber, action);
  }

  setLightState(serialNumber, turnOn) {
    let action = constants.lightCommands.off;
    if (turnOn) {
      action = constants.lightCommands.on;
    }
    return this.setDeviceState(serialNumber, action);
  }
}

module.exports = MyQ;
