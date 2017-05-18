/**
 * Setters and getters for the schedule data.
 */

/**
 * Looks for the next person by date by making calls to get().
 *
 * @return {object}
 *         An object containing an array of usernames of the next users
 *         and the date they will be on.
 */
function getNext() {
  var next;
  var date = new Date();
  date.setDate(date.getDate() + (1 + 7 - date.getDay()) % 7);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);

  // We'll try the next four Mondays.
  for (var i=0; i < 4; i++) {
    next = getUsers(Date.parse(date));

    if (next != null) {
      break;
    }
    else {
      date.setDate(date.getDate() + 7);
    }
  }

  return {
    next: Date.parse(date),
    users: next
  };
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
 */
function swapUsers(user1, user2) {
  var data = getData();

  var date1 = get(user1);
  var date2 = get(user2);

  if (date1 != date2) {
    updateNext(user1, date2);
    updateNext(user2, date1);
  }
}

/**
 * Remove a date from the schedule.
 * Will move everyone on or after the given date forward one week.
 *
 * @param {int} date
 *        The date to postpone. Defaults to the closest Monday.
 */
function postpone(date) {
  var data = getData();

  if (typeof date === 'undefined') {
    date = new Date();
    date.setDate(date.getDate() + (1 + 7 - date.getDay()) % 7);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
  }
  else {
    date = new Date(date);
  }

  for (var i=0; i < data.schedule.length; i++) {
    console.log(Date.parse(date));

    if (data.schedule[i].next >= Date.parse(date)) {
      var newDate = new Date(data.schedule[i].next);
      newDate.setDate(newDate.getDate() + 7);

      console.log(data.schedule[i].users);
      console.log('update to ' + Date.parse(newDate));

      data.schedule[i].next = Date.parse(newDate);
    }
  }

  setData(data);
}

/*******************************
 **     HELPER FUNCTIONS      **
 *******************************/

function getData() {
  var jsonfile = require('jsonfile');
  var dataFile = 'data/schedule.json';

  return jsonfile.readFileSync(dataFile);
}

function setData(data) {
  var jsonfile = require('jsonfile');
  var dataFile = 'data/schedule.json';

  jsonfile.writeFile(dataFile, data, function(err) {
    if (!!err) {
      console.error(err);
    }
  });
}


module.exports = {
  getNext: getNext,
  getFollower: getFollower,
  getUsers: getUsers,
  getDate: getDate,
  updateNext: updateNext,
  swapUsers: swapUsers,
  postpone: postpone
};
