const MyQ = require('../../../src/MyQ.js');

test('fails when email parameter is specified', async () => {
  expect(() => new MyQ('email', undefined)).toThrow(
    'Email and password should be specified in login() rather than constructor.'
  );
  try {
    new MyQ('email', undefined);
  } catch (error) {
    expect(error).toMatchObject({
      code: MyQ.constants.codes.INVALID_ARGUMENT,
    });
  }
});

test('fails when password parameter is specified', async () => {
  expect(() => new MyQ(undefined, 'password')).toThrow(
    'Email and password should be specified in login() rather than constructor.'
  );
  try {
    new MyQ(undefined, 'password');
  } catch (error) {
    expect(error).toMatchObject({
      code: MyQ.constants.codes.INVALID_ARGUMENT,
    });
  }
});

test('succeeds', async () => {
  const account = new MyQ();

  expect(account._securityToken).toBeNull();
  expect(account._accountId).toBeNull();
  expect(account._devices).toEqual([]);
});
