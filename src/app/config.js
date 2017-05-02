define([
    './counties',

    'dojo/has',
    'dojo/request/xhr',

    'esri/config'
], function (
    counties,

    has,
    xhr,

    esriConfig
) {
    // force api to use CORS on mapserv thus removing the test request on app load
    // e.g. http://mapserv.utah.gov/ArcGIS/rest/info?f=json
    esriConfig.defaults.io.corsEnabledServers.push('mapserv.utah.gov');
    esriConfig.defaults.io.corsEnabledServers.push('basemaps.utah.gov');

    window.AGRC = {
        // errorLogger: ijit.modules.ErrorLogger
        errorLogger: null,

        // app: app.App
        //      global reference to App
        app: null,

        // version.: String
        //      The version number.
        version: '1.3.1',

        // apiKey: String
        //      The api key used for services on api.mapserv.utah.gov
        apiKey: '', // acquire at developer.mapserv.utah.gov

        urls: {
            parcel: window.location.protocol + '//' +
                    window.location.hostname + '/arcgis/rest/services/Parcels/Mapserver',
            exportWebMapUrl: window.location.protocol + '//' +
                             window.location.hostname +
                             '/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task'
        },

        counties: counties
    };

    if (has('agrc-build') === 'prod') {
        // parcels.utah.gov
        window.AGRC.apiKey = 'AGRC-4DD66766986896';
        window.AGRC.quadWord = 'alfred-plaster-crystal-dexter';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        window.AGRC.apiKey = 'AGRC-AC122FA9671436';
        window.AGRC.quadWord = 'opera-event-little-pinball';
    } else {
        // localhost
        window.AGRC.apiKey = 'AGRC-E5B94F99865799';
        xhr(require.baseUrl + '../secrets.json', {
            handleAs: 'json',
            sync: true
        }).then(function (secrets) {
            window.AGRC.quadWord = secrets.quadWord;
        }, function () {
            throw 'Error getting quad word!';
        });
    }

    return window.AGRC;
});
