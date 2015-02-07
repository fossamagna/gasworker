var KEY_CONTEXT_ = "GASWorker-Context";

var STATUS_PENDING = "PENDING";
var STATUS_STARTED = "STARTED";
var STATUS_PAUSED = "PAUSED";
var STATUS_DONE = "DONE";

var config_ = {
  waitLockTimeout : 1 * 60 * 1000,
  triggerMinutes : 1,
  triggerTimeout : 4 * 60 * 1000,
  callback: "doInBackground"
}

function setup(target) {
  target[config_.callback] = doInBackground_;
}

function execute(token) {
  return callWithLock_(function() {
    // 既にexecute()されていないかチェック。
    if (getContext_(KEY_CONTEXT_) != null && !isDone()) {
      return false;
    }
    var uniqueId = putNextTrigger_();
    var context = {
      status : STATUS_PENDING,
      uniqueId : uniqueId,
      token : token,
      cancelled : false
    };
    setContext_(KEY_CONTEXT_, context);
    return true;
  });
}

function done() {
}

function getLock() {
  //return LockService.getScriptLock();
  return null;
}

function getProperties() {
  //return PropertiesService.getScriptProperties();
  return null;
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
    context.status = STATUS_STARTED;
    context.starttime = starttime.toISOString();
    setContext_(identifier, context);
    return context.token;
  });
  if (token == null) {
    return;
  }
  // Run time-consuming tasks.
  token = doTasks(identifier, token, starttime.getTime());
  if (token) {
    callWithLock_(function() {
      var context = getContext_(identifier);
      context.starttime = null;
      context.status = STATUS_PAUSED;
      setContext_(identifier, context);
    });
  } else {
    callWithLock_(function() {
      var context = getContext_(identifier);
      deleteTrigger_(context.uniqueId);
      context.uniqueId = null;
      context.starttime = null;
      context.status = STATUS_DONE;
      setContext_(identifier, context);
    });
    done();
  }
}

function doTasks(identifier, token, starttime) {
  var nextToken;
  while (new Date().getTime() - starttime < config_.triggerTimeout) {
    if (isCancelled_(identifier)) {
      return null;
    }
    nextToken = doTask(token);
    if (nextToken) {
      callWithLock_(function() {
        setToken_(identifier, nextToken);
      });
      token = nextToken;
    } else {
      break;
    }
  }
  return nextToken;
}

function callWithLock_(callback, waitLockTimeout) {
  var timeoutInMillis = waitLockTimeout || config_.waitLockTimeout;
  var lock = getLock();
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
  var trigger = ScriptApp.newTrigger(config_.callback)
    .timeBased()
    .everyMinutes(config_.triggerMinutes)
    .create();
  return trigger.getUniqueId();
}

function cancel() {
  var identifier = KEY_CONTEXT_;
  callWithLock_(function() {
    setContextValue_(identifier, "cancelled", true);
  });
}

function isCancelled() {
  return isCancelled_(KEY_CONTEXT_);
}

function isCancelled_(identifier) {
  return !!getContextValue_(identifier, "cancelled");
}

function getContext_(identifier) {
  var value = getProperties().getProperty(identifier);
  if (!value) {
    return null;
  }
  return JSON.parse(value);
}

function setContext_(identifier, context) {
  getProperties().setProperty(identifier, JSON.stringify(context));
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

function isDone() {
  return STATUS_DONE === getStatus_(KEY_CONTEXT_);
}

function canDoInBackground_(identifier) {
  var status = getStatus_(identifier);
  return status === STATUS_PAUSED || status === STATUS_PENDING;
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

