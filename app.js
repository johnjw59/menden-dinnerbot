// Module includes.
require('dotenv').config();
var schedule = require('node-schedule');
var moment = require('moment');
var Wit = require('node-wit').Wit;
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var dataHandler = require('./libs/dataHandler.js');
var messageHandler = require('./libs/messageHandler.js');

// Service connections.
var rtm = new RtmClient(process.env.SLACK_BOT_TOKEN);
var wit = new Wit({accessToken: process.env.WIT_ACCESS_TOKEN});

rtm.start();

// React to messages.
rtm.on(RTM_EVENTS.MESSAGE, function(message) {
  // We only care about regular messages that mention us or are direct messages.
  if (!('subtype' in message) && (message.user != process.env.SLACK_BOT_ID) &&
    ((message.text.indexOf(process.env.SLACK_BOT_ID) != -1) || (message.channel == process.env.SLACK_BOT_DM_ID))) {

    console.log(JSON.stringify(message));

    rtm.sendTyping(message.channel);

    if (message.text.toLowerCase().indexOf('help') != -1) {
      // Send help message.
      rtm.sendMessage('You can read about what I\'m capable of here: https://github.com/johnjw59/menden-dinnerbot#commands', message.channel);
    }
    else {
      wit.message(message.text, {})
      .then(function(data) {
        console.log(JSON.stringify(data));

        if ('intent' in data.entities) {
          data.slack = message;
          messageHandler(data)
            .then(function(msg) {
              rtm.sendMessage(msg, message.channel);
            }, function(err) {
              rtm.sendMessage('Sorry, there was a problem.', message.channel);
              console.error(err);
            }
          );
        }
        else {
          // Send "I don't understand that" message.
          rtm.sendMessage('Sorry, I don\'t understand what you said. Type "help" if you need assistance.', message.channel);
        }
      }, function(err) {
        console.error(err);
      });
    }
  }
});


////////////////////
// Scheduled Jobs //
////////////////////

/*var recurrence = {
  dayOfWeek: 4,
  hour: 18,
  minute: 30,
};

// Post reminder on schedule.
schedule.scheduleJob(recurrence, function() {
  // Just mock the data we need to trigger the correct reminderHandler.
  messageHandler({entities: {intent: {0: {value: 'reminder'} } } })
    .then(function(){
      // Nothing to do here.
    }, function(err) {
      console.error(err);
    });
});

// Update users next date each week.
recurrence.dayOfWeek = 1;
schedule.scheduleJob(recurrence, function() {
  var last = dataHandler.getLast();
  var curr = dataHandler.getUsers(moment(moment().format('YYYY-MM-DD')).day(1).unix());

  if (curr !== null) {
    dataHandler.updateNext(curr[0], moment(last.next, 'X').add(1, 'w').unix());
  }
});*/
