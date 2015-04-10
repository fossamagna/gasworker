GASWorker
====

GASWorker は Google Apps Script で長時間の実行を必要とするスクリプトのためのライブラリです。

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

## Description

Google Apps Script はスクリプトの最大実行時間6分の [制限](https://developers.google.com/apps-script/guides/services/quotas#current_limitations) があります。
GASWorker はこの制限を超えて長時間に渡ってスクリプトを実行する場合に、便利な機能を提供します。

GASWorker は分割された長時間の処理を [時間ベースのトリガー](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers) の時間制限内に収まるように呼び出すことで、長時間に渡るスクリプトの実行を**擬似的**に実現します。

長時間に渡って実行するスクリプトの処理を分割するのは GASWorker の利用者が行います。
GASWorker その分割された処理を時間ベースのトリガーを利用して呼び出します。

## Usage

### Initialize

    GASWorker.setup(this);

    GASWorker.getLock = function() {
      return LockService.getScriptLock();
    }

    GASWorker.getProperties = function() {
      return PropertiesService.getScriptProperties();
    }

* `GASWorker.getLock` 関数はGASWorkerにアプリケーションスクリプトの [Lock](https://developers.google.com/apps-script/reference/lock/lock) オブジェクトを提供する必要があります。
* `GASWorker.getProperties` 関数はGASWorkerにアプリケーションスクリプトの [Properites](https://developers.google.com/apps-script/reference/properties/) オブジェクトを提供する必要があります。

### Define doTask function

    GASWorker.doTask = function(token, userContext) {
      Logger.log("doWork:" + new Date().toLocaleString() + "\n" + "token:" + token);
      Utilities.sleep(10 * 1000);
      token++;
      return token < 30 ? token : null;
    }

`GASWorker.doTask` には分割した処理を定義します。
`GASWorker.doTask` は時間ベースのトリガーから呼び出されます。

`GASWorker.doTask` の戻り値は、 `GASWorker.doTask` が次に呼び出される時の `token` 引数になります。
`null`を返すと、 `GASWorker.doTask` は呼び出されなくなり、処理が終了します。

引数 `token` は 最初は `GASWorker.execute()` の引数が渡されます。
その後は、直前に呼び出された `GASWorker.doTask` の戻り値が渡されます。

引数 `userContext` は任意の値を追加・変更・削除できるオブジェクトです。
`userContext` オブジェクトの寿命は Google Apps Script
プロセスを同じです。

注意:`GASWorker.doTask`は6分以内に終了するようにしてください。

### Define beforeTasks function

    GASWorker.beforeTasks = function(token, userContext) {
      Logger.log("Hook before trigger start.");
    }

`beforeTasks` 関数の定義はオプションです。
`beforeTasks` 関数を使ってタスクの開始前のタイミングをフックできます。

### Define afterTasks function

    GASWorker.afterTasks = function(token, userContext) {
      Logger.log("Hook before trigger end.");
    }

`afterTasks` 関数の定義はオプションです。
`afterTasks` 関数を使ってタスクの終了前のタイミングをフックできます。

### Start Task

    function start() {
      Logger.log("execute() : " + GASWorker.execute(0));
    }

`GASWorker.execute` 関数を呼び出すと時間ベースのトリガーをインストールします。
インストールしたトリガーから`GASWorker.doTask`関数が呼び出されます。

### Cancel

    function cancel() {
      GASWorker.cancel();
    }

`GASWorker.execute`で開始した処理を途中で終了する場合、
`GASWorker.cancel()`関数を呼び出します。

### Define done function

    GASWorker.done = function() {
      Logger.log("done() : cancelled=" + GASWorker.isCancelled());
    }

`GASWorker.execute`で開始した処理が終了すると`GASWorker.done`が呼び出されます。
`GASWorker.done`の定義は任意です。定義しない場合は何もしません。

## Install

Google Apps Script の[ライブラリ](https://developers.google.com/apps-script/guide_libraries)として使用できます。

* Project Key : MgArHDn4Cqyu5Dem4eLAklPFqzDO4jqHr

## Licence

[MIT](LICENCE.txt)

## Author

[fossamagna](https://github.com/fossamagna)
