const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when service does not find device', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, {
      items: [
        {
          serial_number: 'serialNumber',
          state: { stateAttribute: 'deviceState' },
        },
      ],
    })
    .onAny(MyQ.constants._routes.setDevice.replace(/{|}/g, ''))
    .replyOnce(400, { code: '400.301' });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).rejects.toThrow('Device could not be found.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_NOT_FOUND,
  });
});

test('fails when security token has expired', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(401, { code: '401.101' });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getAccountId();

  await expect(promise).rejects.toThrow('Security token has expired. Please call login() again.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when service authentication fails due to incorrect credentials', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(401, { code: '401.203' });

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow('Email or password is incorrect.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.AUTHENTICATION_FAILED,
  });
});

test('fails when service authentication fails due to incorrect credentials and there is one try left', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(401, { code: '401.205' });

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow(
    'User will be locked out due to too many tries. One try left.'
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.AUTHENTICATION_FAILED_ONE_TRY_LEFT,
  });
});

test('fails when service authentication fails due to user being locked out', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(401, { code: '401.207' });

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow(
    'User is locked out due to too many tries. Please reset the password and try again.'
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.AUTHENTICATION_FAILED_LOCKED_OUT,
  });
});

test('fails when service returns a generic error', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(300);

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow('Unidentified error returned from service.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('fails when request to service could not be made', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).networkErrorOnce();

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow('Request to service could not be made.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.SERVICE_REQUEST_FAILED,
  });
});
