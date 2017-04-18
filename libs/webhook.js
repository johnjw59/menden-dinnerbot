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
}

/**
 * Post reminder about who's next on dinners.
 */
function postReminder() {
  var jsonfile = require('jsonfile');
  var dataFile = 'data/schedule.json';

  var today = new Date();
  var nextWeek = today + (7 * 24 * 3600);

  var data = jsonfile.readFileSync(dataFile);

  var current = data.current;
  var nextUp = data.schedule[current];

  // Look for someone who's on this week (should be set).
  if ((nextUp.next < today) && (nextUp.next > nextWeek)) {
    nextUp = null;
    // If the current marker is wrong, search all events.
    for (var i=0; i < data.schedule.length; i++) {
      if ((data.schedule[i].next >= today) && (data.schedule[i].next <= nextWeek)) {

        nextUp = data.schedule[i];
      }
    }
  }

  if (!!nextUp) {
    var follower = data.schedule[nextUp.follower];

    // Craft Slack message.
    var message = `${nextUp.users[0]} and ${nextUp.users[1]}, you two are on dinners next week!\n${follower.users[0]} and ${follower.users[1]}, you guys are doing the discussion!`;
    send(message);

    // Update data.
    data.schedule[current].next += data.schedule.length * (7 * 24 * 3600);
    data.current = nextUp.follower;

    jsonfile.writeFile(dataFile, data, function(err) {
      if (!!err) {
        console.error(err);
      }
    })
  }
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
