define([
    './config',

    'agrc/modules/String',

    'app/graphicController',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/date/locale',
    'dojo/dom-class',
    'dojo/keys',
    'dojo/on',
    'dojo/query',
    'dojo/request',
    'dojo/text!./templates/Identify.html',
    'dojo/text!./templates/ParcelTemplate.html',
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

    graphicController,

    _TemplatedMixin,
    _WidgetBase,

    locale,
    domClass,
    keys,
    on,
    query,
    request,
    template,
    parcelTemplate,
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
    return declare([_WidgetBase, _TemplatedMixin], {
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

            mustache.parse(parcelTemplate);   // optional, speeds up future uses

            this.parcelQuery = new QueryTask(config.urls.parcel + '/0');
            this.parcelCriteria = new Query();
            this.parcelCriteria.returnGeometry = true;
            this.parcelCriteria.outFields = ['*'];
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
                        this.close();
                    }
                })),
                topic.subscribe('identify', lang.hitch(this, '_populateIdentify'))
            );
        },
        onMapClick: function (evt) {
            // summary:
            //      user clicks on the map
            // evt: Map Click Event
            console.log('app.Identify:onMapClick', arguments);

            this.close();
            this.content.innerHTML = '';

            this.parcelCriteria.geometry = evt.mapPoint;

            var that = this;
            this.parcelQuery.execute(this.parcelCriteria)
                .then(lang.hitch(this, '_displayResults'), lang.hitch(this, '_queryError'))
                .always(function () {
                    domClass.remove(that.domNode, 'closed');
                });
        },
        /** closes the identify popup.
         * @param param_type - param_name - param_description
         * @returns return_type - return_description
         */
        close: function () {
            console.log('app.Identify:close', arguments);

            graphicController.clearGraphics();
            domClass.add(this.domNode, 'closed');
        },
        /** show feature attributes in identify popup.
         * @param esri/task/Feature - features - a feature
         * @returns return_type - return_description
         */
        _populateIdentify: function (feature, aliases) {
            console.log('app.Identify:_populateIdentify', arguments);

            var model = {};

            if (!feature) {
                this.content.innerHTML = mustache.render(parcelTemplate, model);

                return true;
            }

            var item = feature.attributes;
            item.formatParcelsCur = this._formatDate;
            item.fieldAliases = aliases;

            model.item = [item];

            this.content.innerHTML = mustache.render(parcelTemplate, model);

            domClass.remove(this.domNode, 'closed');
        },
        /** Puts the response into the mustache template and shows the footer.
         * @param esri/task/FeatureSet - response - the parcel attributes
         */
        _displayResults: function (response) {
            console.log('app.Identify:_displayResults', arguments);

            if (!response || !response.features) {
                return this._queryError();
            }

            this._populateIdentify(response.features[0], response.fieldAliases);

            graphicController.highlightFeatures([response.features[0]]);
        },
        /** Takes ephoc and retrns MM/DD/YYYY.
         * @param Number - epoch - date number
         * @returns String - MM/DD/YYYY
         */
        _formatDate: function () {
            console.log('app.Identity:_formatDate', arguments);

            if (!this.ParcelsCur || this.ParcelsCur < 1) {
                return '';
            }

            var timezone = new Date();
            var seconds = 60;
            var milliseconds = 1000;
            var date = new Date(this.ParcelsCur + timezone.getTimezoneOffset() * seconds * milliseconds);

            var offset = timezone.getTimezoneOffset() / seconds;
            var hours = timezone.getHours();

            date.setHours(hours - offset);

            return locale.format(date, {
                selector: 'date',
                formatLength: 'short'
            });
        },
        /** The error handler for the county query.
         * @param Error - err - ArcGIS Server error message returned in a JavaScript error object.
         */
        _queryError: function (err) {
            console.log('app.Identify:_queryError', arguments);

            topic.publish('error', err);
            var popupTemplate = '<div class="contract-popup">' +
                            '<h3 class="text-center">{0}</h3><p class="text-muted">{1}</p>' +
                            '</div>';
            var content = lang.replace(popupTemplate,
                ['No county was found where you clicked. Are you clicking inside Utah?', '']);

            if (err) {
                content = lang.replace(popupTemplate, ['There was a problem querying for parcel information.',
                    err.error.message]);
            }
            this.content.innerHTML = content;
        }
    });
});
