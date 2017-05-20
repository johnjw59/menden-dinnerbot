// Module includes.
require('dotenv').config();
var schedule = require('node-schedule');
var moment = require('moment');

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

// Update users next date.
rule.dayOfWeek = 1;
schedule.scheduleJob(rule, function() {
  updateNext();
})

/**
 * Send reminder message to #dinners.
 */
function postReminder() {
  var next = data.getNext();
  var follower = data.getFollower(next.next);

  var message = `<@${next.users[0]}> and <@${next.users[1]}>, you two are on dinners next week!\n` +
                `<@${follower.users[0]}> and <@${follower.users[1]}>, you guys are doing the discussion!`;

  rtm.sendMessage(message, 'C3Q22SRHC');
}

/**
 * Update the dates users will be on.
 */
function updateNext() {
  var today = moment(moment().format('YYYY-MM-DD')).unix()
  var schedule = data.getSchedule();

  for (var i=0; i < schedule.length; i++) {
    if (schedule[i].next <= today) {
      // Advance the users next date by a number of weeks equal to the number of pairs.
      var next = moment(today).add(schedule.length, 'w');
      data.updateNext(schedule[i].users[0], next.unix());
    }
  }
}
