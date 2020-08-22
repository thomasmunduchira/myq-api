const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when serial number parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account.getDevice();

  await expect(promise).rejects.toThrow('Serial number parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when serial number parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account.getDevice(0);

  await expect(promise).rejects.toThrow('Specified serial number parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when error is returned from dependency', async () => {
  const account = new MyQ();
  const promise = account.getDevice('serialNumber');

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
    .replyOnce(200, { items: [] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevice('serialNumber');

  await expect(promise).rejects.toThrow(`Could not find device with serial number 'serialNumber'`);
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_NOT_FOUND,
  });
});

test('fails when returned devices do not have serial numbers', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, { items: [{ fake: null }, { fake: null }] });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevice('serialNumber');

  await expect(promise).rejects.toThrow(`Could not find device with serial number 'serialNumber'`);
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_NOT_FOUND,
  });
});

test('fails when device is not found in set of returned devices', async () => {
  axiosMock
    .onAny(MyQ.constants._routes.login)
    .replyOnce(200, { SecurityToken: 'securityToken' })
    .onAny(MyQ.constants._routes.account)
    .replyOnce(200, { Account: { Id: 'accountId' } })
    .onAny(MyQ.constants._routes.getDevices.replace(/{|}/g, ''))
    .replyOnce(200, {
      items: [{ serial_number: 'otherSerialNumber1' }, { serial_number: 'otherSerialNumber2' }],
    });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevice('serialNumber');

  await expect(promise).rejects.toThrow(`Could not find device with serial number 'serialNumber'`);
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.DEVICE_NOT_FOUND,
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
        { serial_number: 'otherSerialNumber1' },
        { serial_number: 'serialNumber' },
        { serial_number: 'otherSerialNumber2' },
      ],
    });

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.getDevice('serialNumber');

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
    device: { serial_number: 'serialNumber' },
  });
});
