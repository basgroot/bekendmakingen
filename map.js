/*jslint browser: true, for: true, long: true, unordered: true */
/*global window console google */

// This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
function initBekendmakingenMap() {
    var mapDetails = {
        "initialZoomLevel": 17,
        "center": {
            "lat": 52.35430482656097,
            "lng": 4.896706237692308
        }
    };
    var map;
    var infoWindow;
    //var markersArray = [];

    function convertRijksdriehoekToLatLng(x, y) {
        // The city "Amsterfoort" is used as reference "Rijksdriehoek" coordinate.
        const referenceRdX = 155000;
        const referenceRdY = 463000;
        const dX = (x - referenceRdX) * (Math.pow(10, -5));
        const dY = (y - referenceRdY) * (Math.pow(10, -5));
        const sumN = (3235.65389 * dY) + (-32.58297 * Math.pow(dX, 2)) + (-0.2475 * Math.pow(dY, 2)) + (-0.84978 * Math.pow(dX, 2) * dY) + (-0.0655 * Math.pow(dY, 3)) + (-0.01709 * Math.pow(dX, 2) * Math.pow(dY, 2)) + (-0.00738 * dX) + (0.0053 * Math.pow(dX, 4)) + (-0.00039 * Math.pow(dX, 2) * Math.pow(dY, 3)) + (0.00033 * Math.pow(dX, 4) * dY) + (-0.00012 * dX * dY);
        const sumE = (5260.52916 * dX) + (105.94684 * dX * dY) + (2.45656 * dX * Math.pow(dY, 2)) + (-0.81885 * Math.pow(dX, 3)) + (0.05594 * dX * Math.pow(dY, 3)) + (-0.05607 * Math.pow(dX, 3) * dY) + (0.01199 * dY) + (-0.00256 * Math.pow(dX, 3) * Math.pow(dY, 2)) + (0.00128 * dX * Math.pow(dY, 4)) + (0.00022 * Math.pow(dY, 2)) + (-0.00022 * Math.pow(dX, 2)) + (0.00026 * Math.pow(dX, 5));
        // The city "Amsterfoort" is used as reference "WGS84" coordinate.
        const referenceWgs84X = 52.15517;
        const referenceWgs84Y = 5.387206;
        const latitude = referenceWgs84X + (sumN / 3600);
        const longitude = referenceWgs84Y + (sumE / 3600);
        // Input
        // x = 122202
        // y = 487250
        //
        // Result
        // "52.372143838117, 4.90559760435224"
        return {
            "lat": latitude,
            "lng": longitude
        };
    }

    function showInfoWindow(marker, header, body) {
        infoWindow.setContent("<div class='info_window'><h2 class='info_window_heading'>" + header + "</h2><div class='info_window_body'><p>" + body + "</p></div></div>");
        infoWindow.open({
            "anchor": marker,
            "map": map,
            "shouldFocus": true
        });
    }

    function addMarker(bekendmaking) {
        // 2022-09-05T09:04:57.175Z;
        // https://zoek.officielebekendmakingen.nl/gmb-2022-396401.html;
        // "Besluit apv vergunning Verleend Monnikendammerweg 27";
        // "TVM- 7 PV reserveren - Monnikendammerweg 27-37 - 03-07/10/2022, Monnikendammerweg 27";
        // 125171;
        // 488983
        // https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions
        var marker = new google.maps.Marker({
            "map": map,
            "position": convertRijksdriehoekToLatLng(bekendmaking[4], bekendmaking[5]),
            "clickable": true,
            //"optimized": false,
            "visible": true,
            //"icon": "https://elektrischdeelrijden.nl/wp-content/include-me/map/auto.png",
            //"zIndex": property.zIndex,
            "title": bekendmaking[2]
        });
        marker.addListener(
            "click",
            function () {
                var description = bekendmaking[3] + "<br /><br />Meer info: <a href='" + bekendmaking[1] + "'>" + bekendmaking[1] + "</a>.";
                showInfoWindow(marker, bekendmaking[2], description);
            }
        );
        //markersArray.push({
        //    "marker": marker,
        //    "maxZoomLevel": property.maxZoomLevel,
        //    "minZoomLevel": property.minZoomLevel
        //});
        return marker;
    }

    function addMarkers() {
        //const markers = [];
        document.getElementById("idBekendmakingen").value.split("\n").forEach(function (bekendmaking) {
            addMarker(bekendmaking.split(";"));
        });
        // Add a marker clusterer to manage the markers.
        //new markerClusterer.MarkerClusterer({ markers, map });
    }

    function internalInitMap() {
        infoWindow = new google.maps.InfoWindow();
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        map = new google.maps.Map(
            document.getElementById("overzicht-bekendmakingen"),
            {
                "clickableIcons": false,
                // Paid feature - "mapId": "c2a918307d540be7",  // https://console.cloud.google.com/google/maps-apis/studio/styles?project=eddepijp
                "center": new google.maps.LatLng(mapDetails.center.lat, mapDetails.center.lng),
                "mapTypeId": google.maps.MapTypeId.ROADMAP,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
                "gestureHandling": "cooperative",  // When scrolling, keep scrolling
                "zoom": mapDetails.initialZoomLevel
            }
        );
        //addMarkers();
        map.addListener("zoom_changed", function () {
            var zoom = map.getZoom();
        //    // Iterate over markers and call setVisible
        //    markersArray.forEach(function (marker) {
        //        marker.marker.setVisible(isMarkerVisible(zoom, marker.minZoomLevel, marker.maxZoomLevel));
        //    });
        //    infoWindow.close();
            console.log("ZoomLevel: " + zoom);
        });
        map.addListener("center_changed", function () {
            console.log("New center: " + map.getCenter());
        });
    }

    internalInitMap();

    document.getElementById("idBtnShowMap").addEventListener("click", addMarkers);
}
