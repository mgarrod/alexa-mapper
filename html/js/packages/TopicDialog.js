define(["dojo/_base/declare",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dojo/text!./templates/TopicDialog.html",
        "dojo/Evented",
        "dojo/on",
        "dojo/_base/lang",
        "dijit/form/ValidationTextBox",
        "dijit/Dialog"
        ],
    function(declare,
            _WidgetBase,
            _TemplatedMixin,
            _WidgetsInTemplateMixin,
            template,
            Evented,
            on,
            lang,
            ValidationTextBox,
            Dialog
            ) {
        return declare("TopicDialog", [Dialog, _WidgetsInTemplateMixin, Evented], { 
            templateString: template,
            _onCancel: function() {
                this.inherited(arguments); 
                
                if (!this.topic.isValid()) {
                    return false;
                }

                this.emit("topic-set", {
                    mapTopic: this.topic.get("value")
                });
                this.destroyRecursive();
            },
            startup: function() {
                this.inherited(arguments);
                
                if (this.mapTopic !== null) {
                    this.topic.set("value", this.mapTopic);
                }

                on(this.topic, "keyup", lang.hitch(this, function(event) {
                    if (event.keyCode == 13 && this.topic.isValid()) {
                        this._onCancel();
                    }
                }));
            }
        });
});