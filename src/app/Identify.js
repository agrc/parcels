define([
    './config',

    'agrc/modules/String',

    'dijit/_WidgetBase',

    'dojo/date/locale',
    'dojo/dom-class',
    'dojo/query',
    'dojo/request',
    'dojo/text!./templates/Identify.html',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/Color',
    'esri/graphic',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask',

    'mustache/mustache'
], function (
    config,

    String,

    _WidgetBase,

    locale,
    domClass,
    query,
    request,
    template,
    array,
    declare,
    lang,

    Color,
    Graphic,
    SimpleFillSymbol,
    SimpleLineSymbol,
    Query,
    QueryTask,

    mustache
) {
    return declare([_WidgetBase], {
        // description:
        //      Identify functionality for the app. Returns popup with data. Uses the search api for most of the data.

        templateString: template,
        baseClass: 'identify-widget',

        // Properties to be sent into constructor

        // map: esri/map
        map: null,

        constructor: function (params) {
            // summary:
            //      description
            console.log('app.Identify::constructor', arguments);

            lang.mixin(this, params);

            mustache.parse(this.templateString);   // optional, speeds up future uses

            this.countyQuery = new QueryTask(config.urls.county);
            this.countyCriteria = new Query();
            this.countyCriteria.outFields = ['countyNbr']
            this.countyCriteria.returnGeometry = false;

            this.parcelCriteria = new Query();
            this.parcelCriteria.returnGeometry = true;

            this.polygonSymbol = new SimpleFillSymbol('solid',
                new SimpleLineSymbol('solid', new Color([18,192,236,1]), 1.25),
                new Color([0,0,0,0.25])
            );
        },
        startup: function () {
            // summary:
            //      description
            console.log('app.Identify:startup', arguments);

            this.own(
                this.map.on('click', lang.hitch(this, 'onMapClick')),
                this.countyQuery.on('error', lang.hitch(this, 'countyError'))
            );
        },
        onMapClick: function (evt) {
            // summary:
            //      user clicks on the map
            // evt: Map Click Event
            console.log('app.Identify:onMapClick', arguments);

            this.countyCriteria.geometry = evt.mapPoint;
            this.parcelCriteria.geometry = evt.mapPoint;

            this.countyQuery.execute(this.countyCriteria)
                .then(lang.hitch(this, '_getParcelIndex'))
                .then(lang.hitch(this, '_queryParcelLayer'))
                .then(lang.hitch(this, '_displayResults'));
        },
        /** Puts the response into the mustache template and shows the footer.
         * @param esri/task/FeatureSet - response - the parcel attributes
         */
        _displayResults: function (response) {
            console.log('app.Identify:_displayResults', arguments);

            if (!response || !response.features) {
                return this.parcelError();
            }

            var model = {};

            if (response.features.length < 1) {
                this.domNode.innerHTML = mustache.render(this.templateString, model);

                return true;
            }

            var item = response.features[0].attributes;
            item.formatParcelsCur = this._formatDate;
            item.fieldAliases = response.fieldAliases;

            array.forEach(Object.keys(item.fieldAliases), function (key) {
                item.fieldAliases[key] = String.toProperCase(item.fieldAliases[key])
            });

            model.item = [item];

            this.domNode.innerHTML = mustache.render(this.templateString, model);
            domClass.remove(this.domNode, 'closed');

            this._highlightParcel(response.features[0].geometry);
        },
        /** Gets the featureSet from the counties feature class and finds the index of the parcel layer.
         * @param esri/tasks/featureSet - response - a collecion of features returned from arcgis server
         * @returns number - the index of the parcel layer
         */
        _getParcelIndex: function (response) {
            console.log('app.Identify:_getParcelIndex', arguments);

            if (!response || response.features.length < 1) {
                return this.countyError();
            }

            var countyNumber = parseInt(response.features[0].attributes.COUNTYNBR);

            return countyNumber;
        },
        /** The error handler for the county query.
         * @param Error - err - ArcGIS Server error message returned in a JavaScript error object.
         */
        countyError: function (err) {
            console.log('app.Identify:countyError', arguments);


        },
        /** Query the parcel layer for attribute data.
         * @param Number - parcelIndex - the index of the parcel layer for the county
         * @returns esri/task/FeatureSet - the feature set of information for the parcels queried.
         */
        _queryParcelLayer: function (parcelIndex) {
            console.log('app.Identify:_queryParcelLayer', arguments);

            var url = lang.replace(config.urls.parcelTemplate, [parcelIndex]);
            var parcelQuery = new QueryTask(url);

            this.parcelCriteria.outFields = ['PARCEL_ID', 'PARCEL_ADD', 'PARCEL_CITY', 'PARCEL_ZIP', 'OWN_TYPE',
                                             'RECORDER', 'ParcelsCur', 'ParcelNotes']

            return parcelQuery.execute(this.parcelCriteria);
        },
        /** Takes ephoc and retrns MM/DD/YYYY.
         * @param Number - epoch - date number
         * @returns String - MM/DD/YYYY
         */
        _formatDate: function () {
            console.log('app.Identity:_formatDate', arguments);

            if (!this.ParcelsCur && this.ParcelsCur < 1) {
                return '';
            }

            var date = new Date(this.ParcelsCur);

            return locale.format(date, {
                selector: 'date',
                formatLength: 'short'
            });
        },
        /** Hightlight the parcel geometry.
         * @param esri/geometry/Polygon - geometry - the geometry of the parcel
         */
        _highlightParcel: function (geometry) {
            console.log('app.Identity:_highlightParcel', arguments);

            if (this._graphic) {
                this.map.graphics.remove(this._graphic);
            }

            this._graphic = new Graphic(geometry, this.polygonSymbol);

            this.map.graphics.add(this._graphic);
        }
    });
});
