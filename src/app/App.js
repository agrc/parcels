define([
    './config',
    './FindParcel',
    './Identify',

    'agrc/widgets/locate/FindAddress',
    'agrc/widgets/locate/MagicZoom',

    'app/graphicController',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/aspect',
    'dojo/dom',
    'dojo/dom-style',
    'dojo/text!app/templates/App.html',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/geometry/Extent',
    'esri/layers/FeatureLayer',
    'esri/map',

    'layer-selector'
], function (
    config,
    FindParcel,
    Identify,

    FindAddress,
    MagicZoom,

    graphicController,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    aspect,
    dom,
    domStyle,
    template,
    array,
    declare,
    lang,

    Extent,
    FeatureLayer,
    Map,

    LayerSelector
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        // summary:
        //      The main widget for the app

        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'app',

        // childWidgets: Object[]
        //      container for holding custom child widgets
        childWidgets: null,

        // map: agrc.widgets.map.Basemap
        map: null,

        constructor: function () {
            // summary:
            //      first function to fire after page loads
            console.info('app.App::constructor', arguments);

            config.app = this;
            this.childWidgets = [];

            this.inherited(arguments);
        },
        postCreate: function () {
            // summary:
            //      Fires when
            console.log('app.App::postCreate', arguments);

            // set version number
            this.version.innerHTML = config.version;

            this.initMap();

            var geocode = new FindAddress({
                map: this.map,
                apiKey: config.apiKey,
                zoomLevel: 17
            }, this.geocodeNode);

            aspect.after(geocode, '_done', function () {
                setTimeout(lang.hitch(this, function () {
                    this.graphicsLayer.remove(this._graphic);
                }), 2500);
            });

            this.childWidgets.push(
                geocode,
                new FindParcel({
                    map: this.map
                }, this.parcelNode),
                new MagicZoom({
                    map: this.map,
                    apiKey: config.apiKey,
                    searchField: 'NAME',
                    placeHolder: 'place name...',
                    maxResultsToDisplay: 10,
                    wkid: 3857,
                    'class': 'first'
                }, this.gnisNode),
                new MagicZoom({
                    map: this.map,
                    apiKey: config.apiKey,
                    searchLayer: 'SGID10.Boundaries.Municipalities',
                    searchField: 'NAME',
                    placeHolder: 'city name...',
                    wkid: 3857,
                    maxResultsToDisplay: 10
                }, this.cityNode)
            );

            this.inherited(arguments);
        },
        startup: function () {
            // summary:
            //      Fires after postCreate when all of the child widgets are finished laying out.
            console.log('app.App::startup', arguments);

            var that = this;
            array.forEach(this.childWidgets, function (widget) {
                console.log(widget.declaredClass);
                that.own(widget);
                widget.startup();
            });

            this.inherited(arguments);
        },
        initMap: function () {
            // summary:
            //      Sets up the map
            console.info('app.App::initMap', arguments);

            this.map = new Map(this.mapDiv, {
                extent: new Extent({
                    xmax: -12010849.397533866,
                    xmin: -12898741.918094235,
                    ymax: 5224652.298632992,
                    ymin: 4422369.249751998,
                    spatialReference: {
                        wkid: 3857
                    }}),
                showLabels: true
            });

            this.childWidgets.push(
                new LayerSelector({
                    map: this.map,
                    quadWord: config.quadWord,
                    baseLayers: [
                        'Imagery',
                        'Hybrid',
                        {
                            token: 'Lite',
                            selected: true
                        },
                        'Topo',
                        'Terrain',
                        'Color IR',
                        'Bad Token'
                    ],
                    overlays: ['Overlay']
                }),
                new Identify({map: this.map}, this.infoBar)
            );

            var parcels = new FeatureLayer(config.urls.parcel, {
                showLabels: true,
                outFields: ['PARCEL_ID']
            });

            this.map.addLayer(parcels);
            graphicController.map = this.map;
        }
    });
});
