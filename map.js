/*jslint browser: true, for: true, long: true, unordered: true */
/*global window console google */

// Check ook exploitatievergunningen horeca met terrasgrenzen en ontheffingen: https://api.data.amsterdam.nl/v1/wfs/horeca/?REQUEST=GetFeature&SERVICE=WFS&version=2.0.0&count=5000&typenames=exploitatievergunning&BBOX=4.58565,52.03560,5.31360,52.48769,urn:ogc:def:crs:EPSG::4326&outputformat=geojson&srsName=urn:ogc:def:crs:EPSG::4326

// This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
function initBekendmakingenMap() {
    var map;
    var infoWindow;
    var inputData;
    var markersArray = [];
    var delayedMarkersArray = [];

    function isNumeric(n) {
        return !Number.isNaN(parseFloat(n)) && Number.isFinite(n);
    }

    function getInitialMapSettings() {
        var zoomLevel = 17;
        var center = {
            "lat": 52.3545428061,
            "lng": 4.8963664691
        };
        var urlParams;
        var zoomParam;
        var centerParam;
        // ?zoom=15&center=52.436606513567,4.844183950027
        if (window.URLSearchParams) {
            urlParams = new window.URLSearchParams(window.location.search);
            zoomParam = urlParams.get("zoom");
            centerParam = urlParams.get("center");
            if (zoomParam && centerParam) {
                zoomParam = parseFloat(zoomParam);
                if (zoomParam > 12 && zoomParam <= 20) {
                    zoomLevel = zoomParam;
                }
                centerParam = centerParam.split(",");
                if (isNumeric(centerParam[0]) && isNumeric(centerParam[1])) {
                    center.lat = centerParam[0];
                    center.lng = centerParam[1];
                }
            }
            updateUrl(zoomLevel, new google.maps.LatLng(center.lat, center.lng));
        }
        return {
            "zoomLevel": zoomLevel,
            "center": center
        };
    }

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

    function getAlineas(responseXml) {
        const parser = new window.DOMParser();
        const xmlDoc = parser.parseFromString(responseXml, "text/xml");
        // gemeenteblad / zakelijke-mededeling / zakelijke-mededeling-tekst / tekst / <al>Verzonden naar aanvrager op: 20-09-2022</al>
        const zakelijkeMededeling = xmlDoc.getElementsByTagName("zakelijke-mededeling-tekst");
        return (
            zakelijkeMededeling.length === 0
            ? []
            : zakelijkeMededeling[0].getElementsByTagName("al")
        );
    }

    function getDaysPassed(date) {
        const today = new Date(new Date().toDateString());  // Rounded date
        const dateFrom = new Date(date.toDateString());
        return Math.round((today.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    }

    function parseBekendmaking(responseXml, datumGepubliceerd, gmbNumber) {

        function parseDate(value) {
            var year = value.substr(35, 4);
            var month = value.substr(32, 2);
            var day = value.substr(29, 2);
            var datumBekendgemaakt;
            if (Number.isNaN(parseInt(year, 10)) || Number.isNaN(parseInt(month, 10)) || Number.isNaN(parseInt(day, 10))) {
                console.log("Error parsing date (" + value + ") of license " + gmbNumber);
                return false;
            }
            datumBekendgemaakt = new Date(year + "-" + month + "-" + day);
            return new Date(datumBekendgemaakt.toDateString());
        }

        const identifier = "Verzonden naar aanvrager op: ";
        const alineas = getAlineas(responseXml);
        const maxLooptijd = (6 * 7) + 1;  // 6 weken de tijd om bezwaar te maken
        const dateFormatOptions = {"weekday": "long", "year": "numeric", "month": "long", "day": "numeric"};
        var datumBekendgemaakt;  // Datum verzonden aan belanghebbende(n)
        var looptijd;
        var resterendAantalDagenBezwaartermijn;
        var i;
        var j;
        var alinea;
        var value;
        var textToShow = "";
        var isBezwaartermijnFound = false;
        datumGepubliceerd = new Date(datumGepubliceerd.toDateString());
        for (i = 0; i < alineas.length; i += 1) {
            alinea = alineas[i];
            if (alinea.childNodes.length > 0) {
                for (j = 0; j < alinea.childNodes.length; j += 1) {
                    if (alinea.childNodes[j].nodeName === "#text") {
                        // Fix "Verzonden naar aanvrager op :" (https://zoek.officielebekendmakingen.nl/gmb-2022-441976.html)
                        value = alinea.childNodes[j].nodeValue.replace("op :", "op:");
                        if (value.substr(0, identifier.length) === identifier) {
                            // Verzonden naar aanvrager op: 02-09-2022
                            // Remove time from dates:
                            datumBekendgemaakt = parseDate(value);
                            if (datumBekendgemaakt !== false) {
                                isBezwaartermijnFound = true;
                                looptijd = getDaysPassed(datumBekendgemaakt);
                                resterendAantalDagenBezwaartermijn = maxLooptijd - looptijd;
                                textToShow = "Gepubliceerd: " + datumGepubliceerd.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br />Bekendgemaakt aan belanghebbende: " + datumBekendgemaakt.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br />" + (
                                    resterendAantalDagenBezwaartermijn > 0
                                    ? "Resterend aantal dagen voor bezwaar: " + resterendAantalDagenBezwaartermijn + "."
                                    : "<b>Geen bezwaar meer mogelijk.</b>"
                                ) + "<br /><br />";
                            }
                            break;
                        }
                    }
                }
            }
        }
        if (!isBezwaartermijnFound) {
            textToShow = "Gepubliceerd: " + datumGepubliceerd.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br /><br />";
        }
        document.getElementById(gmbNumber).innerHTML = textToShow;
    }

    function collectBezwaartermijn(gmbNumber, datumGepubliceerd) {

        function getYearFromGmbNumber() {
            return gmbNumber.substr(4, 4);
        }

        // URL: https://zoek.officielebekendmakingen.nl/gmb-2022-425209.html
        // Endpoint: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-425209/1/xml/gmb-2022-425209.xml
        //const url = "http://localhost/proxy-server/index.php?number=" + gmbNumber + "&year=" + getYearFromGmbNumber(gmbNumber);
        const url = "https://basement.nl/proxy-server/index.php?number=" + gmbNumber + "&year=" + getYearFromGmbNumber(gmbNumber);
        fetch(
            url,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.text().then(function (xml) {
                    parseBekendmaking(xml, datumGepubliceerd, gmbNumber);
                });
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function getGmbNumberFromUrl(websiteUrl) {
        // gmb-2022-425209
        return websiteUrl.substr(40, websiteUrl.length - 45);
    }

    function getIcon(title) {
        // Images are converted to SVG using https://png2svg.com/
        const aanvraagFilters = [
            "verlenging",
            "aanvraag"
        ];
        var apvFilter = "besluit apv";
        var isAanvraag = false;
        title = title.toLowerCase();
        aanvraagFilters.forEach(function (filter) {
            if (title.substring(0, filter.length) === filter) {
                isAanvraag = true;
            }
        });
        if (isAanvraag) {
            return "img/aanvraag.svg";
        }
        if (title.substring(0, apvFilter.length) === apvFilter) {
            return "img/apv.svg";
        }
        if (title.indexOf("exploitatievergunning") >= 0 || title.indexOf("alcoholwetvergunning") >= 0) {
            return "img/bar.svg";
        }
        if (title.indexOf("evenement") >= 0) {
            return "img/evenement.svg";
        }
        if (title.indexOf("bed & breakfast") >= 0 || title.indexOf("vakantieverhuur") >= 0) {
            return "img/hotel.svg";
        }
        return "img/constructie.svg";
    }

    function findUniquePosition(proposedCoordinate) {

        function isCoordinateAvailable(coordinate) {
            var isAvailable = true;  // Be positive
            var i;
            var marker;
            for (i = 0; i < markersArray.length; i += 1) {
                // Don't use forEach, to gain some performance.
                marker = markersArray[i];
                if (marker.position.lat === coordinate.lat && marker.position.lng === coordinate.lng) {
                    isAvailable = false;
                    break;
                }
            }
            return isAvailable;
        }

        while (!isCoordinateAvailable(proposedCoordinate)) {
            proposedCoordinate.lat = proposedCoordinate.lat + 0.000017;
            proposedCoordinate.lng = proposedCoordinate.lng + 0.000016;
        }
        return proposedCoordinate;
    }

    function isMarkerVisible(age, periodToShow) {
        switch (periodToShow) {
        case "3d":
            return age <= 3;
        case "7d":
            return age <= 7;
        case "14d":
            return age <= 14;
        default:
            return true;
        }
    }

    function addMarker(feature, periodToShow, position) {
        // 2022-09-05T09:04:57.175Z;
        // https://zoek.officielebekendmakingen.nl/gmb-2022-396401.html;
        // "Besluit apv vergunning Verleend Monnikendammerweg 27";
        // "TVM- 7 PV reserveren - Monnikendammerweg 27-37 - 03-07/10/2022, Monnikendammerweg 27";
        // 125171;
        // 488983
        // https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions
        var datumGepubliceerd = new Date(feature.properties.datum_tijdstip);
        var age = getDaysPassed(datumGepubliceerd);
        var marker = new google.maps.Marker({
            "map": map,
            "position": position,
            "clickable": true,
            "optimized": true,
            //"gestureHandling": "greedy",
            //"scaleControl": true,
            "visible": isMarkerVisible(age, periodToShow),
            "icon": {
                "url": getIcon(feature.properties.titel),
                "scaledSize": new google.maps.Size(35, 45)
            },
            //"zIndex": property.zIndex,
            "title": feature.properties.titel
        });
        var markerObject = {
            "age": age,
            "position": position,
            "marker": marker
        };
        marker.addListener(
            "click",
            function () {
                var gmbNumber = getGmbNumberFromUrl(feature.properties.url);
                var description = feature.properties.beschrijving + "<br /><br />Meer info: <a href=\"" + feature.properties.url + "\" target=\"blank\">" + feature.properties.url + "</a>.";
                showInfoWindow(marker, feature.properties.titel, "<div id=\"" + gmbNumber + "\"><br /><br /><br /></div>" + description);
                collectBezwaartermijn(gmbNumber, datumGepubliceerd);
            }
        );
        markersArray.push(markerObject);
        return markerObject;
    }

    function prepareToAddMarker(feature, periodToShow, position, bounds) {
        if (bounds.contains(position)) {
            addMarker(feature, periodToShow, position);
        } else {
            delayedMarkersArray.push({
                "feature": feature,
                "periodToShow": periodToShow,
                "position": position
            });
        }
    }

    function addMarkers() {
        const periodToShow = document.getElementById("idCbxPeriod").value;
        const bounds = map.getBounds();
        inputData.features.forEach(function (feature) {
            var position;
            switch (feature.geometry.type) {
            case "Point":
                position = findUniquePosition(convertRijksdriehoekToLatLng(feature.geometry.coordinates[0], feature.geometry.coordinates[1]));
                prepareToAddMarker(feature, periodToShow, position, bounds);
                break;
            case "MultiPoint":  // Example: https://zoek.officielebekendmakingen.nl/gmb-2022-502520.html
                feature.geometry.coordinates.forEach(function (coordinate) {
                    position = findUniquePosition(convertRijksdriehoekToLatLng(coordinate[0], coordinate[1]));
                    prepareToAddMarker(feature, periodToShow, position, bounds);
                });
                break;
            default:
                console.error("Unknown geometry type (['Point', 'MultiPoint']): " + JSON.stringify(feature));
            }
        });
    }

    function updateDisplayLevel() {
        const periodToShow = document.getElementById("idCbxPeriod").value;
        markersArray.forEach(function (marker) {
            marker.marker.setVisible(isMarkerVisible(marker.age, periodToShow));
        });
    }

    function updateUrl(zoom, center) {
        // Add to URL: /?zoom=15&center=52.43660651356703,4.84418395002761
        if (window.URLSearchParams) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set("zoom", zoom);
            searchParams.set("center", center.toUrlValue(10));
            window.history.replaceState(null, "", window.location.pathname + "?" + searchParams.toString());
        }
    }

    function internalInitMap() {
        var containerElm = document.getElementById("overzicht-bekendmakingen");
        var mapSettings = getInitialMapSettings();
        infoWindow = new google.maps.InfoWindow();
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        map = new google.maps.Map(
            containerElm,
            {
                "clickableIcons": false,
                // Paid feature - "mapId": "c2a918307d540be7",  // https://console.cloud.google.com/google/maps-apis/studio/styles?project=eddepijp
                "center": new google.maps.LatLng(mapSettings.center.lat, mapSettings.center.lng),
                "mapTypeId": google.maps.MapTypeId.ROADMAP,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
                "gestureHandling": "cooperative",  // When scrolling, keep scrolling
                "zoom": mapSettings.zoomLevel,
                "minZoom": 13
            }
        );
        map.addListener("zoom_changed", function () {
            // Add to URL: /?zoom=15&center=52.43660651356703,4.84418395002761
            var periodElm = document.getElementById("idCbxPeriod");
            var zoom = map.getZoom();
            // Iterate over markers and call setVisible
            if (zoom <= 13 && (periodElm.value === "7d" || periodElm.value === "14d" || periodElm.value === "all")) {
                // Set to 3 days
                periodElm.value = "3d";
                updateDisplayLevel();
            } else if (zoom <= 14 && (periodElm.value === "14d" || periodElm.value === "all")) {
                // Set to 7 days
                periodElm.value = "7d";
                updateDisplayLevel();
            } else if (zoom <= 15 && (periodElm.value === "all")) {
                // Set to 14 days
                periodElm.value = "14d";
                updateDisplayLevel();
            }
            infoWindow.close();
            console.log("Zoom changed to " + zoom);
        });
        map.addListener("idle", function () {
            // Time to display other markers..
            const bounds = map.getBounds();
            var delayedMarker;
            var i = delayedMarkersArray.length;
            while (i > 0) {
                i = i - 1;
                delayedMarker = delayedMarkersArray[i];
                if (bounds.contains(delayedMarker.position)) {
                    addMarker(delayedMarker.feature, delayedMarker.periodToShow, delayedMarker.position);
                    delayedMarkersArray.splice(i, 1);
                }
            }
            updateUrl(map.getZoom(), map.getCenter());
            console.log("Remaining items to add to the map: " + delayedMarkersArray.length);
        });
    }

    function loadData() {

        function sortBekendmakingen(a, b) {
            // Sort on time, so newer licences are projected above the older ones.
            return a.properties.datum_tijdstip.localeCompare(b.properties.datum_tijdstip);
        }

        const url = "https://api.data.amsterdam.nl/v1/wfs/bekendmakingen/?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=bekendmakingen&OUTPUTFORMAT=geojson";
        fetch(
            url,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    inputData = responseJson;
                    console.log("Found " + inputData.features.length + " bekendmakingen in Amsterdam.");
                    inputData.features.sort(sortBekendmakingen);
                    addMarkers();
                });
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    internalInitMap();
    loadData();
    document.getElementById("idCbxPeriod").addEventListener("change", updateDisplayLevel);
}
