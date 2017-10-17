// Module includes.
require('dotenv').config();
var schedule = require('node-schedule');
var moment = require('moment');
var Wit = require('node-wit').Wit;
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var giphy = require('giphy-api')(process.env.GIPHY_API_KEY);

var dataHandler = require('./libs/dataHandler.js');
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


/********************
 ** Scheduled Jobs **
 ********************/

var recurrence = {
  dayOfWeek: 4,
  hour: 18,
  minute: 30,
};

// Post reminder on schedule.
schedule.scheduleJob(recurrence, function() {
  var next = dataHandler.getNext();
  var follower = dataHandler.getFollower(next.next);

  if (next !== null) {
    var message = `${next.users[0]} and ${next.users[1]}, you two are on dinners next week!`;

    if (follower !== null) {
      message += `\n${follower.users[0]} and ${follower.users[1]}, you guys are doing the discussion!`;
    }

    giphy.translate('dinner').then(function(res) {
      rtm.sendMessage(res.data.bitly_gif_url + '\n\n' + message, process.env.SLACK_CHANNEL_ID);
    })
  }
  else if (follower !== null) {
    // Message for if there's no dinner this week, but one next week
    var message = 'Looks like there\'s no dinner this week!\n' +
                  `${follower.users[0]} and ${follower.users[1]}, you guys are doing dinner next week!`;
    rtm.sendMessage(message, process.env.SLACK_CHANNEL_ID);
  }
});

// Update users next date each week.
recurrence.dayOfWeek = 1;
schedule.scheduleJob(recurrence, function() {
  var last = dataHandler.getLast();
  var curr = dataHandler.getUsers(moment(moment().format('YYYY-MM-DD')).day(1).unix());

  if (curr !== null) {
    dataHandler.updateNext(curr[0], moment(last.next, 'X').add(1, 'w').unix());
  }
});
