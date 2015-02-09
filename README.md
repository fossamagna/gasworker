GASWorkder
====

GASWorker is a library for the script that requires a long run in the Google Apps Script.

## Description

Google Apps Script have a maximum script runtime of 6 minutes of [the limitations](https://developers.google.com/apps-script/guides/services/quotas#current_limitations).

You can use GASWorker a practical feature when you want to run the script over a long period of time beyond this limit.

GASWorker achieves the execution of the script over a long period of time to ** pseudo ** by call to fit within the time limit of a long process that has been divided [time-based trigger] (https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers).

User of GASWorker have to divide the processing of script to run for a long time is done.
GASWorker calls the divided processing by using the time-based trigger.

## Usage

### Initialize

    GASWorker.setup(this);

    GASWorker.getLock = function() {
      return LockService.getScriptLock();
    }

    GASWorker.getProperties = function() {
      return PropertiesService.getScriptProperties();
    }

* `GASWorker.getLock` function have to provides [Lock](https://developers.google.com/apps-script/reference/lock/lock) object to GASWroker from App Script.
* `GASWorker.getProperties` function have to provides [Properites](https://developers.google.com/apps-script/reference/properties/) object to GASWroker from App Script.

### Define doTask function

    GASWorker.doTask = function(token) {
      var cell = SpreadsheetApp.getActiveSheet().getRange(token + 1, 1);
      cell.setValue("doWork:" + new Date().toLocaleString() + "\n" + "token:" + token);
      SpreadsheetApp.flush();
      Utilities.sleep(10 * 1000);
      token++;
      return token < 30 ? token : null;
    }

You can define the processes that have been divided into `GASWorker.doTask`.
`GASWorker.doTask` will be called from time-based trigger.

Return value of `GASWorker.doTask` that will be the argument of when the` GASWorker.doTask` the next call.
If you return the `null`,` GASWorker.doTask` is no longer called, processing is terminated.

Argument of `doTask` function are initially passed `GASWorker.execute ()` argument.

Note : Process in `GASWorker.doTask` must be make to be completed within 6 minutes.

### Start Task

    function start() {
      Logger.log("execute() : " + GASWorker.execute(0));
    }

If you call the `GASWorker.execute` function to install a time-based trigger.
`GASWorker.doTask` function is called from the installed trigger.

### Cancel

    function cancel() {
      GASWorker.cancel();
    }

If you want to cancel the process that are started in `GASWorker.execute`, call the `GASWorker.cancel` function.

### Define done function

    GASWorker.done = function() {
      Logger.log("done() : cancelled=" + GASWorker.isCancelled());
    }

`GASWorker.done` is called when processing started is completed `GASWorker.execute`.
`GASWorker.done` function is optional.

## Install

You can use it as a [Library](https://developers.google.com/apps-script/guide_libraries).
* Project Key : MuqNCyf7bF_RkFgVvqMPBHcbdvwfOgOcF

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[fossamagna](https://github.com/fossamagna)
