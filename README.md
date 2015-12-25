GASWorker
[![NPM version][npm-image]][npm-url]
====

GASWorker is a library for the script that requires a long run in the Google Apps Script.

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

## Description

Google Apps Script have a maximum script runtime of 6 minutes of [the limitations](https://developers.google.com/apps-script/guides/services/quotas#current_limitations).

You can use GASWorker a practical feature when you want to run the script over a long period of time beyond this limit.

GASWorker achieves the execution of the script over a long period of time to ** pseudo ** by call to fit within the time limit of a long process that has been divided [time-based trigger](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers).

User of GASWorker have to divide the processing of script to run for a long time is done.
GASWorker calls the divided processing by using the time-based trigger.

## Usage

### Initialize

```javascript
var gwConfig = {
  callbackTarget: this,

  doTask: function(token, userContext) {
    var cell = userContext.sheet.getRange(token + 1, 1);
    cell.setValue("doTask:" + new Date().toLocaleString() + "\n" + "token:" + token);
    SpreadsheetApp.flush();
    Utilities.sleep(10 * 1000);
    token++;
    return token < 30 ? token : null;
  },

  getProperties: function() {
    return PropertiesService.getScriptProperties();
  },
  getLock: function() {
    return LockService.getScriptLock();
  }
};

GASWorker.setup(gwConfig);
```
* First, you must call `GASWorker.setup()` function in order to initialize. And, you must set argument of 'GASWorker.setup()' function as configuration object.
See [Define configuration object](#configObject) details of configuration object.
* `getLock` function have to provides [Lock](https://developers.google.com/apps-script/reference/lock/lock) object to GASWroker from App Script.
* `getProperties` function have to provides [Properites](https://developers.google.com/apps-script/reference/properties/) object to GASWroker from App Script.

### <a name="configObject"> Define configuration object

In configuration object, define used callback functions and values by `GASWorker`.

#### Define doTask function

```javascript
doTask: function(token, userContext) {
  Logger.log("doWork:" + new Date().toLocaleString() + "\n" + "token:" + token);
  Utilities.sleep(10 * 1000);
  token++;
  return token < 30 ? token : null;
}
```

You can define the processes that have been divided into `doTask`.
`doTask` will be called from time-based trigger.

Return value of `doTask` that will be the `token` argument of when the` doTask` the next call.
If you return the `null`,` doTask` is no longer called, processing is terminated.

Argument of `doTask` function are initially passed `GASWorker.execute ()` argument.

`userContext` is object where you can use add, modify and delete any value.
Life of userContext is same to Google Apps Script process.

Note : Process in `doTask` must be make to be completed within 6 minutes.

#### Define beforeTasks function

```javascript
beforeTasks: function(token, userContext) {
  Logger.log("Hook before trigger start.");
}
```

It is optional that to define `beforeTasks` function.
You can hook before start tasks using `beforeTasks` function.

#### Define afterTasks function

```javascript
afterTasks: function(token, userContext) {
  Logger.log("Hook before trigger end.");
}
```

It is optional that to define `afterTasks` function.
You can hook before end tasks using `afterTasks` function.

#### Define done function

```javascript
done: function() {
  Logger.log("done() : cancelled=" + GASWorker.isCancelled());
}
```

`done` is called when processing started is completed `GASWorker.execute`.
`done` function is optional.

### Start Task

```javascript
function start() {
  Logger.log("execute() : " + GASWorker.execute(0));
}
```

If you call the `GASWorker.execute` function to install a time-based trigger.
`doTask` function is called from the installed trigger.

### Cancel

```javascript
function cancel() {
  GASWorker.cancel();
}
```

If you want to cancel the process that are started in `GASWorker.execute`, call the `GASWorker.cancel` function.

## Install

### NPM

```sh
$ npm install gas-worker --save
```

I recommend to use it with [Browserify](http://browserify.org/ga) and [gasify](https://www.npmjs.com/package/gasify).

### Library on Apps Script

You can use it as a [Library](https://developers.google.com/apps-script/guide_libraries).

* Project Key : MgArHDn4Cqyu5Dem4eLAklPFqzDO4jqHr

## Licence

[MIT](LICENCE.txt)

## Author

[fossamagna](https://github.com/fossamagna)

[npm-image]: https://badge.fury.io/js/gas-worker.svg
[npm-url]: https://npmjs.org/package/gas-worker
