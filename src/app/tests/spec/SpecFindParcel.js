require([
    'app/FindParcel'
], function (
    WidgetUnderTest
) {
    describe('app/FindParcel', function () {
        var widget;
        var destroy = function (widget) {
            widget.destroyRecursive();
            widget = null;
        };

        beforeEach(function () {
            var div = document.createElement('div');
            document.body.appendChild(div);
            widget = new WidgetUnderTest(null, div);
            widget.startup();
        });

        afterEach(function () {
            if (widget) {
                destroy(widget);
            }
        });

        describe('Sanity', function () {
            it('should create a FindParcel', function () {
                expect(widget).toEqual(jasmine.any(WidgetUnderTest));
            });
        });
    });
});
