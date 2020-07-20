const constants = require('./constants');
const MyQError = require('./MyQError');

/**
 * An interface for grouping related utilties for error handling in the myQ API.
 */
class ErrorHandler {
  /**
   * Map errors from axios service requests into an appropiate myQ API error.
   *
   * @param {object} error axios error: https://github.com/axios/axios#handling-errors
   */
  static handleServiceError(error) {
    if (error.response) {
      if (error.response.data) {
        if (error.response.data.code === '400.301') {
          throw new MyQError('Device could not be found.', constants.codes.DEVICE_NOT_FOUND);
        }

        if (error.response.data.code === '401.101') {
          throw new MyQError(
            'Security token has expired. Please call login() again.',
            constants.codes.LOGIN_REQUIRED
          );
        }

        if (error.response.data.code === '401.203') {
          throw new MyQError(
            'Email or password is incorrect.',
            constants.codes.AUTHENTICATION_FAILED
          );
        }

        if (error.response.data.code === '401.205') {
          throw new MyQError(
            'User will be locked out due to too many tries. One try left.',
            constants.codes.AUTHENTICATION_FAILED_ONE_TRY_LEFT
          );
        }

        if (error.response.data.code === '401.207') {
          throw new MyQError(
            'User is locked out due to too many tries. Please reset the password and try again.',
            constants.codes.AUTHENTICATION_FAILED_LOCKED_OUT
          );
        }
      }

      throw new MyQError(
        'Unidentified error returned from service.',
        constants.codes.INVALID_SERVICE_RESPONSE,
        error
      );
    }

    if (error.request) {
      throw new MyQError(
        'Service could not be reached.',
        constants.codes.SERVICE_UNREACHABLE,
        error
      );
    }

    throw new MyQError(
      'Request to service could not be made.',
      constants.codes.SERVICE_REQUEST_FAILED,
      error
    );
  }
}

module.exports = ErrorHandler;
