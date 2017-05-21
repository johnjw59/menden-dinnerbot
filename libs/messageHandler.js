/**
 * Handles messages from Wit and builds responses.
 */

var moment = require('moment');
var scheduler = require('./scheduler.js');

var botID = '<@U5G5UJ0QN>';

/**
 * Starting point of message interpretation.
 * Will figure out how to handle message.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleMessage(data) {
  var ret = '';

   switch (data.entities.intent[0].value) {
     case 'get':
       ret = handleGet(data);
       break;

     case 'skip':
       ret = handleSkip(data);
       break;

     case 'swap':
       ret = handleSwap(data);
       break;
   }

   return ret;
}

/*******************************
 **     HELPER FUNCTIONS      **
 *******************************/

/**
 * Handle a "get" intent.
 * User could be trying to get the next dinner, a date for a user
 * or users for a date.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleGet(data) {
  var ret = '';

  if ('datetime' in data.entities) {

  }
  else if (('contact' in data.entities) && (data.entities.contact.length > 1)) {

  }
  else {
    var next = scheduler.getNext();
    ret = `${next.users[0]} and ${next.users[1]} are on next.`
  }

  return ret;
}

/**
 * Handle a "skip" intent.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleSkip(data) {


  return '';
}

/**
 * Handle a "swap" intent.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleSwap(data) {


  return '';
}

module.exports = handleMessage;
