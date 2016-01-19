define(function (require) {
    var registerSuite = require('intern!object');
    var assert = require('intern/chai!assert');
    var Patient = require('app/Identify');
    var patient;

    var destroy = function (widget) {
        if (widget.destroyRecursive) {
            widget.destroyRecursive();
        }

        widget = null;
    };
    registerSuite({
        name: 'Identify',

        beforeEach: function () {
            var div = document.createElement('div');
            document.body.appendChild(div);

            var map = {
                on: function () {
                    return {
                        then: function () {},
                        cancel: function () {}
                    };
                }
            };

            patient = new Patient({
                map: map
            }, div);
            patient.startup();
        },

        afterEach: function () {
            if (patient) {
                destroy(patient);
            }
        },

        sanity: function () {
            assert.instanceOf(patient, Patient, 'we have an instance of App.');
        },

        _formatDate: {
            'pretty formats ParcelsCur': function () {
                patient.ParcelsCur = 1452211200000;
                assert.strictEqual(patient._formatDate(), '1/8/16', 'ticks to MM/DD/YY.');
            },

            'returns empty string for 0 or null': function () {
                assert.strictEqual(patient._formatDate(), '', 'empty to empty');
                patient.ParcelsCur = -1;
                assert.strictEqual(patient._formatDate(), '', '-1 to empty');
                patient.ParcelsCur = 0;
                assert.strictEqual(patient._formatDate(), '', '0 to empty');
            }
        },

        _populateIdentify: {
            'displays message when no features': function () {
                patient._populateIdentify();
                assert.include(patient.content.innerHTML, 'There is no parcel information here.', 'empty message');
            },
            'populates identify': function () {
                patient._populateIdentify({
                    attributes: {
                        'OBJECTID': 890746,
                        'Shape_Length': 1537.7905711369776,
                        'Shape_Area': 138687.71877883334,
                        'PARCEL_ID': '09311610020000',
                        'PARCEL_ADD': '350 N COLUMBUS ST',
                        'PARCEL_CITY': 'Salt Lake City',
                        'PARCEL_ZIP': '84103',
                        'OWN_TYPE': 'Private',
                        'RECORDER': '1-801-468-3391',
                        'ParcelsCur': 1452211200000,
                        'ParcelNotes': 'Dynamic snapshot from county',
                        'County': 'SaltLake',
                        'CoParcel_URL': 'http://slco.org/assessor/new/query/intropage.cfm'
                    }
                }, {
                    'OBJECTID': 'OBJECTID',
                    'Shape_Length': 'Shape_Length',
                    'Shape_Area': 'Shape_Area',
                    'PARCEL_ID': 'Parcel Id',
                    'PARCEL_ADD': 'Address',
                    'PARCEL_CITY': 'City',
                    'PARCEL_ZIP': 'Zip Code',
                    'OWN_TYPE': 'Generalized Ownership Type',
                    'RECORDER': 'Recorder Contact',
                    'ParcelsCur': 'Current as of',
                    'ParcelNotes': 'Notes',
                    'County': 'County',
                    'CoParcel_URL': 'County Parcel Website'
                });

                assert.include(patient.content.innerHTML, '09311610020000', 'parcel id');
                assert.include(patient.content.innerHTML, '350 N COLUMBUS ST', 'address');
                assert.include(patient.content.innerHTML, 'Salt Lake City', 'city');
                assert.include(patient.content.innerHTML, '84103', 'zip');
                assert.include(patient.content.innerHTML, 'Private', 'ownership');
                assert.include(patient.content.innerHTML, '1-801-468-3391', 'phone');
                assert.include(patient.content.innerHTML, 'Dynamic snapshot from county', 'notes');
                assert.include(patient.content.innerHTML, 'http://slco.org/assessor/new/query/intropage.cfm', 'url');
                assert.include(patient.content.innerHTML, '1/8/16', 'date');
            }
        }
    });
});
