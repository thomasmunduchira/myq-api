const axios = require('axios');
const AxiosMockAdapter = require('axios-mock-adapter');

const MyQ = require('../../../src/MyQ.js');

const axiosMock = new AxiosMockAdapter(axios);

afterEach(() => {
  axiosMock.reset();
});

test('fails when serial number parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account.setLightState(undefined, MyQ.actions.light.TURN_ON);

  await expect(promise).rejects.toThrow('Serial number parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when action parameter is not specified', async () => {
  const account = new MyQ();
  const promise = account.setLightState('serialNumber', undefined);

  await expect(promise).rejects.toThrow('Action parameter is not specified.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when serial number parameter is not a string', async () => {
  const account = new MyQ();
  const promise = account.setLightState(0, MyQ.actions.light.TURN_ON);

  await expect(promise).rejects.toThrow('Specified serial number parameter is not a string.');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when action parameter is not a symbol', async () => {
  const account = new MyQ();
  const promise = account.setLightState('serialNumber', 0);

  await expect(promise).rejects.toThrow(
    'Specified action parameter is not a symbol; valid actions are MyQ.actions.light.TURN_ON and MyQ.actions.light.TURN_OFF.'
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when action parameter is an invalid symbol', async () => {
  const account = new MyQ();
  const promise = account.setLightState('serialNumber', Symbol('open'));

  await expect(promise).rejects.toThrow(
    "Invalid action parameter 'Symbol(open)' specified for a light; valid actions are MyQ.actions.light.TURN_ON and MyQ.actions.light.TURN_OFF."
  );
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_ARGUMENT,
  });
});

test('fails when error is returned from dependency', async () => {
  const account = new MyQ();
  const promise = account.setLightState('serialNumber', MyQ.actions.light.TURN_ON);

  await expect(promise).rejects.toThrow('Not logged in. Please call login() first');
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.LOGIN_REQUIRED,
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
  const promise = account.setLightState('serialNumber', MyQ.actions.light.TURN_ON);

  await expect(promise).rejects.toThrow(`Device with serial number 'serialNumber' is not a light.`);
  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.INVALID_DEVICE,
  });
});

test('succeeds when action is turn on', async () => {
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
          state: { [MyQ.constants._stateAttributes.lightState]: 'deviceState' },
        },
      ],
    })
    .onAny(MyQ.constants._routes.setDevice.replace(/{|}/g, ''), {
      action_type: MyQ.constants._actions.light.turnOn,
    })
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.setLightState('serialNumber', MyQ.actions.light.TURN_ON);

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});

test('succeeds when action is turn off', async () => {
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
          state: { [MyQ.constants._stateAttributes.lightState]: 'deviceState' },
        },
      ],
    })
    .onAny(MyQ.constants._routes.setDevice.replace(/{|}/g, ''), {
      action_type: MyQ.constants._actions.light.turnOff,
    })
    .replyOnce(200);

  const account = new MyQ();
  await account.login('email', 'password');
  const promise = account.setLightState('serialNumber', MyQ.actions.light.TURN_OFF);

  await expect(promise).resolves.toMatchObject({
    code: MyQ.constants.codes.OK,
  });
});
