const constants = {
  endpoint: 'https://myqexternal.myqdevice.com',
  appId: 'NWknvuBd7LoFHfXmKNMBcgajXtZEgKUh4V7WNzMidrpUUluDpVYVZx+xT4PCM5Kx',
  allTypeIds: [1, 2, 3, 5, 7, 9, 13, 15, 16, 17],
  errors: {
    11: 'Something unexpected happened. Please wait a bit and try again.',
    12: 'MyQ service is currently down. Please wait a bit and try again.',
    13: 'Not logged in.',
    14: 'Email and/or password are incorrect.',
    15: 'Invalid parameter(s) provided.',
    16: 'User will be locked out due to too many tries. 1 try left.',
    17: 'User is locked out due to too many tries. Please reset password and try again.',
  },
  doorStates: {
    1: 'open',
    2: 'closed',
    3: 'stopped in the middle',
    4: 'going up',
    5: 'going down',
    9: 'not closed',
  },
  lightStates: {
    0: 'off',
    1: 'on',
  },
};

module.exports = constants;
