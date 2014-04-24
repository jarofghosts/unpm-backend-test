var EE = require('events').EventEmitter

var test = require('tape')

module.exports = test_backend

function test_backend(backend, _done, _out) {
  var test_stream = test.createStream()

  var out = _out || process.stdout
    , done = _done || noop

  test_stream.pipe(out)
  test_stream.on('end', done)

  test('backend is an Event Emitter', function(t) {
    t.plan(1)
    t.ok(backend instanceof EE)
  })

  function test_entry(title) {
    test('set' + title + ' stores data', function(t) {
      var test_data = {test: 'data'}

      t.plan(2)

      backend['set' + title]('dummy', test_data, check_callback)

      function check_callback(err, data) {
        t.ok(!err, 'callback gets no error')
        t.equal(
            data
          , test_data
          , 'callback gets data'
        )
      }
    })

    test('get' + title + ' gets data', function(t) {
      var expected = {test: 'data'}

      t.plan(2)

      backend['get' + title]('dummy', check_result)

      function check_result(err, data) {
        t.ok(!err, 'callback gets no error')
        t.deepEqual(data, expected, 'data matches what was set')
      }
    })

    test(
        'set' + title + ' emits event with new data and old data'
      , test_set_emit
    )
      
    function test_set_emit(t) {
      var expected_old = {test: 'data'}
        , expected_new = {data: 'test'}

      t.plan(5)

      backend.once('set' + title, check_emit)
      backend['set' + title]('dummy', expected_new, check_callback)

      function check_emit(new_data, old_data) {
        t.deepEqual(new_data, expected_new)
        t.deepEqual(old_data, expected_old)
      }

      function check_callback(err, new_data, old_data) {
        t.deepEqual(new_data, expected_new)
        t.deepEqual(old_data, expected_old)
        t.ok(!err)
      }
    }

    test(
        'set' + title + ' emits old data as null if none exists'
      , test_null_data
    )
      
    function test_null_data(t) {
      var expected_new = {data: 'test'}
        , expected_old = null

      t.plan(5)

      backend.once('set' + title, check_emit)
      backend['set' + title]('dummy2', expected_new, check_callback)

      function check_emit(new_data, old_data) {
        t.deepEqual(new_data, expected_new)
        t.strictEqual(old_data, expected_old)
      }

      function check_callback(err, new_data, old_data) {
        t.deepEqual(new_data, expected_new)
        t.strictEqual(old_data, expected_old)
        t.ok(!err)
      }
    }

    test(
        'create' + title + 'Stream returns stream of meta-data entries'
      , check_get_stream
    )

    function check_get_stream(t) {
      var expected = [
          {key: 'dummy', value: {data: 'test'}}
        , {key: 'dummy2', value: {data: 'test'}}
      ]

      var data_stream = backend['create' + title + 'Stream']()
        , data = []

      t.plan(3)

      t.ok(data_stream.pipe, 'return is stream-like')
      t.equal(typeof data_stream.pipe, 'function', 'return has pipe')

      data_stream.on('data', function(chunk) {
        data.push(chunk)
      })

      data_stream.on('end', function() {
        t.deepEqual(data, expected, 'streams entries')
      })
    }

    test('remove' + title + ' removes data', function(t) {
      t.plan(4)

      var expected = {data: 'test'}

      backend['remove' + title]('dummy', check_callback)

      function check_callback(err, data) {
        t.ok(!err, 'no error in callback')
        t.deepEqual(data, expected, 'passes old data to callback')

        backend['get' + title]('dummy', check_result)

        function check_result(err, data) {
          t.ok(!err, 'callback gets no error')
          t.strictEqual(data, null, 'data is null, key does not exist')
        }
      }
    })

    test('remove' + title + ' emits event with old data', function(t) {
      t.plan(1)

      var expected = {data: 'test'}

      backend.once('remove' + title, check_emit)

      backend['remove' + title]('dummy2')

      function check_emit(data) {
        t.deepEqual(data, expected, 'passes old data to callback')
      }
    })
  }

  test_entry('Meta')
  test_entry('User')
  test_entry('')

  test('setTarball creates writable stream to tgz', function(t) {
    var dummy_contents = 'drangus'

    var set_tarball = backend.setTarball('dummy', '1.2.3')

    t.ok(set_tarball.write, 'return is writable-stream-like')
    t.equal(typeof set_tarball.write, 'function', 'return has write')

    set_tarball.on('finish', function() {
      t.end()
    })

    set_tarball.end(dummy_contents)
  })

  test('getTarball streams tgz contents', function(t) {
    var expected = 'drangus'

    var get_tarball = backend.getTarball('dummy', '1.2.3')
      , data = ''

    t.plan(5)

    t.ok(get_tarball.pipe, 'return is stream-like')
    t.ok(get_tarball.read, 'return is readable-stream-like')
    t.equal(typeof get_tarball.pipe, 'function', 'return has pipe')
    t.equal(typeof get_tarball.read, 'function', 'return has read')

    get_tarball.on('data', function(chunk) {
      data += chunk
    })

    get_tarball.on('end', function() {
      t.equal(data, expected, 'streams contents')
    })
  })

  test('removeTarball removes tgz', function(t) {
    t.plan(1)

    backend.removeTarball('dummy', '1.2.3', check_callback)

    function check_callback(err) {
      t.ok(!err, 'no error to callback')
    }
  })
}

function noop() {}
