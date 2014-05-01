var
  express = require('express'),
  bodyParser = require('body-parser'),
  twilio = require('twilio'),
  MyQ = require('liftmaster'),
  garageDoor = new MyQ('chad@developer.email', 'correct horse battery staple'),
  app = express(),
  admins = {
    '+19135555555': 'Chad',
    '+13165555555': 'Laura'
  },
  guests = {
    '+13166666666': 'Evil Mother-in-Law'
  },
  guestDoor = 1,
  doorStates = {
    '1': 'open',
    '2': 'closed',
    '4': 'opening',
    '5': 'closing'
  };

app.use(bodyParser());

app.post('/incoming/call', function(req, res) {
  var
    twiml = new twilio.TwimlResponse(),
    user = admins[req.body.From] || guests[req.body.From],
    admin = admins[req.body.From];
  if(!user) {
    twiml.reject();
    res.status(200).type('text/xml').send(twiml.toString());
  }
  else
    garageDoor.login(function(err) {
      if(err) throw err;
      garageDoor.getDevices(function(err, devices) {
        if(err) throw err;
        twiml.say('Hello ' + user + '.');
        if(admin) {
          devices.forEach(function(device) {
            twiml.say('The ' + device.name + ' is ' + doorStates[device.state] + '.');
          });
          twiml.gather({
            action: '/incoming/gather',
            digits: 1
          }, function(gather) {
            devices.forEach(function(device, i) {
              gather.say('Press ' + (i + 1) + ' to ' + (device.state != 1 ? 'open' : 'close') + ' the ' + device.name + '.');
            });
          });
        }
        else
          twiml.gather({
            action: '/incoming/gather',
            digits: 1
          }, function(gather) {
            var device = devices[guestDoor];
            gather.say('Press 1 to ' + (device.state != 1 ? 'open' : 'close') + ' the ' + device.name + '.');
          });
        res.status(200).type('text/xml').send(twiml.toString());
      });
    });
});

app.post('/incoming/gather', function(req, res) {
  var
    twiml = new twilio.TwimlResponse(),
    user = admins[req.body.From] || guests[req.body.From],
    admin = admins[req.body.From],
    digits = req.body.Digits;
  if(!user || !digits) {
    twiml.hangup();
    res.status(200).type('text/xml').send(twiml.toString());
  }
  else {
    if(digits == 1 || (admin && garageDoor.devices[digits - 1])) {
      var
        device = admin ? garageDoor.devices[digits - 1] : garageDoor.devices[guestDoor],
        desiredState = device.state != 1 ? 1 : 2;
      twiml.say('The ' + device.name + ' is ' + doorStates[desiredState + 3] + '.');
      res.status(200).type('text/xml').send(twiml.toString());
      garageDoor.setDoorState(device.id, desiredState, function(err, device) {
        if(err) throw err;
        console.log('The ' + device.name + ' is now ' + doorStates[device.state] + '.');
      });
    }
    else {
      twiml.say('Invalid selection.');
      res.status(200).type('text/xml').send(twiml.toString());
    }
  }
});

app.listen(1337);