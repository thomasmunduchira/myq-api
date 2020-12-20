const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when serial number parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState(undefined, 'action', 'stateAttribute');

  await expect(promise).rejects.toThrow('Serial number parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when action parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState('serialNumber', undefined, 'stateAttribute');

  await expect(promise).rejects.toThrow('Action parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when state attribute parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState('serialNumber', 'action', undefined);

  await expect(promise).rejects.toThrow('State attribute parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when serial number parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState(0, 'action', 'stateAttribute');

  await expect(promise).rejects.toThrow('Specified serial number parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when action parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState('serialNumber', 0, 'stateAttribute');

  await expect(promise).rejects.toThrow('Specified action parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when state attribute parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState('serialNumber', 'action', 0);

  await expect(promise).rejects.toThrow('Specified state attribute parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when error is returned from dependency', async () => {
  const account = new MyQ();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when cached device has no state object', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: [{ serial_number: 'serialNumber' }] });

  const account = new MyQ();
  await account.login('email', 'password');
  await account.getDevices();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).rejects.toThrow(
    "State attribute 'stateAttribute' is not present on device."
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_STATE_NOT_FOUND,
  });
});

test('fails when state attribute is not found on cached device', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: [{ serial_number: 'serialNumber', state: { fake: null } }] });

  const account = new MyQ();
  await account.login('email', 'password');
  await account.getDevices();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

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
    })
    .onPut(
      MyQ.constants._routes.setDevice.replace(/{|}/g, ''),
      {
        action_type: 'action',
      },
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': expect.any(String),
        SecurityToken: 'securityToken',
      })
    )
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});

test('succeeds when account ID is cached', async () => {
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
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  await account._getAccountId();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});

test('succeeds when device is cached', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, {
      items: [
        { serial_number: 'otherSerialNumber1' },
        { serial_number: 'serialNumber', state: { stateAttribute: 'deviceState' } },
        { serial_number: 'otherSerialNumber2' },
      ],
    })
    .onAny(MyQ.constants._routes.setDevice.replace(/{|}/g, ''))
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  await account.getDevices();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});

test('succeeds when cached devices do not have serial numbers', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, {
      items: [{ fake: null }, { fake: null }],
    })
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
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  await account.getDevices();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});

test('succeeds when device is not found in set of cached devices', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, {
      items: [{ serial_number: 'otherSerialNumber1' }, { serial_number: 'otherSerialNumber2' }],
    })
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
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  await account.getDevices();
  const promise = account._setDeviceState('serialNumber', 'action', 'stateAttribute');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});
