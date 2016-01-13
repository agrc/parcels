define([
    './config',

    'agrc/modules/String',

    'dijit/_WidgetBase',

    'dojo/date/locale',
    'dojo/dom-class',
    'dojo/keys',
    'dojo/on',
    'dojo/query',
    'dojo/request',
    'dojo/text!./templates/Identify.html',
    'dojo/topic',
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
    keys,
    on,
    query,
    request,
    template,
    topic,
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

            this.parcelQuery = new QueryTask(config.urls.parcel);
            this.parcelCriteria = new Query();
            this.parcelCriteria.returnGeometry = true;
            this.parcelCriteria.outFields = ['*'];

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
                this.parcelQuery.on('error', lang.hitch(this, '_queryError')),
                on(document, 'keydown', lang.hitch(this, function closeContainer(evt) {
                    var charOrCode = evt.charCode || evt.keyCode;
                    if (charOrCode === keys.ESCAPE) {
                        this._highlightParcel();
                        domClass.add(this.domNode, 'closed');
                    }
                }))
            );
        },
        onMapClick: function (evt) {
            // summary:
            //      user clicks on the map
            // evt: Map Click Event
            console.log('app.Identify:onMapClick', arguments);

            this._highlightParcel();
            domClass.add(this.domNode, 'closed');
            this.domNode.innerHTML = '';

            this.parcelCriteria.geometry = evt.mapPoint;

            var that = this;
            this.parcelQuery.execute(this.parcelCriteria)
                .then(lang.hitch(this, '_displayResults'))
                .always(function () {
                    domClass.remove(that.domNode, 'closed');
                });
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

            model.item = [item];

            this.domNode.innerHTML = mustache.render(this.templateString, model);

            this._highlightParcel(response.features[0].geometry);
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

            if (!geometry) {
                return;
            }

            this._graphic = new Graphic(geometry, this.polygonSymbol);

            this.map.graphics.add(this._graphic);
        },
        /** The error handler for the county query.
         * @param Error - err - ArcGIS Server error message returned in a JavaScript error object.
         */
        _queryError: function (err) {
            console.log('app.Identify:_queryError', arguments);

            topic.publish('error', err);
            var template = '<div class="contract-popup"><h3 class="text-center">{0}</h3><p class="text-muted">{1}</p></div>';
            var content = lang.replace(template, ['No county was found where you clicked. Are you clikcing inside Utah?', '']);

            if (err) {
                content = lang.replace(template, ['There was a problem querying for parcel information.',
                                                  err.error.message]);
            }
            this.domNode.innerHTML = content;
        }
    });
});
