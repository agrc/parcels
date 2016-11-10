define([
    './config',
    './FindParcel',
    './Identify',

    'agrc/widgets/locate/FindAddress',
    'agrc/widgets/locate/MagicZoom',
    'agrc/widgets/map/BaseMap',

    'app/extents',
    'app/graphicController',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',
    'dijit/_WidgetsInTemplateMixin',

    'dojo/aspect',
    'dojo/dom',
    'dojo/dom-style',
    'dojo/io-query',
    'dojo/text!app/templates/App.html',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/dijit/Print',
    'esri/geometry/Extent',
    'esri/layers/ArcGISDynamicMapServiceLayer',

    'ijit/widgets/layout/SideBarToggler',

    'layer-selector',

    'app/Disclaimer'
], function (
    config,
    FindParcel,
    Identify,

    FindAddress,
    MagicZoom,
    BaseMap,

    extents,
    graphicController,

    _TemplatedMixin,
    _WidgetBase,
    _WidgetsInTemplateMixin,

    aspect,
    dom,
    domStyle,
    ioQuery,
    template,
    array,
    declare,
    lang,

    Print,
    Extent,
    ArcGISDynamicMapServiceLayer,

    SideBarToggler,

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

            var county = this._determineCounty(window.location.href);
            window.document.title = county.name + ' Parcels';
            this.county = county.name;
            this.countyExtent = county.extent;

            this.inherited(arguments);
        },
        postCreate: function () {
            // summary:
            //      Fires when
            console.log('app.App::postCreate', arguments);

            // set version number
            this.version.innerHTML = config.version;

            this.initMap(this.countyExtent);

            this.childWidgets.push(
                new FindAddress({
                    map: this.map,
                    apiKey: config.apiKey,
                    zoomLevel: 17,
                    wkid: 3857
                }, this.geocodeNode),
                new Print({
                    map: this.map,
                    url: config.urls.exportWebMapUrl,
                    templates: [{
                        label: 'Portrait (PDF)',
                        format: 'PDF',
                        layout: 'Letter ANSI A Portrait',
                        options: {
                            legendLayers: []
                        }
                    }]
                }, this.printDiv),
                new SideBarToggler({
                    sidebar: this.sideBar,
                    map: this.map,
                    centerContainer: this.centerContainer
                }, this.sidebarToggle),
                new FindParcel({
                    map: this.map,
                    selectedCounty: this.county
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
        initMap: function (extent) {
            // summary:
            //      Sets up the map
            console.log('app.App::initMap', arguments);

            this.map = new BaseMap(this.mapDiv, {
                showAttribution: false,
                useDefaultBaseMap: false,
                extent: extent
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

            var parcels = new ArcGISDynamicMapServiceLayer(config.urls.parcel, {
                id: 'Parcels',
                opacity: 0.75
            });

            this.map.addLayer(parcels);
            graphicController.map = this.map;
        },
        /** pulls the county from the #/{County} url and returns it or empty String.
         * @param {String} - str - The window.location.href value
         * @returns {String} - the county name or empty String
         */
        _determineCounty: function (str) {
            console.log('app.App:_determineCounty', arguments);

            var i = str.indexOf('#/');
            var county =  (i >= 0) ? str.substring(i + 2) : '';

            var county = extents.filter(function extractName(item) {
                return item.name === county;
            });

            if (!county || county.length < 1) {
                county = [{
                    name: 'Utah State',
                    extent: new Extent({
                        xmax: -12010849.397533866,
                        xmin: -12898741.918094235,
                        ymax: 5224652.298632992,
                        ymin: 4422369.249751998,
                        spatialReference: {
                            wkid: 3857
                        }
                    })}];
            }

            return county[0];
        }
    });
});
