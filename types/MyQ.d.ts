import type {
  DeviceResponse,
  DeviceSetStateResponse,
  DeviceStateResponse,
  DevicesResponse,
  LoginResponse,
} from "./types";

export default class MyQ {
  /**
   * Initialize the MyQ API.
   *
   * This used to take in an email and password, but these parameters have been deprecated in favor
   * of login(username, password).
   */
  constructor();

  /**
   * Log into a myQ account and fetch a security token.
   *
   * This must be called before the rest of this API is called.  This used to take in no parameters,
   * but the interface has been updated to take in the account email and password.
   *
   * Note that the security token is short-lived and will not work after some time, so this might
   * have to be called again to retrieve a new security token.
   *
   * @param {string} email Email for the myQ account
   * @param {string} password Password for the myQ account
   * @returns {LoginResponse} containing a success code and security token
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} AUTHENTICATION_FAILED
   * @throws {MyQError} AUTHENTICATION_FAILED_ONE_TRY_LEFT
   * @throws {MyQError} AUTHENTICATION_FAILED_LOCKED_OUT
   */
  public login(
    username: string,
    password: string
  ): Promise<LoginResponse>;

  /**
   * Get the metadata and state of all devices on the myQ account.
   *
   * login() must be called before this.
   *
   * @returns {DevicesResponse} containing a success code and a list of devices
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   */
  public getDevices(): Promise<DevicesResponse>;

  /**
   * Get the metadata and state of a specific device on the myQ account.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of device
   * @returns {DeviceResponse} containing a success code and a list of devices
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   */
  public getDevice(serialNumber: string): Promise<DeviceResponse>;

  /**
   * Check whether a door on the myQ account is open or closed.
   *
   * login() must be called before this.
   *
   * Note that this can report back intermediary states between open and closed as well.
   *
   * @param {string} serialNumber Serial number of door
   * @returns {DeviceStateResponse} containing a success code and the state of the door
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  public getDoorState(serialNumber: string): Promise<DeviceStateResponse>;

  /**
   * Open or close a door on the myQ account.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of door
   * @param {Symbol} action Action from MyQ.actions.door to request on door
   * @returns {DeviceSetStateResponse} containing a success code
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  public setDoorState(
    serialNumber: string,
    action: Symbol
  ): Promise<DeviceSetStateResponse>;

  /**
   * Check whether a light on the myQ account is turned on or turned off.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of light
   * @returns {DeviceStateResponse} containing a success code and the state of the light
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  public getLightState(
    serialNumber: string
  ): Promise<DeviceStateResponse>;

  /**
   * Turn on or turn off a light on the myQ account.
   *
   * login() must be called before this.
   *
   * @param {string} serialNumber Serial number of light
   * @param {Symbol} action Action from MyQ.actions.light to request on light
   * @returns {DeviceSetStateResponse} containing a success code
   * @throws {MyQError} INVALID_ARGUMENT
   * @throws {MyQError} LOGIN_REQUIRED
   * @throws {MyQError} SERVICE_REQUEST_FAILED
   * @throws {MyQError} SERVICE_UNREACHABLE
   * @throws {MyQError} INVALID_SERVICE_RESPONSE
   * @throws {MyQError} DEVICE_NOT_FOUND
   * @throws {MyQError} INVALID_DEVICE
   */
  public setLightState(
    serialNumber: string,
    action: Symbol
  ): Promise<DeviceSetStateResponse>;
}
