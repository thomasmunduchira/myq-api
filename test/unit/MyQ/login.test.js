const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when email parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account.login(undefined, 'password');

  await expect(promise).rejects.toThrow('Email parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when password parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account.login('email', undefined);

  await expect(promise).rejects.toThrow('Password parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when email parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account.login(0, 'password');

  await expect(promise).rejects.toThrow('Specified email parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when password parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account.login('email', 0);

  await expect(promise).rejects.toThrow('Specified password parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when no data is returned', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(200);

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow('Service did not return security token in response.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('fails when no security token is returned', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(200, { fake: null });

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).rejects.toThrow('Service did not return security token in response.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('succeeds', async () => {
  axiosMock
    .onPost(
      MyQ.constants._routes.login,
      {
        Username: 'email',
        Password: 'password',
      },
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': expect.any(String),
      })
    )
    .replyOnce(200, { SecurityToken: 'securityToken' });

  const account = new MyQ();
  const promise = account.login('email', 'password');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    securityToken: 'securityToken',
  });
  expect(account._securityToken).toEqual('securityToken');
  expect(account._accountId).toBeNull();
  expect(account._devices).toEqual([]);
});

test('succeeds when previously logged in', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken1' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: ['device1', 'device2'] })
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken2' });

  const account = new MyQ();
  await account.login('email1', 'password1');
  await account.getDevices();
  const promise = account.login('email2', 'password2');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    securityToken: 'securityToken2',
  });
  expect(account._securityToken).toEqual('securityToken2');
  expect(account._accountId).toBeNull();
  expect(account._devices).toEqual([]);
});
