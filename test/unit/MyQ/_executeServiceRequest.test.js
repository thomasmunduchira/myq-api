const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when config parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest();

  await expect(promise).rejects.toThrow('Config parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when config parameter is null', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest(null);

  await expect(promise).rejects.toThrow('Specified config parameter is not an object.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when config parameter is an array', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest([]);

  await expect(promise).rejects.toThrow('Specified config parameter is not an object.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when config parameter is not an object', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest(0);

  await expect(promise).rejects.toThrow('Specified config parameter is not an object.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when headers in config parameter is null', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest({ headers: null });

  await expect(promise).rejects.toThrow('Specified headers in config parameter is not an object.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when headers in config parameter is an array', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest({ headers: [] });

  await expect(promise).rejects.toThrow('Specified headers in config parameter is not an object.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when headers in config parameter is not an object', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest({ headers: 0 });

  await expect(promise).rejects.toThrow('Specified headers in config parameter is not an object.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when not logged in and no headers specified via config parameter', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest({ fake: null });

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when not logged in and no security token specified via config parameter', async () => {
  const account = new MyQ();
  const promise = account._executeServiceRequest({ headers: { fake: null } });

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
  });
});

test('fails when service returns a generic error', async () => {
  axiosMock.onAny(MyQ.constants._routes.login).replyOnce(300);

  const account = new MyQ();
  const promise = account._executeServiceRequest({
    baseURL: MyQ.constants._baseUrls.auth,
    url: MyQ.constants._routes.login,
    method: 'post',
    headers: {
      SecurityToken: null,
    },
  });

  await expect(promise).rejects.toThrow('Unidentified error returned from service.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_SERVICE_RESPONSE,
  });
});

test('succeeds when logged in and no headers specified via config parameter', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onGet(
      MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
      undefined,
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': expect.any(String),
        SecurityToken: 'securityToken',
      })
    )
    .replyOnce(200, { items: ['device1', 'device2'] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._executeServiceRequest({
    baseURL: MyQ.constants._baseUrls.device,
    url: MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
    method: 'get',
  });

  await expect(promise).resolves.toMatchObject({
    data: { items: ['device1', 'device2'] },
  });
});

test('succeeds when not logged in and null security token specified via config parameter', async () => {
  axiosMock
    .onPost(
      MyQ.constants._routes.login,
      undefined,
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': expect.any(String),
      })
    )
    .replyOnce(200, { SecurityToken: 'securityToken' });

  const account = new MyQ();
  const promise = account._executeServiceRequest({
    baseURL: MyQ.constants._baseUrls.auth,
    url: MyQ.constants._routes.login,
    method: 'post',
    headers: {
      SecurityToken: null,
    },
  });

  await expect(promise).resolves.toMatchObject({
    data: { SecurityToken: 'securityToken' },
  });
});

test('succeeds when not logged in and security token specified via config parameter', async () => {
  axiosMock
    .onGet(
      MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
      undefined,
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': expect.any(String),
        SecurityToken: 'securityToken',
      })
    )
    .replyOnce(200, { items: ['device1', 'device2'] });

  const account = new MyQ();
  const promise = account._executeServiceRequest({
    baseURL: MyQ.constants._baseUrls.device,
    url: MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
    method: 'get',
    headers: {
      SecurityToken: 'securityToken',
    },
  });

  await expect(promise).resolves.toMatchObject({
    data: { items: ['device1', 'device2'] },
  });
});

test('succeeds when user agent specified via config parameter', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onGet(
      MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
      undefined,
      expect.objectContaining({
        ...MyQ.constants._headers,
        'User-Agent': 'userAgent',
        SecurityToken: 'securityToken',
      })
    )
    .replyOnce(200, { items: ['device1', 'device2'] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account._executeServiceRequest({
    baseURL: MyQ.constants._baseUrls.device,
    url: MyQ.constants._routes.getDevices.replace(/{|}/g, ''),
    method: 'get',
    headers: {
      'User-Agent': 'userAgent',
    },
  });

  await expect(promise).resolves.toMatchObject({
    data: { items: ['device1', 'device2'] },
  });
});
