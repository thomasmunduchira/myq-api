const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when serial number parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account._getDeviceState(undefined, 'stateAttribute');

  await expect(promise).rejects.toThrow('Serial number parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when state attribute parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account._getDeviceState('serialNumber', undefined);

  await expect(promise).rejects.toThrow('State attribute parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when serial number parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account._getDeviceState(0, 'stateAttribute');

  await expect(promise).rejects.toThrow('Specified serial number parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when state attribute parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account._getDeviceState('serialNumber', 0);

  await expect(promise).rejects.toThrow('Specified state attribute parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when error is returned from dependency', async () => {
  const account = new MyQ();
  const promise = account._getDeviceState('serialNumber', 'stateAttribute');

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when returned device has no state object', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: [{ serial_number: 'serialNumber' }] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getDeviceState('serialNumber', 'stateAttribute');

  await expect(promise).rejects.toThrow(
    "State attribute 'stateAttribute' is not present on device."
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_STATE_NOT_FOUND,
  });
});

test('fails when state attribute is not found on returned device', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: [{ serial_number: 'serialNumber', state: { fake: null } }] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getDeviceState('serialNumber', 'stateAttribute');

  await expect(promise).rejects.toThrow(
    "State attribute 'stateAttribute' is not present on device."
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_STATE_NOT_FOUND,
  });
});

test('succeeds', async () => {
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
    });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getDeviceState('serialNumber', 'stateAttribute');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    deviceState: 'deviceState',
  });
});
