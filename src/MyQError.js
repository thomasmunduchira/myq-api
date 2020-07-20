/**
 * An error from the myQ API.
 */
class MyQError extends Error {
  /**
   * Construct an error to be returned by the myQ API.
   *
   * @param {string} message Error message
   * @param {string} code Error code
   * @param {object} _serviceError Optional raw service error
   */
  constructor(message, code, _serviceError) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (_serviceError !== undefined) {
      this._serviceError = _serviceError;
    }
  }
}

module.exports = MyQError;
