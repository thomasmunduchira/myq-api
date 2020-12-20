const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when error is returned from dependency', async () => {
  const account = new MyQ();
  const promise = account._getAccountId();

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when no data is returned', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getAccountId();

  await expect(promise).rejects.toThrow('Service did not return account ID in response');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('fails when no account is returned', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { fake: null });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getAccountId();

  await expect(promise).rejects.toThrow('Service did not return account ID in response');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('fails when no account ID is returned', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { fake: null } });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getAccountId();

  await expect(promise).rejects.toThrow('Service did not return account ID in response');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('succeeds', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onGet(
      MyQ.constants._routes.account,
      { params: { expand: 'account' } },
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': expect.any(String),
        SecurityToken: 'securityToken',
      })
    )
    .replyOnce(200, { Account: { Id: 'accountId' } });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._getAccountId();

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    accountId: 'accountId',
  });
  expect(account._accountId).toEqual('accountId');
});
