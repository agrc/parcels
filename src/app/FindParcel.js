define([
    'app/config',
    'app/counties',
    'app/graphicController',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom-class',
    'dojo/keys',
    'dojo/on',
    'dojo/text!app/templates/FindParcel.html',
    'dojo/topic',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/Color',
    'esri/graphic',
    'esri/graphicsUtils',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    config,
    counties,
    graphicController,

    _TemplatedMixin,
    _WidgetBase,

    domClass,
    keys,
    on,
    template,
    topic,
    declare,
    lang,

    Color,
    Graphic,
    graphicsUtils,
    SimpleFillSymbol,
    SimpleLineSymbol,
    Query,
    QueryTask
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        /**
         * @private
         * @const
         * @property {string} templateString - The class' html `templateString`.
         */
        templateString: template,
        /**
         * @const
         * @private
         * @default layer-selector
         * @property {string} baseClass - The class' css `baseClass` name.
         */
        baseClass: 'find-parcel',


        /**
         * Find a parcel based on a county and a parcel id.
         * @name find-parcel
         * @param {HTMLElement|string} [node] - The domNode or string id of a domNode to create this widget on. If null
         * a new div will be created but not placed in the dom. You will need to place it programmatically.
         * @param params {object}
         */
        constructor: function () {
            console.log('app.FindParcel::constructor', arguments);

            this.parcelQuery = new QueryTask(config.urls.parcel + '/0');
            this.parcelCriteria = new Query();
            this.parcelCriteria.returnGeometry = true;
            this.parcelCriteria.outFields = ['*'];
        },
        /**
         * This is fired after all properties of a widget are defined, and the document fragment representing the
         * widget is created—but before the fragment itself is added to the main document.
         * @private
         */
        postCreate: function () {
            console.log('app.FindParcel::postCreate', arguments);

            counties.forEach(function addOptions(county) {
                var option = document.createElement('option');
                option.value = county.replace(/\s+/g, '');
                option.innerHTML = county;

                this.county.appendChild(option);
            }, this);

            this._setupConnections();
            this.inherited(arguments);
        },
        /**
         * wire events, and such
         * @private
         */
        _setupConnections: function () {
            console.log('app.FindParcel::_setupConnections', arguments);

            this.watch('countyName', lang.hitch(this, '_showParcelId'));
            this.watch('parcelId', lang.hitch(this, '_showSubmit'));
            on(this.parcelId, 'keypress', lang.hitch(this, '_shouldSearch'));
            this.parcelQuery.on('error', lang.hitch(this, '_queryError'));
        },
        /** function to monitor changes to the county value. */
        _showParcelId: function (field, previous, current) {
            console.log('app.FindParcel:_showParcelId', arguments);

            domClass.toggle(this.parcelGroup, 'hidden', !current);

            graphicController.clearGraphics();

            domClass.add(this.errors, 'hidden');
            this.errors.innerHTML = '';
        },
        /** function to monitor changes to the parcel id value. */
        _showSubmit: function (field, previous, current) {
            console.log('app.FindParcel:_showParcelId', arguments);

            domClass.toggle(this.searchGroup, 'hidden', !current);
            graphicController.clearGraphics();

            domClass.add(this.errors, 'hidden');
            this.errors.innerHTML = '';
        },
        /** Triggered when the county select changes and sets the county for the where clause to query parcel ids.
         * @param event - evt - the on change event object
         * @returns string - The new value for county.
         */
        _setCounty: function (evt) {
            console.log('app.FindParcel:_setCounty', arguments);

            this.set('countyName', evt.target.value);
            return evt.target.value;
        },
        /** Triggered when the parcel input changes and sets the parcel id for the where clause to query parcel ids.
         * @param event - evt - the on input, change, paste event object
         * @returns string - The new value for parcel id.
         */
        _setParcelId: function (evt) {
            console.log('app.FindParcel:_set', arguments);

            this.set('parcelId', evt.target.value);
            return evt.target.value;
        },
        /** Handle the keypress event and execute search if it was the enter key8.
         * @param Event - evt - keypress event
         */
        _shouldSearch: function (evt) {
            console.log('app.FindParcel:_shouldSearch', arguments);

            var charOrCode = evt.charCode || evt.keyCode;
            if (charOrCode === keys.ENTER) {
                this.search();
            }
        },
        /** Build query string and fire xhr. */
        search: function () {
            console.log('app.FindParcel:search', arguments);

            graphicController.clearGraphics();

            if (!this.get('countyName') || !this.get('parcelId')) {
                this.errors.innerHTML = 'Supply a value for county and parcel id.';
                return;
            }

            this._showProgress(true);

            var where_clause = this._buildWhereClause(this.get('countyName'), this.get('parcelId'));

            this.parcelCriteria.where = where_clause;

            if (this._inFlight) {
                this._inFlight.cancel();
            }

            var that = this;
            this._inFlight = this.parcelQuery.execute(this.parcelCriteria)
                .then(lang.hitch(this, '_displayResults'), lang.hitch(this, '_queryError'))
                .always(function hideProgress() {
                    that._showProgress(false);
                });
        },
        /** Composes the where clause to find parcel by id.
         * @param string - countyName - The county name
         * @param string - parcelId - The parcel id number
         * @returns string - The composed where clause
         */
        _buildWhereClause: function (countyName, parcelId) {
            console.log('app.FindParcel:_buildWhereClause', arguments);

            return lang.replace('PARCEL_ID=\'{0}\' AND County=\'{1}\'', [parcelId, countyName]);
        },
        /** Puts the response into the mustache template and shows the footer.
         * @param esri/task/FeatureSet - response - the parcel attributes
         */
        _displayResults: function (response) {
            console.log('app.FindParcel:_displayResults', arguments);

            if (!response || !response.features) {
                return this._queryError();
            }

            topic.publish('identify', response.features[0], response.fieldAliases);
            this._zoomToExtent(response.features);
            graphicController.highlightFeatures(response.features);
        },
        /** Gets the FeatureSet features and zooms to the extent.
         * @param {[Features]} - features - The features returned from a query task
         */
        _zoomToExtent: function (features) {
            console.log('app.FindParcel:_zoomToExtent', arguments);

            if (!features || features.length < 1) {
                return this._queryError();
            }

            var extent = graphicsUtils.graphicsExtent(features);

            this.map.setExtent(extent.expand(10));
        },
        /** Show or hide a progress indicator.
         * @param bool - show - if true, show progress, if false hide progress
         */
        _showProgress: function (show) {
            console.log('app.FindParcel:_showProgress', arguments);

            domClass.toggle(this.activity, 'hidden', !show);
        },
        /** The error handler for the county query.
         * @param Error - err - ArcGIS Server error message returned in a JavaScript error object.
         */
        _queryError: function (err) {
            console.log('app.FindParcel:_queryError', arguments);

            var template = '<h4>{0}</h4><p class="text-muted">{1}</p></div>';
            var content = lang.replace(template, ['No parcel was found with that id. ' +
                                                  'Are you sure you have the correct county and parcel id?', '']);

            if (err) {
                content = lang.replace(template, ['There was a problem querying for parcel information.',
                                                  err.error.message]);
            }
            this.errors.innerHTML = content;
            domClass.remove(this.errors, 'hidden');
        }
    });
});
