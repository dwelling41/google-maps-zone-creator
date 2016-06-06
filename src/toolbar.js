(function() {


    /* Constructor */
    ZoneMapApp.Toolbar = function(controlDiv, removeZoneCb, cancelZoneCb) {
        /* Properties */
        this._currentlySelectedZone = null;
        this._containerContentDeleteAction = null;
        this._containerContentCancelAction = null;
        this._removeZoneCb = removeZoneCb; // removeZoneCb(zoneToDelete)
        this._cancelZoneCb = cancelZoneCb; // cancelZoneCb(zoneToCancel)
        this._containerDiv = null;
        this._containerContentDiv = null;

        // Add the container to the control zone
        this._containerDiv = $('<div class="toolbar-container"></div>');
        this._containerDiv.appendTo(controlDiv);

        // Add the content to the control zone
        this._containerContentDiv = $('<div class="toolbar-content"></div>')
        this._containerContentDiv.html('Select a zone');
        this._containerContentDiv.appendTo(this._containerDiv);
    };

    /* Public Methods */
    ZoneMapApp.Toolbar.prototype.setZone = function(zone) {
        // Save off reference to this
        var self = this;

        // Clear the existing selection
        this.clearZoneSelection(false);

        // Save off the currently selected polygon
        this._currentlySelectedZone = zone;

        // Create the action buttons and add them to the content
        this._containerContentDeleteAction = $('<button>Remove</button>');
        this._containerContentDeleteAction.appendTo(this._containerContentDiv);
        this._containerContentDeleteAction.on('click', function() {
            self._removeZoneCb(self._currentlySelectedZone);
            self.clearZoneSelection(true);
        });

        this._containerContentCancelAction = $('<button>Cancel</button>');
        this._containerContentCancelAction.appendTo(this._containerContentDiv);
        this._containerContentCancelAction.on('click', function() {
            self._cancelZoneCb(self._currentlySelectedZone);
            self.clearZoneSelection(true);
        });
    };

    ZoneMapApp.Toolbar.prototype.clearZoneSelection = function(showDefaultText) {
        // Clear the currently selected polygon
        this._currentlySelectedZone = null;

        // Clear the existing content
        this._containerContentDiv.empty();
        this._containerDiv.html = "";

        // Clear existing event handlers
        if (this._containerContentDeleteAction)
            this._containerContentDeleteAction.off('click');
        if (this._containerContentCancelAction)
            this._containerContentCancelAction.off('click');


        // Show the default text if needed
        if (showDefaultText) {
            this._containerContentDiv.html('Select a zone');
        };
    };


})();