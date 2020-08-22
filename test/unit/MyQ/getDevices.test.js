const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when error is returned from dependency', async () => {
  const account = new MyQ();
  const promise = account.getDevices();

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when no devices are returned', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevices();

  await expect(promise).rejects.toThrow('Service did not return valid devices in response.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('fails when set of returned devices is invalid', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: 0 });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevices();

  await expect(promise).rejects.toThrow('Service did not return valid devices in response.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('succeeds', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onGet(
      MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
      undefined,
      expect.objectContaining({
        ...MyQ.constants._headers,
        SecurityToken: 'securityToken',
      })
    )
    .replyOnce(200, { items: ['device1', 'device2'] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevices();

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    devices: ['device1', 'device2'],
  });
  expect(account._devices).toEqual(['device1', 'device2']);
});

test('succeeds when no devices are returned', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: [] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevices();

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    devices: [],
  });
  expect(account._devices).toEqual([]);
});

test('succeeds when account ID is cached', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: ['device1', 'device2'] });

  const account = new MyQ();
  await account.login('email', 'password');
  await account._getAccountId();
  const promise = account.getDevices();

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    devices: ['device1', 'device2'],
  });
  expect(account._devices).toEqual(['device1', 'device2']);
});
