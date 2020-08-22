const MyQ = require('../../src/MyQ.js');

test('login() fails when credentials are incorrect', async () => {
  const account = new MyQ();
  const promise = account.login('fake', 'fake');

  await expect(promise).rejects.toMatchObject({
    code: MyQ.constants.codes.AUTHENTICATION_FAILED,
  });
});

test('login() succeeds when credentials are correct', async () => {
  expect(process.env.MYQ_EMAIL).toBeDefined();
  expect(process.env.MYQ_PASSWORD).toBeDefined();

  const account = new MyQ();
  const promise = account.login(process.env.MYQ_EMAIL, process.env.MYQ_PASSWORD);

  await expect(promise).resolves.toEqual(
    expect.objectContaining({
      code: MyQ.constants.codes.OK,
      securityToken: expect.any(String),
    })
  );
});

test('getAccountId() succeeds', async () => {
  expect(process.env.MYQ_EMAIL).toBeDefined();
  expect(process.env.MYQ_PASSWORD).toBeDefined();

  const account = new MyQ();
  await account.login(process.env.MYQ_EMAIL, process.env.MYQ_PASSWORD);
  const promise = account._getAccountId();

  await expect(promise).resolves.toEqual(
    expect.objectContaining({
      code: MyQ.constants.codes.OK,
      accountId: expect.any(String),
    })
  );
});

test('getDevices() succeeds', async () => {
  expect(process.env.MYQ_EMAIL).toBeDefined();
  expect(process.env.MYQ_PASSWORD).toBeDefined();

  const account = new MyQ();
  await account.login(process.env.MYQ_EMAIL, process.env.MYQ_PASSWORD);
  const promise = account.getDevices();

  await expect(promise).resolves.toEqual(
    expect.objectContaining({
      code: MyQ.constants.codes.OK,
      devices: expect.any(Array),
    })
  );
});
