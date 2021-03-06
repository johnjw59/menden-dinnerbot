/**
 * Handles messages from Wit and builds responses.
 */

var moment = require('moment');
var dataHandler = require('./dataHandler.js');
var WebClient = require('@slack/client').WebClient;
var giphy = require('giphy-api')(process.env.GIPHY_API_KEY);

var slackWeb = new WebClient(process.env.SLACK_API_TOKEN);
var botID = process.env.SLACK_BOT_ID;

/**
 * Starting point of message interpretation.
 * Will figure out how to handle message.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {Promise}
 *         A Promise object containing a message generated by helper functions.
 */
function handleMessage(data) {
   switch (data.entities.intent[0].value) {
    case 'get':
      return handleGet(data);

    case 'skip':
      return handleSkip(data);

    case 'swap':
      return handleSwap(data);

    case 'reminder':
      return handleReminder(data);

    case 'thanks':
      return Promise.resolve('You\'re welcome!');

    default:
      return Promise.reject(`Unhandled intent: ${JSON.stringify(data)}`);
   }
}

/**
 * Handle a "get" intent.
 * User could be trying to get the next dinner, a date for a user
 * or users for a date.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {Promise}
 *         A Promise object containing a message to send back to Slack.
 */
function handleGet(data) {
  if ('datetime' in data.entities) {
    // Grab the Monday of the week the date is in.
    var date = moment(data.entities.datetime[0].value).day(1);
    var users = dataHandler.getUsers(date.unix());

    if (Array.isArray(users)) {
      return Promise.resolve(`${buildUserString(users)} are on ${date.format('MMM Do')}.`);
    }
    else {
      return Promise.resolve(`Looks like no one is scheduled to be on ${date.format('MMM Do')}!`);
    }
  }
  else {
    var users = getMessageUsers(data);

    if (users.length > 0) {
      // Get the userID to use in the lookup and return a message.
      return getUserID(users[0], data.slack.user)
        .then(function(user) {
          var date = dataHandler.getDate(user);

          if (date !== null) {
            return Promise.resolve(`${user} is doing dinner next on ${moment(date, 'X').format('MMM Do')}`);
          }
          else {
            return Promise.resolve(`Looks like ${user} isn't on the dinner schedule.`);
          }
        }, function(err) {
          return Promise.reject(err);
        }
      );
    }
    else {
      // Default to just grabbing the next people scheduled.
      var next = dataHandler.getNext(Infinity);
      if (next.users !== null) {
        return Promise.resolve(`${buildUserString(next.users)} are up next on ${moment(next.next, 'X').format('MMM Do')}.`);
      }
      else {
        return Promise.resolve('Looks like no one is scheduled for the next four weeks!');
      }
    }
  }
}

/**
 * Handle a "skip" intent.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {Promise}
 *         A resolved Promise object containing a confirmation message.
 */
function handleSkip(data) {
  // Default to skipping next Monday.
  var date = moment(moment().format('YYYY-MM-DD')).day(1);
  if (moment().isAfter(date)) {
    date.day(8);
  }

  if ('datetime' in data.entities) {
    date = moment(data.entities.datetime[0].value).day(1);
  }

  dataHandler.postpone(date.unix());

  return Promise.resolve(`I've updated the schedule so there's no dinner on ${date.format('MMM Do')}.`);
}

/**
 * Handle a "swap" intent.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {Promise}
 *         A resolved Promise object containing a confirmation message.
 */
function handleSwap(data) {
  var users = getMessageUsers(data);

  // We need at least two users to be specified (excluding the bot).
  if (users.length >= 2) {

    // We'll assume we're swaping the first and last user mentioned.
    return getUserID(users[0], data.slack.user)
      .then(function(user1) {
        return getUserID(users[users.length -1], data.slack.user)
          .then(function(user2) {
            var msg = `Looks like ${user1} and ${user2} are already on the same day!`;
            if (dataHandler.swapUsers(user1, user2)) {
              msg = `Successfully swapped ${user1}'s and ${user2}'s groups days!`;
            }
            return Promise.resolve(msg);
          }, function(err) {
            return Promise.reject(err);
          }
        );
      }, function(err) {
        return Promise.reject(err);
      }
    );
  }
  else {
    return Promise.resolve('You need to tell me which two users to swap!');
  }
}

/**
 * Handle a "reminder" intent.
 * This will post a reminder in the notification channel and reply that
 * the notification has been posted.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {Promise}
 *         A resolved Promise object containing a confirmation message.
 */
function handleReminder(data) {
  return new Promise(function(resolve, reject) {
    var next = dataHandler.getNext();
    var follower = dataHandler.getFollower(next.next);
    var message = '';

    if (next.users !== null) {
      message = `${buildUserString(next.users)}, you are on dinner next week!`;

      if (follower !== null) {
        message += `\n${buildUserString(follower)}, you guys are doing the discussion!`;
      }

      // Add a gif the reply!
      giphy.random({tag: 'dinner', rating: 'PG-13'}).then(function(res) {
        giphy.id(res.data.id)
          .then(function(res) {
            resolve(message + '\n\n' + res.data[0].bitly_gif_url);
          }, function(err) {
            reject(err);
          });
      });
    }
    else if (follower !== null) {
      // Message for if there's no dinner this week, but one next week.
      resolve('Looks like there\'s no dinner this week!\n' +
              `${buildUserString(follower)}, you guys are doing dinner the week after!`);
    }
    else {
      resolve(null);
    }
  })
  .then(function(msg) {
    if (msg === null) {
      return Promise.resolve('Looks like there\'s no one on for the next two weeks!');
    }
    else {
      // Post the message to the notification channel.
      return slackWeb.chat.postMessage(process.env.SLACK_CHANNEL_ID, msg)
        .then(function(response) {
          return Promise.resolve('The reminder has been posted!');
        }, function (err) {
          return Promise.reject(err);
        });
    }
  }, function(err) {
    return Promise.reject(err);
  });
}


////////////////////////
//  Helper functions  //
////////////////////////

/**
 * Returns an array of users built from Wit data
 *
 * @param  {json}  data
 *         The raw json data sent from Wit
 *
 * @return {array}
 *         An array of the users in the data, excluding the bot user.
 */
function getMessageUsers(data) {
  var user_entities = ['slack_users', 'contact'];
  var users = [];

  for (var i=0; i < user_entities.length; i++) {
    if (user_entities[i] in data.entities) {
      for (var j=0; j < data.entities[user_entities[i]].length; j++) {
        if (data.entities[user_entities[i]][j].value.indexOf(botID) == -1) {
          users.push(data.entities[user_entities[i]][j].value);
        }
      }
    }
  }

  return users;
}

/**
 * Get the userID to use in the dataHandler
 *
 * @param  {string} enteredName
 *         The name entered.
 *
 * @param  {object} sender
 *         The slack user who sent the message.
 *
 * @return {Promise}
 *         A Promise containing a userID to use in lookups.
 */
function getUserID(name, sender) {
  // Check if the name is refering to the person who sent the message.
  return new Promise(function(resolve, reject) {
    if ((name.toLowerCase() == 'i') || (name.toLowerCase() == 'my')) {
      resolve('<@' + sender + '>');
    }
    else if (name.slice(0, 2) == '<@') {
      // Just return slack usernames (wit.ai sometimes drops the ending '>').
      if (name.slice(-1) != '>') {
        name += '>';
      }
      resolve(name);
    }
    else {
      // Look for the name in the list of slack users.
      slackWeb.users.list(function(err, data) {
        if (!err) {
          var userID = null;

          for (var i=0; i < data.members.length; i++) {
            if ('real_name' in data.members[i]) {
              var member = data.members[i].real_name.split(' ');

              for (var j=0; j < member.length; j++) {
                if (member[j].toLowerCase() == name.toLowerCase()) {
                  userID = '<@' + data.members[i].id + '>';
                }
              }
              // Leave loop if we found a userID.
              if (userID !== null) { break; }
            }
          }

          // If everything's failed, just use the name.
          if (userID === null) {
            userID = name.charAt(0).toUpperCase() + name.toLowerCase().slice(1);
          }

          resolve(userID);
        }
        else {
          reject(err);
        }
      });
    }
  });
}

/**
 * Format an array of users into a string for display.
 *
 * @param {array} users
 *   The array of user names.
 *
 * @return {string}
 *   The formatted string for display.
 */
function buildUserString(users) {
  var string = '';

  for (var i=0; i < users.length; i++) {
    string += users[i];

    if (i === (users.length - 2)) {
      string += ' and ';
    }
    else if (i !== (users.length - 1)) {
      string += ', ';
    }
  }

  return string;
}

module.exports = handleMessage;
