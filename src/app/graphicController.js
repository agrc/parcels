define([
    'esri/Color',
    'esri/graphic',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol'
], function (
    Color,
    Graphic,
    SimpleFillSymbol,
    SimpleLineSymbol
) {
    return {
        polygonSymbol: new SimpleFillSymbol('solid',
            new SimpleLineSymbol('solid', new Color([18,192,236,1]), 1.25),
            new Color([0,0,0,0.25])
        ),

        map: null,

        /** creates graphics and adds them to this.map for the features of a featureSet.
         * @param esri/task/FeatureSet - features - the parcel attributes
         */
        highlightFeatures: function (features) {
            console.log('app.graphicController:highlightFeatures', arguments);

            if (!features || features.length < 1) {
                return;
            }

            this._graphics = features.map(function createGraphic(feature) {
                return new Graphic(feature.geometry, this.polygonSymbol);
            }, this);

            this._graphics.forEach(function showGraphic(graphic) {
                this.map.graphics.add(graphic);
            }, this);

            return features;
        },
        /** remove graphics from the map.*/
        clearGraphics: function () {
            console.log('app.graphicController:clearGraphics', arguments);

            if (!(this._graphics instanceof Array)) {
                this._graphics = [this._graphics];
            }

            this._graphics.forEach(function removeGraphic(graphic) {
                this.map.graphics.remove(graphic);
            }, this);
        }
    };
});
