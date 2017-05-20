// Module includes.
require('dotenv').config();
var schedule = require('node-schedule');

// Slack includes.
var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;

// Local includes.
var data = require('./libs/data.js');

var web = new WebClient(process.env.SLACK_API_TOKEN);
var rtm = new RtmClient(process.env.SLACK_BOT_TOKEN);

rtm.start();

// Post reminder on schedule.
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = 4;
rule.hour = 18;
rule.minute = 30;

schedule.scheduleJob(rule, function() {
  postReminder();
});

/**
 * Send reminder message to #dinners.
 */
function postReminder() {
  var next = data.getNext();
  var follower = data.getFollower(next.next);

  var message = `${next.users[0]} and ${next.users[1]}, you two are on dinners next week!\n` +
                `${follower.users[0]} and ${follower.users[1]}, you guys are doing the discussion!`;

  rtm.sendMessage(message, 'C3Q22SRHC');
}

