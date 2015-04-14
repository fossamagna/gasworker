var KEY_CONTEXT_ = "GASWorker-Context";

var STATUS_PENDING_ = "PENDING";
var STATUS_STARTED_ = "STARTED";
var STATUS_PAUSED_ = "PAUSED";
var STATUS_DONE_ = "DONE";

var userConfig_ = {
  callbackTarget: null, /* required */
  callback: "doInBackground",
  waitLockTimeout : 1 * 60 * 1000,
  triggerMinutes : 1,
  triggerTimeout : 4 * 60 * 1000,
  transactionType: 'tasks', /* task or tasks */

  // lifecycle functions
  /**
   * Executed before the defined task is started at an TimeBased Trigger.
   * It is before task is resumed.
   */
  beforeTasks: function(currentToken, userContext) {},
  /**
   * You can define the processes that have been divided into this function.
   * @param {Object} currentToken return value of when doTask function previous call.
   * @param {Object} userContext object where you can use add, modify and delete any value.
   * @return {Object} the token argument of when doTask function the next call.
   */
  doTask: function(currentToken, userContext) { return false },
  /**
   * Executed after the defined task is ended at an TimeBased Trigger.
   * It is before task paused.
   */
  afterTasks: function(currentToken, userContext) {},
  /**
   * Executed after the defined task is finished.
   */
  done: function() {},

  // service provider functions
  /**
   * Provide Lock object to GASWroker.
   * @return {Lock} lock object of application script
   */
  getLock: function() {},
  /**
   * Provide Properties object to GASWroker.
   * @return {Properties} properties object of application script
   */
  getProperties: function() {}
}

/**
 * Set up for using GASWorker.
 * @param {Object} userConfig configuration object for gasworker script.
 */
function setup(userConfig) {
  for (var attr in userConfig) {
    if (userConfig.hasOwnProperty(attr)) {
      userConfig_[attr] = userConfig[attr];
    }
  }
  userConfig_.callbackTarget[userConfig_.callback] = doInBackground_;
}

/**
 * Executes the defined task using token at some time in the future.
 * @param {Object} token doTask function argument.
 * @return {boolean} if the install of trigger was success, else false
 */
function execute(token) {
  return callWithLock_(function() {
    // 既にexecute()されていないかチェック。
    if (getContext_(KEY_CONTEXT_) != null && !isDone()) {
      return false;
    }
    var uniqueId = putNextTrigger_();
    var context = {
      status : STATUS_PENDING_,
      uniqueId : uniqueId,
      token : token,
      cancelled : false
    };
    setContext_(KEY_CONTEXT_, context);
    return true;
  });
}

function doInBackground_() {
  var identifier = KEY_CONTEXT_;
  var starttime = new Date();
  var token = callWithLock_(function() {
    // 既にdoInBackground_()が実行されていないかチェック。
    if (!canDoInBackground_(identifier)) {
      return null;
    }
    // update context.
    var context = getContext_(identifier);
    context.status = STATUS_STARTED_;
    context.starttime = starttime.toISOString();
    setContext_(identifier, context);
    return context.token;
  });
  if (token == null) {
    return;
  }
  try {
    token = doTasks_(identifier, token, starttime.getTime());
  } finally {
    if (token) {
      callWithLock_(function() {
        var context = getContext_(identifier);
        context.starttime = null;
        context.token = token;
        context.status = STATUS_PAUSED_;
        setContext_(identifier, context);
      });
    } else {
      callWithLock_(function() {
        var context = getContext_(identifier);
        deleteTrigger_(context.uniqueId);
        context.uniqueId = null;
        context.starttime = null;
        context.status = STATUS_DONE_;
        setContext_(identifier, context);
      });
    }
    userConfig_.done();
  }
}

function doTasks_(identifier, token, starttime) {
  var currentToken = token;
  var nextToken;
  var userContext = {};

  // Hook before doTasks_
  userConfig_.beforeTasks(currentToken, userContext);

  // Run time-consuming tasks.
  while (new Date().getTime() - starttime < userConfig_.triggerTimeout) {
    if (isCancelled_(identifier)) {
      return null;
    }
    currentToken = nextToken || token;
    nextToken = userConfig_.doTask(currentToken, userContext);
    if (nextToken) {
      if (userConfig_.transactionType === 'task') {
        callWithLock_(function() {
          setToken_(identifier, nextToken);
        });
      }
    } else {
      break;
    }
  }

  // Hook after doTasks_
  userConfig_.afterTasks(currentToken, userContext);
  return nextToken;
}

function callWithLock_(callback, waitLockTimeout) {
  var timeoutInMillis = waitLockTimeout || userConfig_.waitLockTimeout;
  var lock = userConfig_.getLock();
  lock.waitLock(timeoutInMillis);
  try {
    return callback();
  } catch (e){
    Logger.log(e);
    return false;
  } finally {
    lock.releaseLock();
  }
}

function deleteTrigger_(uniqueId) {
  if (uniqueId) {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getUniqueId() === uniqueId) {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
  }
}

function putNextTrigger_() {
  var trigger = ScriptApp.newTrigger(userConfig_.callback)
    .timeBased()
    .everyMinutes(userConfig_.triggerMinutes)
    .create();
  return trigger.getUniqueId();
}

/**
 * Attempts to cancel execution of this task.
 */
function cancel() {
  var identifier = KEY_CONTEXT_;
  callWithLock_(function() {
    setContextValue_(identifier, "cancelled", true);
  });
}

/**
 * Returns true if this task was cancelled before it completed normally.
 */
function isCancelled() {
  return isCancelled_(KEY_CONTEXT_);
}

function isCancelled_(identifier) {
  return !!getContextValue_(identifier, "cancelled");
}

function getContext_(identifier) {
  var value = userConfig_.getProperties().getProperty(identifier);
  if (!value) {
    return null;
  }
  return JSON.parse(value);
}

function setContext_(identifier, context) {
  userConfig_.getProperties().setProperty(identifier, JSON.stringify(context));
}

function setContextValue_(identifier, name, value) {
  var context = getContext_(identifier);
  if (!context) {
    return;
  }
  context[name] = value;
  setContext_(identifier, context);
}

function getContextValue_(identifier, name) {
  var context = getContext_(identifier);
  if (!context) {
    return null;
  }
  return context[name];
}

function getStatus_(identifier) {
  return getContextValue_(identifier, "status");
}

function setStatus_(identifier, status) {
  return setContextValue_(identifier, "status", status);
}

/**
 * Returns true if this task completed.
 */
function isDone() {
  return STATUS_DONE_ === getStatus_(KEY_CONTEXT_);
}

function canDoInBackground_(identifier) {
  var status = getStatus_(identifier);
  return status === STATUS_PAUSED_ || status === STATUS_PENDING_;
}

function getUniqueId_(identifier) {
  return getContextValue_(identifier, "uniqueId");
}

function setUniqueId_(identifier, uniqueId) {
  return setContextValue_(identifier, "uniqueId", uniqueId);
}

function getToken_(identifier) {
  return getContextValue_(identifier, "token");
}

function setToken_(identifier, token) {
  return setContextValue_(identifier, "token", token);
}

module.exports = {
  setup: setup,
  execute: execute,
  cancel: cancel,
  isDone: isDone,
  isCancelled: isCancelled
};
