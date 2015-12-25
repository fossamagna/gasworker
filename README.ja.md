GASWorker
[![NPM version][npm-image]][npm-url]
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

* 最初に`GASWorker.setup()` 関数を呼び出して初期化を行います。
引数には設定オブジェクトを指定します。設定オブジェクトについては [Define configuration object](#configObject) を参照してください。

* `getLock` 関数はGASWorkerにアプリケーションスクリプトの [Lock](https://developers.google.com/apps-script/reference/lock/lock) オブジェクトを提供する必要があります。
* `getProperties` 関数はGASWorkerにアプリケーションスクリプトの [Properites](https://developers.google.com/apps-script/reference/properties/) オブジェクトを提供する必要があります。

### <a name="configObject"> Define configuration object

設定オブジェクトには `GASWorker` からコールバックされる関数や
 `GASWorker` が参照する値を設定します。

#### Define doTask function

```javascript
doTask: function(token, userContext) {
  Logger.log("doWork:" + new Date().toLocaleString() + "\n" + "token:" + token);
  Utilities.sleep(10 * 1000);
  token++;
  return token < 30 ? token : null;
}
```

`doTask` には分割した処理を定義します。
`doTask` は時間ベースのトリガーから呼び出されます。

`doTask` の戻り値は、 `doTask` が次に呼び出される時の `token` 引数になります。
`null`を返すと、 `doTask` は呼び出されなくなり、処理が終了します。

引数 `token` は 最初は `GASWorker.execute()` の引数が渡されます。
その後は、直前に呼び出された `doTask` の戻り値が渡されます。

引数 `userContext` は任意の値を追加・変更・削除できるオブジェクトです。
`userContext` オブジェクトの寿命は Google Apps Script
プロセスを同じです。

注意:`GASWorker.doTask`は6分以内に終了するようにしてください。

#### Define beforeTasks function

```javascript
beforeTasks: function(token, userContext) {
  Logger.log("Hook before trigger start.");
}
```

`beforeTasks` 関数の定義はオプションです。
`beforeTasks` 関数を使ってタスクの開始前のタイミングをフックできます。

#### Define afterTasks function

```javascript
afterTasks: function(token, userContext) {
  Logger.log("Hook before trigger end.");
}
```

`afterTasks` 関数の定義はオプションです。
`afterTasks` 関数を使ってタスクの終了前のタイミングをフックできます。

#### Define done function

```javascript
done: function() {
  Logger.log("done() : cancelled=" + GASWorker.isCancelled());
}
```

`GASWorker.execute`で開始した処理が終了すると`done`が呼び出されます。
`done`の定義は任意です。定義しない場合は何もしません。

### Start Task

```javascript
function start() {
  Logger.log("execute() : " + GASWorker.execute(0));
}
```

`GASWorker.execute` 関数を呼び出すと時間ベースのトリガーをインストールします。
インストールしたトリガーから`doTask`関数が呼び出されます。

### Cancel

```javascript
function cancel() {
  GASWorker.cancel();
}
```

`GASWorker.execute`で開始した処理を途中で終了する場合、
`GASWorker.cancel()`関数を呼び出します。

## Install

### npmパッケージとして使う

```sh
$ npm install gas-worker --save
```

[Browserify](http://browserify.org/ga)、 [gasify](https://www.npmjs.com/package/gasify) と一緒に使うことをお勧めします。

### ライブラリとして使う

Google Apps Script の[ライブラリ](https://developers.google.com/apps-script/guide_libraries)として使用できます。

* Project Key : MgArHDn4Cqyu5Dem4eLAklPFqzDO4jqHr

## Licence

[MIT](LICENCE.txt)

## Author

[fossamagna](https://github.com/fossamagna)

[npm-image]: https://badge.fury.io/js/gas-worker.svg
[npm-url]: https://npmjs.org/package/gas-worker
