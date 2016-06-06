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