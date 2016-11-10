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

        // dontShowMeKey: String
        //      localStorage key
        dontShowMeKey: 'dontShowParcelsDisclaimerDialog',

        postCreate: function () {
            console.log('app/Disclaimer:postCreate', arguments);

            if (localStorage.getItem(this.dontShowMeKey) === 'true') {
                return;
            }

            $(this.modal).modal({
                keyboard: false,
                backdrop: 'static'
            });
        },
        onShowMeChange: function (evt) {
            // summary:
            //      don't show me this again checkbox has been changed
            // evt: Event
            console.log('app/Disclaimer:onShowMeChange', arguments);

            localStorage.setItem(this.dontShowMeKey, evt.target.checked);
        }
    });
});
