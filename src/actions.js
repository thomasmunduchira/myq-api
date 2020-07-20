const actions = {
  door: Object.freeze({
    OPEN: Symbol('open'),
    CLOSE: Symbol('close'),
  }),
  light: Object.freeze({
    TURN_ON: Symbol('turnOn'),
    TURN_OFF: Symbol('turnOff'),
  }),
};

module.exports = actions;
