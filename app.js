// Module includes.
require('dotenv').config();
var schedule = require('node-schedule');
var moment = require('moment');
var Wit = require('node-wit').Wit;
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var scheduler = require('./libs/scheduler.js');
var messageHandler = require('./libs/messageHandler.js');

// Service connections.
var rtm = new RtmClient(process.env.SLACK_BOT_TOKEN);
var wit = new Wit({accessToken: process.env.WIT_ACCESS_TOKEN});

rtm.start();

// React to messages.
rtm.on(RTM_EVENTS.MESSAGE, function(message) {
  // We only care about regular messages that mention us.
  if (!('subtype' in message) && (message.text.indexOf(process.env.SLACK_BOT_ID) != -1)) {
    console.log(JSON.stringify(message));

    rtm.sendTyping(message.channel);

    if (message.text.toLowerCase().indexOf('help') == -1) {
      wit.message(message.text, {})
      .then(function(data) {
        console.log(JSON.stringify(data));

        if ('intent' in data.entities) {
          data.slack = message;
          messageHandler(data)
            .then(function(msg) {
              rtm.sendMessage(msg, message.channel);
            }, function(err) {
              console.error(err);
            }
          );
        }
        else {
          // Send "I don't understand that" message.
          rtm.sendMessage('Sorry, I don\'t understand what you said. Go ask John what you did wrong.', message.channel);
        }
      }, function(err) {
        console.error(err);
      });
    }
    else {
      // Send help message.
      rtm.sendMessage('Go ask John for help, I\'m busy!', message.channel);
    }
  }
});

// Post reminder on schedule.
var recurrence = {
  dayOfWeek: 4,
  hour: 18,
  minute: 30,
};

schedule.scheduleJob(recurrence, function() {
  var next = scheduler.getNext();
  var follower = scheduler.getFollower(next.next);

  if ((next != null)) {
    var message = `${next.users[0]} and ${next.users[1]}, you two are on dinners next week!\n`;

    if (follower != null) {
      message += `${follower.users[0]} and ${follower.users[1]}, you guys are doing the discussion!`;
    }

    rtm.sendMessage(message, 'C3Q22SRHC');
  }
});

// Update users next date each week.
recurrence.dayOfWeek = 1;
schedule.scheduleJob(recurrence, function() {
  var last = scheduler.getLast();
  var curr = scheduler.getUsers(moment(moment().format('YYYY-MM-DD')).day(1).unix());

  scheduler.updateNext(curr[0], moment(last.next, 'X').add(1, 'w').unix());
});
