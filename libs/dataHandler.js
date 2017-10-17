/**
 * Setters and getters for the schedule data.
 */

var moment = require('moment');
var jsonfile = require('jsonfile');
var dataFile = 'data/schedule.json';

/**
 * Looks for the next person by date by making calls to get().
 *
 * @param {int} num_tries
 *        The number of weeks to keep looking for a result at.
 *        Defaults to 1 (only check the next Monday).
 *
 * @return {object}
 *         An object containing an array of usernames of the next users
 *         and the date they will be on.
 */
function getNext(num_tries = 1) {
  // Get next Monday.
  var date = moment(moment().format('YYYY-MM-DD')).day(1);
  if (moment().isAfter(date)) {
    date.day(8);
  }

  // We'll try the next four Mondays.
  var next;
  for (var i=0; i < num_tries; i++) {
    next = getUsers(date.unix());

    if (next !== null) {
      break;
    }
    else {
      date = date.day(8);
    }
  }

  return {
    next: date.unix(),
    users: next
  };
}

/**
 * Looks for the people with the date furthest in the future.
 *
 * @return {object}
 *         An object containing an array of usernames of the next users
 *         and the date they will be on.
 */
function getLast() {
  var data = getData();
  var last = {
    index: 0,
    date: 0
  };

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].next > last.date) {
      last.date = data.schedule[i].next;
      last.index = i;
    }
  }

  return data.schedule[last.index];
}

/**
 * Get the pair who are after a certain date.
 *
 * @param {int} date
 *        The starting date.
 *        We want a user with the closest date greater than this.
 *
 * @return {object}
 *         The schedule object for the followers.
 *         Includes date and array of users.
 */
function getFollower(date) {
  var data = getData();
  var follower = null;

  for (var i=0; i < data.schedule.length; i++) {
    if ((follower === null) || ((data.schedule[i].next > date) && (data.schedule[i].next < follower.next))) {
      follower = data.schedule[i];
    }
  }

  return follower;
}

/**
 * Return the users associated with a given "next" value.
 *
 * @param {int} date
 *        A UNIX timecode.
 *
 * @return {array}
 *         An array containing usernames.
 */
function getUsers(date) {
  var data = getData();

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].next == date) {
      return data.schedule[i].users;
    }
  }

  return null;
}

/**
 * Return the "next" value for a given user.
 *
 * @param {string} user
 *        A username.
 *
 * @return {int}
 *         A UNIX timecode.
 */
function getDate(user) {
  var data = getData();

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].users.indexOf(user) > -1) {
      return data.schedule[i].next;
    }
  }

  return null;
}

/**
 * Update the "next" value for a given user.
 *
 * @param {string} user
 *        The username of the user in question.
 *
 * @param {int} date
 *        The timecode to assign to the user.
 */
function updateNext(user, date) {
  var data = getData();

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].users.indexOf(user) > -1) {
      data.schedule[i].next = date;
    }
  }

  setData(data);
}

/**
 * Swap the "next" dates of two users
 *
 * @param {string} user1
 *        The username of a user.
 *
 * @param {string} user2
 *        The username of a user. Should not be in same group as user1
 *
 * @return {boolean}
 *         True if the users aren't in the same group, false otherwise.
 */
function swapUsers(user1, user2) {
  var data = getData();

  var date1 = getDate(user1);
  var date2 = getDate(user2);

  if (date1 != date2) {
    updateNext(user1, date2);
    updateNext(user2, date1);

    return true;
  }

  return false;
}

/**
 * Remove a date from the schedule.
 * Will move everyone on or after the given date forward one week.
 *
 * @param {int} date
 *        The date to postpone.
 */
function postpone(date) {
  var data = getData();

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].next >= date) {
      var newDate = moment(data.schedule[i].next, 'X').add(1, 'w');
      data.schedule[i].next = newDate.unix();
    }
  }

  setData(data);
}

/*********************************
 **      PRIVATE FUNCTIONS      **
 *********************************/

function getData() {
  return jsonfile.readFileSync(dataFile);
}

function setData(data) {
  jsonfile.writeFileSync(dataFile, data);
}


module.exports = {
  getNext: getNext,
  getLast: getLast,
  getFollower: getFollower,
  getUsers: getUsers,
  getDate: getDate,
  updateNext: updateNext,
  swapUsers: swapUsers,
  postpone: postpone
};
