define([
    'app/config',
    'app/counties',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/text!app/templates/FindParcel.html',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/dijit/Search',
    'esri/layers/FeatureLayer'
], function (
    config,
    counties,

    _TemplatedMixin,
    _WidgetBase,

    template,
    declare,
    lang,

    Search,
    FeatureLayer
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
        },
        /**
         * This is fired after all properties of a widget are defined, and the document fragment representing the
         * widget is created—but before the fragment itself is added to the main document.
         * @private
         */
        postCreate: function () {
            console.log('app.FindParcel::postCreate', arguments);

            this.searchWidget = new Search({
                map: this.map,
                enableButtonMode: true,
                enableSourcesMenu: true, // missing css or something for menu
                enableLabel: false,
                enableInfoWindow: false,
                enableSearchingAll: false,
                autoNavigate: false
            }, this.search);

            var sources = counties.map(function (county, i) {
                return {
                    featureLayer: new FeatureLayer(lang.replace(config.urls.parcelTemplate, [++i])),
                    searchFields: ['PARCEL_ID'],
                    exactMatch: false,
                    outFields: ['PARCEL_ID'],
                    name: county,
                    placeholder: county + ' Parcel Id Number',
                    maxResults: 10,
                    maxSuggestions: 5,
                    enableSuggestions: true,
                    minCharacters: 2
                }
            }, this);

            this.searchWidget.set('sources', sources);

            this._setupConnections();
            this.inherited(arguments);
        },
        /**
         * wire events, and such
         * @private
         */
        _setupConnections: function () {
            console.log('app.FindParcel::_setupConnections', arguments);

            this.own(this.searchWidget.on('select-result', lang.hitch(this, '_zoomToExtent')));
        },
        /** starts up the widget once the application has loaded. */
        startup: function () {
            console.log('app.FindParcel:startup', arguments);

            this.searchWidget.startup();
        },
        /** Gets the select-result event object and zooms to the centroid of the extent object.
         * @param {Object} - response - result, source, sourceIndex
         */
        _zoomToExtent: function (response) {
            console.log('app.FindParcel:_zoomToExtent', arguments);

            if (!response || !response.result || response.result.length < 1) {
                return;
            }

            this.map.setExtent(response.result.extent.expand(10));
        }
    });
});
