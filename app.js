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
  // We only care about regular messages that mention us or are direct messages.
  if (!('subtype' in message) && (message.user != process.env.SLACK_BOT_ID) &&
    ((message.text.indexOf(process.env.SLACK_BOT_ID) != -1) || (message.channel == process.env.SLACK_BOT_DM_ID))) {

    console.log(JSON.stringify(message));

    rtm.sendTyping(message.channel);

    if (message.text.toLowerCase().indexOf('help') != -1) {
      // Send help message.
      rtm.sendMessage('Go ask John for help, I\'m busy!', message.channel);
    }
    else if (message.text == 'post_reminder') {
      // This is a special message that forces a reminder post.
      // For now it's just set to a magic message trigger, eventually should be
      // integrated into the messageHandler class.
      postReminder();
      rtm.sendMessage('The reminder has been posted!', message.channel);
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
  }
});

/**
 * Posts a reminder into the dinner notification channel.
 */
function postReminder() {
  var next = dataHandler.getNext();
  var follower = dataHandler.getFollower(next.next);
  var message = '';

  if (next.users !== null) {
    message = `${next.users[0]} and ${next.users[1]}, you two are on dinners next week!`;

    if (follower !== null) {
      message += `\n${follower.users[0]} and ${follower.users[1]}, you guys are doing the discussion!`;
    }

    giphy.random('dinner').then(function(res) {
      giphy.id(res.data.id).then(function(res) {
        rtm.sendMessage(message + '\n\n' + res.data[0].bitly_gif_url, process.env.SLACK_CHANNEL_ID);
      });
    });
  }
  else if (follower !== null) {
    // Message for if there's no dinner this week, but one next week
    message = 'Looks like there\'s no dinner this week!\n' +
              `${follower.users[0]} and ${follower.users[1]}, you guys are doing dinner next week!`;
    rtm.sendMessage(message, process.env.SLACK_CHANNEL_ID);
  }
}


////////////////////
// Scheduled Jobs //
////////////////////

var recurrence = {
  dayOfWeek: 4,
  hour: 18,
  minute: 30,
};

// Post reminder on schedule.
schedule.scheduleJob(recurrence, function() {
  postReminder();
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
