define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var App = require('app/App');
    var testWidget;

    registerSuite({
        name: 'App',

        beforeEach: function () {
            var div = document.createElement('div');
            document.body.appendChild(div);

            testWidget = new App({}, div);
            testWidget.startup();
        },

        afterEach: function () {
            testWidget.destroy();
            testWidget = null;
        },

        pass: function () {
            assert.ok(true);
        },

        fail: function () {
            assert.ok(false);
        }
    });
});
