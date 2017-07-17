define([
    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/_base/declare',
    'dojo/text!app/templates/Disclaimer.html',

    'bootstrap'
], function (
    _TemplatedMixin,
    _WidgetBase,

    declare,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

        postCreate: function () {
            console.log('app/Disclaimer:postCreate', arguments);

            $(this.modal).modal({
                keyboard: false,
                backdrop: 'static'
            });
        }
    });
});
