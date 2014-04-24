unpm-backend-test
====

check your backend for compliance with unpm

## usage

```js
var test = require('unpm-backend-test')

test(backend, callback, output_stream)

function callback(results) {
  console.dir(results)
}
```

## notes

* `results` in your callback are [tap-parser](http://npm.im/tap-parser) results
* uses [tape](http://npm.im/tape) for testing

## license

MIT
