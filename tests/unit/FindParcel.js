define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var Patient = require('app/FindParcel');
    var graphicController = require('app/graphicController');
    var patient;

    var destroy = function (widget) {
        widget.destroyRecursive();
        widget = null;
    };

    registerSuite({
        name: 'FindParcel',

        beforeEach: function () {
            var div = document.createElement('div');
            document.body.appendChild(div);

            patient = new Patient({}, div);
            patient.startup();

            graphicController.clearGraphics = function () {};
            graphicController.highlightFeatures = function () {};
        },

        afterEach: function () {
            if (patient) {
                destroy(patient);
            }
        },

        sanity: function () {
            assert.instanceOf(patient, Patient, 'we have an instance of App');
        },

        postCreate: {
            'creates county selects': function () {
                assert.strictEqual(patient.county.length, 30, '29 options for each county and 1 label');
                assert.strictEqual(patient.county.options[patient.county.selectedIndex].innerHTML, 'County',
                                   'Label should be selected');
            },
            'selectedCounty gets selected': function () {
                var div = document.createElement('div');
                document.body.appendChild(div);

                patient = new Patient({
                    selectedCounty: 'Salt Lake'
                }, div);
                patient.startup();

                assert.strictEqual(patient.county.options[patient.county.selectedIndex].innerHTML,
                                   patient.selectedCounty,
                                   'Label should be selected');
            }
        },

        _biuldWhereClause: function () {
            assert.strictEqual(patient._buildWhereClause('b', 'a'), 'PARCEL_ID=\'a\' AND County=\'b\'');
        }
    });
});
