-- Installation --

1. Add the site.css file to your webpage and include it in your html with (You can rename it if you want)
	<link rel="stylesheet" href="/path/to/.../site.css" />

2. Add the Jquery library to your project and include it in your html with:
	<script src="/path/to/.../jquery-2.2.0.min.js"></script> 

3. Include the Google Maps API with the Drawing tool extension by adding this to your html:
	<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=drawing&extension=.js"></script>

4. Include the zoneMapApp.js file with
      <script type="text/javascript" src="/path/to/zoneMapApp.js"></script>

4. Add a div to hold the map:
	<div id="map"></div>

5. Initialize the application. See index.html for how to do this

6. There are TODO's in the index.html file. Make sure to fill these out to pull / load data from your database.



-- NOTES --
1. The source code is compiled into the zoneMapApp.js script file. If you want to look at the individual, uncombined files you can look in the src directory.

2. The toolbar can be styled however you want. Changes to that can be done in the Toolbar class


-- FUNCTIONALITY --
1. By default, a sample zone is loaded to show how one could be loaded from the database.

2. By default, a marker is placed at a store location to show how a store could be loaded by default

3. Shapes can be modified by clicking the 'Hand' icon and clicking them. Once selected, shapes can be dragged, removed, or have their vertices changed.
	3.1 'Remove' deletes the shape
	3.2 'Cancel' cancels the current selection

4. Polygons can be drawn by clicking the polygon icon. After completing, the new polygon will be selected

5. Only one polygon can be selected at a time

6. Clicking the 'Save' button will show you the JSON for all objects. This is the data you will post back to your server