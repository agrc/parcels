define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var Patient = require('app/App');
    var patient;

    var destroy = function (widget) {
        widget.destroyRecursive();
        widget = null;
    };

    registerSuite({
        name: 'App',

        beforeEach: function () {
            var div = document.createElement('div');
            document.body.appendChild(div);

            patient = new Patient({}, div);
            patient.startup();
        },

        afterEach: function () {
            if (patient) {
                destroy(patient);
            }
        },

        sanity: function () {
            assert.instanceOf(patient, Patient, 'we have an instance of App');
        }
    });
});
