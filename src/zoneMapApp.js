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