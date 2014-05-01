var request = require('request');

var MyQ = module.exports = function(username, password) {
  this.endpoint = 'https://myqexternal.myqdevice.com';
  this.appId = 'Vj8pQggXLhLy0WHahglCD4N1nAkkXQtGYpq2HrHD7H1nvmbT55KqtN6RSF4ILB/i';
  this.username = username;
  this.password = password;
};

MyQ.prototype.login = function(callback) {
  var _self = this;
  request({
    method: 'GET',
    uri: _self.endpoint + '/Membership/ValidateUserWithCulture',
    qs: {
      appId: _self.appId,
      securityToken: null,
      username: _self.username,
      password: _self.password,
      culture: 'en'
    },
    json: true
  }, function(err, res, body) {
    if(err || body.ErrorMessage)
      return callback(err || new Error(body.ErrorMessage));
    _self.userId = body.UserId;
    _self.securityToken = body.SecurityToken;
    return callback(null, body);
  });
};

MyQ.prototype.getDevices = function(callback) {
  var _self = this;
  request({
    method: 'GET',
    uri: _self.endpoint + '/api/UserDeviceDetails',
    qs: {
      appId: _self.appId,
      securityToken: _self.securityToken,
      filterOn: true
    },
    json: true
  }, function(err, res, body) {
    if(err || body.ErrorMessage)
      return callback(err || new Error(body.ErrorMessage));
    _self.devices = [];
    body.Devices.forEach(function(Device, device) {
      if(Device.MyQDeviceTypeId != 2)
        return;
      device = {
        id: Device.DeviceId
      };
      Device.Attributes.forEach(function(attribute) {
        if(attribute.Name == 'desc')
          device.name = attribute.Value;
        if(attribute.Name == 'doorstate') {
          device.state = attribute.Value;
          device.updated = attribute.UpdatedTime;
        }
      });
      _self.devices.push(device);
    });
    return callback(null, _self.devices);
  });
};

MyQ.prototype.getDoorState = function(deviceId, callback) {
  var _self = this;
  request({
    method: 'GET',
    uri: _self.endpoint + '/Device/getDeviceAttribute',
    qs: {
      appId: _self.appId,
      securityToken: _self.securityToken,
      devId: deviceId,
      name: 'doorstate'
    },
    json: true
  }, function(err, res, body) {
    if(err || body.ErrorMessage)
      return callback(err || new Error(body.ErrorMessage));
    _self.devices.forEach(function(device) {
      if(device.id == deviceId) {
        device.state = body.AttributeValue;
        device.updated = body.UpdatedTime;
        return callback(null, device); 
      }
    });
  });
};

MyQ.prototype.setDoorState = function(deviceId, state, callback) {
  var _self = this;
  request({
    method: 'PUT',
    uri: _self.endpoint + '/Device/setDeviceAttribute',
    body: {
      DeviceId: deviceId,
      ApplicationId: _self.appId,
      AttributeName: 'desireddoorstate',
      AttributeValue: state,
      securityToken: _self.securityToken
    },
    json: true
  }, function(err, res, body) {
    if(err || body.ErrorMessage)
      return callback(err || new Error(body.ErrorMessage));
    setTimeout(function() {
      _self._loopDoorState(deviceId, callback);
    }, 1000);
  });
};

MyQ.prototype._loopDoorState = function(deviceId, callback) {
  var _self = this;
  _self.getDoorState(deviceId, function(err, res) {
    if(err)
      return callback(err);
    if(res.state == 4 || res.state == 5)
      setTimeout(function() {
        _self._loopDoorState(deviceId, callback)
      }, 5000);
    else
      return callback(null, res);
  });
};