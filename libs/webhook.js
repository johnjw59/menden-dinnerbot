/**
 * Functionality for Slack webhook.
 */

/**
 * Post a reminder on a schedule.
 */
exports.init = function() {
  var schedule = require('node-schedule');

  // We're going to post every Thursday at 5pm.
  var rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = 4;
  rule.hour = 17;
  rule.minute = 0;

  schedule.scheduleJob(rule, function() {
    postReminder();
  });
};

/**
 * Post reminder about who's next on dinners.
 */
function postReminder() {
  var data = require('../libs/data.js');
  var next = data.getNext();
  var follower = data.getFollower(next.next);

  send(`${next.users[0]} and ${next.users[1]}, you two are on dinners next week!\n` +
        `${follower.users[0]} and ${follower.users[1]}, you guys are doing the discussion!`);
}

/**
 * Simply send message to slack.
 */
function send(msg) {
  var request = require('request');

  request({
    url: process.env.WEBHOOK,
    method: "POST",
    json: {"text": msg}
  }, function(err, resp, body) {
    if (!!err) {
      console.error(err);
    }
  });
}
