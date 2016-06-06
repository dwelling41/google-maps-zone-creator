(function() {
    'use strict';

    // Setup the application
    var ZoneMapApp = {

        /* Properties */
        // Holds a list of all tracked zones 
        _allTrackedZones: [],

        // Holds the _toolbar
        _toolbar: null,

        // Holds the _toolbar div element
        _toolbarDiv: null,

        // Holds the Google Maps Drawing Manager instance
        _drawingManager: null,


        /* Private Methods */
        _attachEventsToZone: function(zone) {
            // Setup a click listener
            google.maps.event.addListener(zone.polygon, 'click', ZoneMapApp._clickZone.bind(this, zone));
        },


        _clickZone: function(zone) {
            // Clear all existing selections
            ZoneMapApp._allTrackedZones.forEach(function(curZone) {
                curZone.onCancel();
            });

            // Click the current zone
            zone.onClick();
            ZoneMapApp._toolbar.setZone(zone);
        },

        _removeZone: function(zoneToRemove) {
            // make sure the zone is set
            if (!zoneToRemove) {
                return;
            }

            // Run the removal code
            zoneToRemove.onRemove();

            // Find the zone to remove and delete it from the tracked list
            var zoneIndex = ZoneMapApp._allTrackedZones.indexOf(zoneToRemove);
            if (zoneIndex >= 0) {
                ZoneMapApp._allTrackedZones.splice(zoneIndex, 1);
            };
        },

        _cancelZone: function(zoneToCancel) {
            // make sure the zone is set
            if (!zoneToCancel) {
                return;
              };

            // Run the cancel code
            zoneToCancel.onCancel();
        },

        _createZone: function(polygon) {
            // Track the new zone
            var newZone = new ZoneMapApp.Zone(0, polygon);
            ZoneMapApp._allTrackedZones.push(newZone);
            ZoneMapApp._attachEventsToZone(newZone);

            // Click the new zone
            ZoneMapApp._clickZone(newZone);

            // Default to the selection tool
            ZoneMapApp._drawingManager.setDrawingMode(null);
        },

        /* Public Methods */
        getZonesJSON: function() {
            // Setup the zones to save
            var zonesToSave = [];

            // Push each zone's json representation
            ZoneMapApp._allTrackedZones.forEach(function(curZone) {
                var curJSON = curZone.getJSON();
                zonesToSave.push(curJSON);
            });

            // Return the results
            return zonesToSave;
        },

        init: function(mapId, storeLocation, storeName, dbItems) {
            // Create a new google map
            var mapOptions = {
                center: storeLocation,
                zoom: 18,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById(mapId), mapOptions);

            // Add a marker at the default location
            var marker = new google.maps.Marker({
                position: storeLocation,
                map: map,
                title: storeName
            });

            // Add the custom toolbar to the top-center of the map
            ZoneMapApp._toolbarDiv = document.createElement('div');
            ZoneMapApp._toolbar = new ZoneMapApp.Toolbar(ZoneMapApp._toolbarDiv, ZoneMapApp._removeZone, ZoneMapApp._cancelZone);
            map.controls[google.maps.ControlPosition.TOP_CENTER].push(ZoneMapApp._toolbarDiv);

            // Add the google maps drawing tools (Show the selection and Polygon tool)
            ZoneMapApp._drawingManager = new google.maps.drawing.DrawingManager({
                drawingControlOptions: {
                    position: google.maps.ControlPosition.LEFT_BOTTOM,
                    drawingModes: [
                        google.maps.drawing.OverlayType.POLYGON
                    ]
                }
            });
            ZoneMapApp._drawingManager.setMap(map);

            // Add each of the existing zones onto the map
            dbItems.forEach(function(curZoneJSONString) {
                // Get the zone and make sure its set
                var zoneToTrack = ZoneMapApp.Zone.GetFromJSON(curZoneJSONString, map);
                if (zoneToTrack != null) {
                    // Track the zone
                    ZoneMapApp._allTrackedZones.push(zoneToTrack);
                    ZoneMapApp._attachEventsToZone(zoneToTrack);
                };
            });


            // Setup an event listener on polygons being drawn
            google.maps.event.addListener(ZoneMapApp._drawingManager, 'polygoncomplete', ZoneMapApp._createZone);
        }
    }


    // Get the global instance
    var glob =
        typeof window !== 'undefined' ? window :
        typeof global !== 'undefined' ? global :
        typeof WorkerGlobalScope !== 'undefined' ? self : {};

    // Attach the application to it
    glob.ZoneMapApp = ZoneMapApp;

})();

(function() {


    /* Constructor */
    ZoneMapApp.Zone = function(id, polygon) {
        /* Properties */
        this.id = id;
        this.polygon = polygon;
    };

    /* Public Methods */
    ZoneMapApp.Zone.prototype.onClick = function() {
        this.polygon.setEditable(true);
        this.polygon.setDraggable(true);
    };


    ZoneMapApp.Zone.prototype.onRemove = function() {
        this.polygon.setEditable(false);
        this.polygon.setDraggable(false);
        this.polygon.setMap(null);
        google.maps.event.clearListeners(this.polygon, 'click');
    };

    ZoneMapApp.Zone.prototype.onCancel = function() {
        this.polygon.setEditable(false);
        this.polygon.setDraggable(false);
    };

    ZoneMapApp.Zone.prototype.getJSON = function() {
        // Setup the fields to hold the data
        var verticesX = [];
        var verticesY = [];

        // Go through each path point and get the lat and long converted to x,y
        this.polygon.getPath().forEach(function(curLatLong) {
            verticesX.push("" + curLatLong.lat());
            verticesY.push("" + curLatLong.lng());
        });

        // Return the object
        return {
            id: this.id,
            vertices_x: verticesX,
            vertices_y: verticesY
        };
    };


    /* Static Methods */
    ZoneMapApp.Zone.GetFromJSON = function(zoneDbString, map) {
        // Objects are stored as { id: vertices_x: ["string"], vertices_y: ["string"] }

        // Make sure the JSON is set
        if (!zoneDbString) {
            return null;
        };

        // parse the json and make sure its set
        var parsedJSON = JSON.parse(zoneDbString);
        if (!parsedJSON) {
            return null;
        };

        // make sure # vert x and y match and are set
        if (!parsedJSON.vertices_x || !parsedJSON.vertices_y || parsedJSON.vertices_x.length != parsedJSON.vertices_y.length) {
            return;
        };

        // Get the lat/long paths from the vertices
        var defaultPath = new google.maps.MVCArray();
        for (var i = 0; i < parsedJSON.vertices_x.length; i++) {
            var lat = parseFloat(parsedJSON.vertices_x[i]);
            var long = parseFloat(parsedJSON.vertices_y[i]);

            var latLong = new google.maps.LatLng(lat, long);
            defaultPath.push(latLong);
        };

        // Setup the Google polygon
        var defaultPolygon = new google.maps.Polygon({
            clickable: true,
            paths: defaultPath,
            map: map
        });

        return new ZoneMapApp.Zone(parsedJSON.id, defaultPolygon);
    };




})();

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