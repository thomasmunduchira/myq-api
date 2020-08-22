const axios = require('axios');
const axiosDebugLog = require('axios-debug-log');
const debug = require('debug')('myq-api'); // the latter parameter specified here is the custom logger name

const actions = require('./actions');
const constants = require('./constants');
const ErrorHandler = require('./ErrorHandler');
const MyQError = require('./MyQError');

// Log axios requests, responses, and errors.
axiosDebugLog({
  request(axiosDebug, config) {
    axiosDebug('Service request', config);
  },
  response(axiosDebug, response) {
    axiosDebug('Service response:', response);
  },
  error(axiosDebug, error) {
    axiosDebug('Service error:', error);
  },
});
axiosDebugLog.addLogger(axios, debug);

/**
 * An easy-to-use interface for interacting with myQ devices.
 */
class MyQ {
  /**
   * Initialize the MyQ API.
   *
   * This used to take in an email and password, but these parameters have been deprecated in favor
   * of login(username, password).
   *
   * @param {string} _emailDeprecated Deprecated field that should not be specified anymore. Specify
   * credentials through login() instead.
   * @param {string} _passwordDeprecated Deprecated field that should not be specified anymore.
   * Specify credentials through login() instead.
   * @throws {MyQError} INVALID_ARGUMENT
   */
  constructor(_emailDeprecated, _passwordDeprecated) {
    if (_emailDeprecated !== undefined || _passwordDeprecated !== undefined) {
      throw new MyQError(
        'Email and password should be specified in login() rather than constructor.',
        constants.codes.INVALID_ARGUMENT
      );
    }

    this._securityToken = null; // used for authenticating service requests
    this._accountId = null; // used for identifying an account in service requests
    this._devices = []; // used for caching devices in order to check properties that are not likely to become stale
  }

  /**
   * Log into a myQ account and fetch a security token.
   *
   * This must be called before the rest of this API is called.  This used to take in no parameters,
   * but the interface has been updated to take in the account email and password.
   *
   * Note that the security token is short-lived and will not work after some time, so this might
   * have to be called again to retrieve a new security token.
   *
   * @param {string} email Email for the myQ acccount
   * @param {string} password Password for the myQ account
   * @returns {object} containing a success code and security token
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} AUTHENTICATION_FAILED
   * @throws {MyQError} AUTHENTICATION_FAILED_ONE_TRY_LEFT
   * @throws {MyQError} AUTHENTICATION_FAILED_LOCKED_OUT
   */
  async login(email, password) {
    if (email === undefined) {
      throw new MyQError('Email parameter is not specified.', constants.codes.INVALID_ARGUMENT);
    }
    if (typeof email !== 'string') {
      throw new MyQError(
        'Specified email parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (password === undefined) {
      throw new MyQError('Password parameter is not specified.', constants.codes.INVALID_ARGUMENT);
    }
    if (typeof password !== 'string') {
      throw new MyQError(
        'Specified password parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }

    // A null security token is specified to make the helper function send the request without a
    // security token.
    const loginResponse = await this._executeServiceRequest({
      baseURL: constants._baseUrls.auth,
      url: constants._routes.login,
      method: 'post',
      headers: {
        SecurityToken: null,
      },
      data: {
        Username: email,
        Password: password,
      },
    });
    if (!loginResponse || !loginResponse.data || loginResponse.data.SecurityToken == null) {
      throw new MyQError(
        'Service did not return security token in response.',
        constants.codes.INVALID_SERVICE_RESPONSE
      );
    }
    this._securityToken = loginResponse.data.SecurityToken;
    // Reset cached properties since this could be a new account that is being logged into.
    this._accountId = null;
    this._devices = [];

    return {
      code: constants.codes.OK,
      securityToken: this._securityToken,
    };
  }

  /**
   * Get the metadata and state of all devices on the myQ account.
   *
   * login() must be called before this.
   *
   * @returns {object} containing a success code and a list of devices
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   */
  async getDevices() {
    if (this._accountId == null) {
      // Fetch the account ID if we have not already.
      await this._getAccountId();
    }
    const getDevicesServiceResponse = await this._executeServiceRequest({
      baseURL: constants._baseUrls.device,
      url: constants._routes.getDevices.replace('{accountId}', this._accountId),
      method: 'get',
    });
    if (
      !getDevicesServiceResponse ||
      !getDevicesServiceResponse.data ||
      !Array.isArray(getDevicesServiceResponse.data.items)
    ) {
      throw new MyQError(
        'Service did not return valid devices in response.',
        constants.codes.INVALID_SERVICE_RESPONSE
      );
    }
    this._devices = getDevicesServiceResponse.data.items;

    return {
      code: constants.codes.OK,
      devices: this._devices,
    };
  }

  /**
   * Get the metadata and state of a specific device on the myQ account.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of device
   * @returns {object} containing a success code and a list of devices
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   */
  async getDevice(serialNumber) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }

    const getDevicesResult = await this.getDevices();
    const device = getDevicesResult.devices.find(
      (candidateDevice) => candidateDevice.serial_number === serialNumber
    );
    if (device === undefined) {
      throw new MyQError(
        `Could not find device with serial number '${serialNumber}'`,
        constants.codes.DEVICE_NOT_FOUND
      );
    }

    return {
      code: constants.codes.OK,
      device,
    };
  }

  /**
   * Check whether a door on the myQ account is open or closed.
   *
   * login() must be called before this.
   *
   * Note that this can report back intermediary states between open and closed as well.
   *
   * @param {string} serialNumber Serial number of door
   * @returns {object} containing a success code and the state of the door
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  async getDoorState(serialNumber) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }

    try {
      return await this._getDeviceState(serialNumber, constants._stateAttributes.doorState);
    } catch (error) {
      if (error.code === constants.codes.DEVICE_STATE_NOT_FOUND) {
        // If the state attribute is not found on the device, we assume this is because the device
        // is not a door and not because the service returned something invalid.
        throw new MyQError(
          `Device with serial number '${serialNumber}' is not a door.`,
          constants.codes.INVALID_DEVICE
        );
      }

      throw error;
    }
  }

  /**
   * Check whether a light on the myQ account is turned on or turned off.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of light
   * @returns {object} containing a success code and the state of the light
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  async getLightState(serialNumber) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }

    try {
      return await this._getDeviceState(serialNumber, constants._stateAttributes.lightState);
    } catch (error) {
      if (error.code === constants.codes.DEVICE_STATE_NOT_FOUND) {
        // If the state attribute is not found on the device, we assume this is because the device
        // is not a light and not because the service returned something invalid.
        throw new MyQError(
          `Device with serial number '${serialNumber}' is not a light.`,
          constants.codes.INVALID_DEVICE
        );
      }

      throw error;
    }
  }

  /**
   * Open or close a door on the myQ account.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of door
   * @param {symbol} action Action from MyQ.actions.door to request on door
   * @returns {object} containing a success code
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  async setDoorState(serialNumber, action) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (action === undefined) {
      throw new MyQError('Action parameter is not specified.', constants.codes.INVALID_ARGUMENT);
    }
    if (typeof action !== 'symbol') {
      throw new MyQError(
        `Specified action parameter is not a symbol; valid actions are MyQ.actions.door.OPEN and MyQ.actions.door.CLOSE.`,
        constants.codes.INVALID_ARGUMENT
      );
    }

    // Map valid symbol actions to their string equivalents that the service accepts.
    let _action;
    switch (action) {
      case actions.door.OPEN:
        _action = constants._actions.door.open;
        break;
      case actions.door.CLOSE:
        _action = constants._actions.door.close;
        break;
      default:
        throw new MyQError(
          `Invalid action parameter '${action.toString()}' specified for a door; valid actions are MyQ.actions.door.OPEN and MyQ.actions.door.CLOSE.`,
          constants.codes.INVALID_ARGUMENT
        );
    }

    try {
      return await this._setDeviceState(
        serialNumber,
        _action,
        constants._stateAttributes.doorState
      );
    } catch (error) {
      if (error.code === constants.codes.DEVICE_STATE_NOT_FOUND) {
        // If the state attribute is not found on the device, we assume this is because the device
        // is not a door and not because the service returned something invalid.
        throw new MyQError(
          `Device with serial number '${serialNumber}' is not a door.`,
          constants.codes.INVALID_DEVICE
        );
      }

      throw error;
    }
  }

  /**
   * Turn on or turn off a light on the myQ account.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of light
   * @param {symbol} action Action from MyQ.actions.light to request on light
   * @returns {object} containing a success code
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  async setLightState(serialNumber, action) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (action === undefined) {
      throw new MyQError('Action parameter is not specified.', constants.codes.INVALID_ARGUMENT);
    }
    if (typeof action !== 'symbol') {
      throw new MyQError(
        `Specified action parameter is not a symbol; valid actions are MyQ.actions.light.TURN_ON and MyQ.actions.light.TURN_OFF.`,
        constants.codes.INVALID_ARGUMENT
      );
    }

    // Map valid symbol actions to their string equivalents that the service accepts.
    let _action;
    switch (action) {
      case actions.light.TURN_ON:
        _action = constants._actions.light.turnOn;
        break;
      case actions.light.TURN_OFF:
        _action = constants._actions.light.turnOff;
        break;
      default:
        throw new MyQError(
          `Invalid action parameter '${action.toString()}' specified for a light; valid actions are MyQ.actions.light.TURN_ON and MyQ.actions.light.TURN_OFF.`,
          constants.codes.INVALID_ARGUMENT
        );
    }

    try {
      return await this._setDeviceState(
        serialNumber,
        _action,
        constants._stateAttributes.lightState
      );
    } catch (error) {
      if (error.code === constants.codes.DEVICE_STATE_NOT_FOUND) {
        // If the state attribute is not found on the device, we assume this is because the device
        // is not a light and not because the service returned something invalid.
        throw new MyQError(
          `Device with serial number '${serialNumber}' is not a light.`,
          constants.codes.INVALID_DEVICE
        );
      }

      throw error;
    }
  }

  /**
   * Get the account ID of the myQ account.
   *
   * This is meant for internal use, but this is exposed in case one wants to fetch the account ID.
   * login() must be called before this.
   *
   * @returns {object} containing a success code and the account ID
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   */
  async _getAccountId() {
    const getAccountServiceResponse = await this._executeServiceRequest({
      baseURL: constants._baseUrls.auth,
      url: constants._routes.account,
      method: 'get',
      params: {
        expand: 'account',
      },
    });
    if (
      !getAccountServiceResponse ||
      !getAccountServiceResponse.data ||
      !getAccountServiceResponse.data.Account ||
      getAccountServiceResponse.data.Account.Id == null
    ) {
      throw new MyQError(
        'Service did not return account ID in response.',
        constants.codes.INVALID_SERVICE_RESPONSE
      );
    }
    this._accountId = getAccountServiceResponse.data.Account.Id;

    return {
      code: constants.codes.OK,
      accountId: this._accountId,
    };
  }

  /**
   * Get the value of a state attribute for a device on the myQ account.
   *
   * This is meant for internal use, but this is exposed in case one wants to fetch artibrary state
   * attributes for a device. login() must be called before this.
   *
   * @param {string} serialNumber Serial number of device
   * @param {string} _stateAttribute State attribute to fetch value of
   * @returns {object} containing a success code and the state of the door
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} DEVICE_STATE_NOT_FOUND
   */
  async _getDeviceState(serialNumber, _stateAttribute) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (_stateAttribute === undefined) {
      throw new MyQError(
        'State attribute parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof _stateAttribute !== 'string') {
      throw new MyQError(
        'Specified state attribute parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }

    const getDeviceResult = await this.getDevice(serialNumber);
    if (!getDeviceResult.device.state || !(_stateAttribute in getDeviceResult.device.state)) {
      throw new MyQError(
        `State attribute '${_stateAttribute}' is not present on device.`,
        constants.codes.DEVICE_STATE_NOT_FOUND
      );
    }

    return {
      code: constants.codes.OK,
      deviceState: getDeviceResult.device.state[_stateAttribute],
    };
  }

  /**
   * Initiate an action for a device on the myQ account.
   *
   * This is meant for internal use, but this is exposed in case one wants to initiate arbitrary
   * actions for a device (e.g. for a device without first-class support in this API). login() must
   * be called before this.
   *
   * The _stateAttribute parameter would not be needed here normally. Since a 500 error is returned
   * from the service when a state update is not supported on a device, however, we check that the
   * state attribute we want to update is present on the device before we attempt a state update.
   *
   * @param {string} serialNumber Serial number of device
   * @param {string} _action Action to request on device
   * @param {string} _stateAttribute State attribute to ensure presence of beforehand
   * @returns {object} containing a success code and the state of the door
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} DEVICE_STATE_NOT_FOUND
   */
  async _setDeviceState(serialNumber, _action, _stateAttribute) {
    if (serialNumber === undefined) {
      throw new MyQError(
        'Serial number parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof serialNumber !== 'string') {
      throw new MyQError(
        'Specified serial number parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (_action === undefined) {
      throw new MyQError('Action parameter is not specified.', constants.codes.INVALID_ARGUMENT);
    }
    if (typeof _action !== 'string') {
      throw new MyQError(
        'Specified action parameter is not a string.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (_stateAttribute === undefined) {
      throw new MyQError(
        'State attribute parameter is not specified.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    if (typeof _stateAttribute !== 'string') {
      throw new MyQError(
        `Specified state attribute parameter is not a string.`,
        constants.codes.INVALID_ARGUMENT
      );
    }

    // A 500 error is returned from the service when a state update is not supported on a device. We
    // can get around this by validating that the state attribute we want to update is present on
    // the device before we attempt a state update. We check the set of cached devices to see
    // whether the device has been cached and if so, we throw an error if the state attribute is not
    // present on it. Otherwise, we call _getDeviceState to fetch the device and to throw the same
    // error if the state attribute is not present on it.
    const device =
      Array.isArray(this._devices) &&
      this._devices.find((candidateDevice) => candidateDevice.serial_number === serialNumber);
    // Array.isArray returns false if not an array, while array.find returns undefined if value is not found.
    if (device === false || device === undefined) {
      await this._getDeviceState(serialNumber, _stateAttribute);
    } else if (!device.state || !(_stateAttribute in device.state)) {
      throw new MyQError(
        `State attribute '${_stateAttribute}' is not present on device.`,
        constants.codes.DEVICE_STATE_NOT_FOUND
      );
    }

    if (this._accountId == null) {
      // Fetch the account ID if we have not already. This should be fetched and cached already in a
      // normal execution flow since getDevices() needs to be called before this and that also needs
      // the account ID, but we check anyway for added safety.
      await this._getAccountId();
    }
    await this._executeServiceRequest({
      baseURL: constants._baseUrls.device,
      url: constants._routes.setDevice
        .replace('{accountId}', this._accountId)
        .replace('{serialNumber}', serialNumber),
      method: 'put',
      data: { action_type: _action },
    });

    return {
      code: constants.codes.OK,
    };
  }

  /**
   * Execute a myQ service request.
   *
   * This is meant for internal use, but this is exposed in case one wants to send arbitrary
   * requests to the myQ service.
   *
   * Default values for header fields are used if they are not explicitly specified. Specify null
   * for such fields in order to avoid sending them as part of the request. In particular, the
   * SecurityToken field is set to the cached security token by default if it is not explicitly
   * specified. If the SecurityToken field is not specified and the security token is not cached, an
   * error is thrown. Specify a null SecurityToken in order to avoid sending it as part of the
   * request and prevent the error from being thrown.
   *
   * @param {object} _config axios config: https://github.com/axios/axios#request-config
   * @returns {object} axios response: https://github.com/axios/axios#response-schema
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} AUTHENTICATION_FAILED
   * @throws {MyQError} AUTHENTICATION_FAILED_ONE_TRY_LEFT
   * @throws {MyQError} AUTHENTICATION_FAILED_LOCKED_OUT
   * @throws {MyQError} DEVICE_NOT_FOUND
   */
  async _executeServiceRequest(_config) {
    if (_config === undefined) {
      throw new MyQError('Config parameter is not specified.', constants.codes.INVALID_ARGUMENT);
    }
    // null and arrays are also typeof object - they need to be checked for explicitly.
    if (typeof _config !== 'object' || _config === null || Array.isArray(_config)) {
      throw new MyQError(
        'Specified config parameter is not an object.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    // Validate _config.headers only if it is specified.
    // null and arrays are also typeof object - they need to be checked for explicitly.
    if (
      _config.headers !== undefined &&
      (typeof _config.headers !== 'object' ||
        _config.headers === null ||
        Array.isArray(_config.headers))
    ) {
      throw new MyQError(
        'Specified headers in config parameter is not an object.',
        constants.codes.INVALID_ARGUMENT
      );
    }
    // LOGIN_REQUIRED should not be thrown if the user provides a security token. The user can pass
    // in a null security token in order to bypass this error and not send a security token as part
    // of the request.
    if (
      this._securityToken == null &&
      (!_config.headers || _config.headers.SecurityToken === undefined)
    ) {
      throw new MyQError(
        'Not logged in. Please call login() first.',
        constants.codes.LOGIN_REQUIRED
      );
    }

    // User-specified config (if provided) should overwrite defaults.
    // Object spread operator handles undefined and null values.
    const config = {
      ..._config,
      headers: {
        ...constants._headers,
        SecurityToken: this._securityToken,
        ..._config.headers,
      },
    };
    // Remove fields from the headers if the associated value is undefined or null.
    Object.entries(config.headers).forEach(([key, value]) => {
      if (value == null) {
        delete config.headers[key];
      }
    });

    try {
      return await axios(config);
    } catch (error) {
      return ErrorHandler.handleServiceError(error);
    }
  }
}

MyQ.actions = actions;
MyQ.constants = constants;

module.exports = MyQ;
