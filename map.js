/*jslint browser: true, for: true, long: true, unordered: true */
/*global window console google municipalities */

/*
 * Op zoek naar de website?
 * Bezoek https://basgroot.github.io/bekendmakingen/?in=Hoorn
 */

// TODO option to list historical licenses

// This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
function initMap() {
    const proxyHost = "https://elektrischdeelrijden.nl/";
    //const proxyHost = "http://localhost/";
    const municipalityMarkers = [];
    const initialZoomLevel = 16;
    const loadingIndicator = document.createElement("img");
    var publicationsArray = [];
    var markersArray = [];
    var delayedMarkersArray = [];
    var zIndex = 2147483647;  // Some high number
    var map;
    var infoWindow;
    var activeMunicipality = "Hoorn";

    function getInitialMapSettings() {
        var zoomLevel = initialZoomLevel;
        var center;
        var urlParams;
        var zoomParam;
        var centerParam;
        var municipality;
        var lat;
        var lng;
        // ?in=Hoorn&zoom=15&center=52.6603118963%2C5.0608995325
        // ?in=Oostzaan
        if (window.URLSearchParams) {
            urlParams = new window.URLSearchParams(window.location.search);
            zoomParam = urlParams.get("zoom");
            centerParam = urlParams.get("center");
            municipality = urlParams.get("in");
            if (municipality && municipalities[municipality] !== undefined) {
                activeMunicipality = municipality;
                console.log("Adjusted municipality from URL");
            }
            center = Object.assign({}, municipalities[activeMunicipality].center);
            if (zoomParam && centerParam) {
                zoomParam = parseFloat(zoomParam);
                if (zoomParam > 14 && zoomParam < 20) {
                    zoomLevel = zoomParam;
                    console.log("Adjusted zoom level from URL");
                }
                centerParam = centerParam.split(",");
                lat = parseFloat(centerParam[0]);
                lng = parseFloat(centerParam[1]);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    center.lat = lat;
                    center.lng = lng;
                    console.log("Adjusted center from URL");
                }
            }
            updateUrl(zoomLevel, new google.maps.LatLng(center.lat, center.lng));
        }
        return {
            "zoomLevel": zoomLevel,
            "center": center
        };
    }

    function showInfoWindow(marker, iconName, header, body) {
        infoWindow.setContent("<div><img src=\"img/" + iconName + ".svg\" width=\"105\" height=\"135\" class=\"info_window_image\"><h2 class=\"info_window_heading\">" + header + "</h2><div class=\"info_window_body\"><p>" + body + "</p></div></div>");
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
                console.error("Error parsing date (" + value + ") of license " + gmbNumber);
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
        for (i = 0; i < alineas.length; i += 1) {
            alinea = alineas[i];
            if (alinea.childNodes.length > 0) {
                for (j = 0; j < alinea.childNodes.length; j += 1) {
                    if (alinea.childNodes[j].nodeName === "#text") {
                        value = alinea.childNodes[j].nodeValue;
                        value = value.replace("Besluit verzonden", "Verzonden naar aanvrager op");
                        // Fix "Verzonden naar aanvrager op :" (https://zoek.officielebekendmakingen.nl/gmb-2022-441976.html)
                        value = value.replace("op :", "op:");
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
        const year = getYearFromGmbNumber();
        const url = proxyHost + "proxy-server/index.php?number=" + gmbNumber + "&year=" + year;
        if (Number.isNaN(parseInt(year, 10))) {
            console.error("Unable to gat data for gmbNumber " + gmbNumber);
            return;
        }
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

    function createOption(value, displayValue, isSelected) {
        const option = document.createElement("option");
        option.text = displayValue;
        option.value = value;
        if (isSelected) {
            option.setAttribute("selected", true);
        }
        return option;
    }

    function createOptionEx(value) {
        return createOption(value, value, value === activeMunicipality);
    }

    function createMapsControlLoadingIndicator() {
        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        controlDiv.appendChild(loadingIndicator);
        map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(controlDiv);
    }

    function createMapsControlMunicipalities() {
        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        const municipalityNames = Object.keys(municipalities);
        combobox.id = "idCbxMunicipality";
        municipalityNames.forEach(function (municipalityName) {
            combobox.add(createOptionEx(municipalityName));
        });
        combobox.addEventListener("change", loadData);
        combobox.classList.add("controlStyle");
        controlDiv.appendChild(combobox);
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
    }

    function createMapsControlPeriods() {
        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        combobox.id = "idCbxPeriod";
        combobox.add(createOption("3d", "Publicaties van laatste drie dagen", false));
        combobox.add(createOption("7d", "Publicaties van laatste week", false));
        combobox.add(createOption("14d", "Publicaties van laatste twee weken", true));
        combobox.add(createOption("all", "Alle recente publicaties", false));
        combobox.addEventListener("change", updateDisplayLevel);
        combobox.classList.add("controlStyle");
        controlDiv.appendChild(combobox);
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(controlDiv);
    }

    function createMapsControlSource() {
        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const button = document.createElement("button");
        button.id = "idBtnSource";
        button.textContent = "Bekijk broncode";
        button.title = "Bekijk de source op GitHub";
        button.type = "button";
        button.addEventListener("click", function () {
            window.location.href = "https://github.com/basgroot/bekendmakingen";
        });
        button.classList.add("controlStyle");
        controlDiv.appendChild(button);
        map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(controlDiv);
    }

    function createMapsControls() {
        // https://developers.google.com/maps/documentation/javascript/examples/control-custom
        createMapsControlLoadingIndicator();
        createMapsControlMunicipalities();
        createMapsControlPeriods();
        createMapsControlSource();
    }

    function getGmbNumberFromUrl(websiteUrl) {
        // gmb-2022-425209
        return websiteUrl.substr(40, websiteUrl.length - 45);
    }

    function getIconName(title, type) {
        // Images are converted to SVG using https://png2svg.com/
        // Resized to 35x45 using https://www.iloveimg.com/resize-image/resize-svg#resize-options,pixels
        // Optmized using https://svgoptimizer.com/
        title = title.toLowerCase();
        type = type.toLowerCase();
        if (title.indexOf("aanvraag") >= 0 || title.indexOf("verlenging") >= 0) {
            return "aanvraag";
        }
        if (type === "exploitatievergunning" || title.indexOf("exploitatievergunning") >= 0 || title.indexOf("alcoholwetvergunning") >= 0) {
            return "bar";
        }
        if (type === "evenementenvergunning" || title.indexOf("evenement") >= 0) {
            return "evenement";
            // De 'loterij' met type 'overig' valt eruit!
        }
        if (title.indexOf("bed & breakfast") >= 0 || title.indexOf("vakantieverhuur") >= 0) {
            return "hotel";
        }
        if (type === "kapvergunning" || title.indexOf("houtopstand") >= 0 || title.indexOf("(kap)") >= 0) {
            return "boomkap";
        }
        if (title.indexOf("oplaadplaats") >= 0 || title.indexOf("opladen") >= 0 || title.indexOf("laadpaal") >= 0) {
            return "laadpaal";
        }
        if (title.indexOf("apv vergunning") >= 0 || title.indexOf("parkeervakken") >= 0 || title.indexOf("tvm") >= 0) {
            // Verify this after 'laadpaal':
            return "tvm";
        }
        if (type === "verkeersbesluit") {
            // Verify this after 'parkeervakken/tvm':
            return "verkeer";
        }
        if (type === "splitsingsvergunning" || type === "onttrekkingsvergunning") {
            return "kamerverhuur";  // EpicPupper, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons
        }
        if (type === "ligplaatsvergunning" || type === "watervergunning") {
            return "boot";  // Barbetorte, CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0>, via Wikimedia Commons
        }
        if (type === "reclamevergunning") {
            return "reclame";  // Verdy_p (complete construction and vectorisation, based on mathematical properties of the symbol, and not drawn manually, and then manually edited without using any SVG editor)., Public domain, via Wikimedia Commons
        }
        if (type === "milieuvergunning") {
            return "milieu";
        }
        return "constructie";
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
        const age = getDaysPassed(feature.date);
        const iconName = getIconName(feature.title, feature.type);
        const marker = new google.maps.Marker({
            "map": map,
            "position": position,
            "clickable": true,
            "optimized": true,
            //"scaleControl": true,
            "visible": isMarkerVisible(age, periodToShow),
            "icon": {
                "url": "img/" + iconName + ".png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            },
            "zIndex": zIndex,
            "title": feature.title
        });
        var markerObject = {
            "age": age,
            "position": position,
            "isSvg": true,
            "marker": marker
        };
        zIndex -= 1;  // Input is sorted by modification date - newest are first. Give them a higher zIndex, so Besluit is in front of Verlenging (which is in front of Aanvraag)
        marker.addListener(
            "click",
            function () {
                var gmbNumber = getGmbNumberFromUrl(feature.url);
                var description = feature.description + "<br /><br />Meer info: <a href=\"" + feature.url + "\" target=\"blank\">" + feature.url + "</a>.";
                showInfoWindow(marker, iconName, feature.title, "<div id=\"" + gmbNumber + "\"><br /><br /><br /></div>" + description);
                collectBezwaartermijn(gmbNumber, feature.date);
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
                "position": position
            });
        }
    }

    function getPeriodToShow() {
        const periodComboElm = document.getElementById("idCbxPeriod");
        return (
            periodComboElm === null
            ? "14d"
            : periodComboElm.value
        );
    }

    function createCoordinate(locatiepunt) {
        const coordinate = locatiepunt.split(" ");  // Example: "52.35933 4.893097"
        return {
            "lat": parseFloat(coordinate[0]),
            "lng": parseFloat(coordinate[1])
        };
    }

    function addMarkers(startRecord, isMoreDataAvailable) {
        const periodToShow = getPeriodToShow();
        const bounds = map.getBounds();
        var position;
        var i;
        var feature;
        console.log("Adding markers " + startRecord + " to " + publicationsArray.length);
        for (i = startRecord - 1; i < publicationsArray.length; i += 1) {
            feature = publicationsArray[i];
            if (typeof feature.location === "string") {
                position = findUniquePosition(createCoordinate(feature.location));
                prepareToAddMarker(feature, periodToShow, position, bounds);
            } else if (Array.isArray(feature.location)) {
                feature.location.forEach(function (locatiepunt) {
                    position = findUniquePosition(createCoordinate(locatiepunt));
                    prepareToAddMarker(feature, periodToShow, position, bounds);
                });
            } else {
                console.error("Unsupported feature:");
                console.error(feature);
            }
        }
        if (!isMoreDataAvailable) {
            // Hide loading indicator - don't use style.visibility = "hidden", because then it keeps occupying space and prevents clicking on the map
            loadingIndicator.style.display = "none";
        }
    }

    function addMunicipalitiyMarkers() {
        const municipalityNames = Object.keys(municipalities);
        municipalityNames.forEach(function (municipalityName) {
            const municipalityObject = municipalities[municipalityName];
            var marker = new google.maps.Marker({
                "map": map,
                "position": municipalityObject.center,
                "label": municipalityName,  // https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerLabel
                "clickable": true,
                "optimized": true,
                //"scaleControl": true,
                "visible": municipalityName !== activeMunicipality,
                "icon": {
                    "url": "img/gemeente.png",
                    "size": new google.maps.Size(50, 61)  // Make sure image is already scaled
                },
                "title": municipalityName
            });
            municipalityMarkers.push({
                "municipalityName": municipalityName,
                "marker": marker
            });
            marker.addListener(
                "click",
                function () {
                    const municipalityComboElm = document.getElementById("idCbxMunicipality");
                    if (municipalityComboElm !== null) {
                        municipalityComboElm.value = municipalityName;
                    }
                    activeMunicipality = municipalityName;
                    loadData();
                }
            );
        });
    }

    function updateDisplayLevel() {
        const periodToShow = getPeriodToShow();
        markersArray.forEach(function (markerObject) {
            markerObject.marker.setVisible(isMarkerVisible(markerObject.age, periodToShow));
        });
    }

    function updateUrl(zoom, center) {
        // Add to URL: /?in=Alkmaar&zoom=15&center=52.43660651356703,4.84418395002761
        if (window.URLSearchParams) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set("in", activeMunicipality);
            searchParams.set("zoom", zoom);
            searchParams.set("center", center.toUrlValue(10));
            window.history.replaceState(null, "", window.location.pathname + "?" + searchParams.toString());
        }
        document.title = "Bekendmakingen " + activeMunicipality;
    }

    function internalInitMap() {
        var containerElm = document.getElementById("map");
        var mapSettings = getInitialMapSettings();
        loadingIndicator.id = "idLoadingIndicator";
        loadingIndicator.src = "img/ajax-loader.gif";  // ConnectedWizard, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons
        infoWindow = new google.maps.InfoWindow();
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        map = new google.maps.Map(
            containerElm,
            {
                "clickableIcons": false,
                // Paid feature - "mapId": "c2a918307d540be7",  // https://console.cloud.google.com/google/maps-apis/studio/styles?project=eddepijp
                "center": new google.maps.LatLng(mapSettings.center.lat, mapSettings.center.lng),
                "mapTypeId": google.maps.MapTypeId.ROADMAP,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
                "gestureHandling": "greedy",  // When scrolling, keep scrolling
                "zoom": mapSettings.zoomLevel
            }
        );
        createMapsControls();
        addMunicipalitiyMarkers();
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
            const periodToShow = getPeriodToShow();
            var delayedMarker;
            var i = delayedMarkersArray.length;
            while (i > 0) {
                i = i - 1;
                delayedMarker = delayedMarkersArray[i];
                if (bounds.contains(delayedMarker.position)) {
                    addMarker(delayedMarker.feature, periodToShow, delayedMarker.position);
                    delayedMarkersArray.splice(i, 1);
                }
            }
            updateUrl(map.getZoom(), map.getCenter());
            console.log("Remaining items to add to the map: " + delayedMarkersArray.length);
        });
    }

    function navigateTo(municipality) {
        const center = municipalities[municipality].center;
        map.setCenter(new google.maps.LatLng(center.lat, center.lng), initialZoomLevel);
    }

    /**
     * Download a file and give it a name. Source: https://stackoverflow.com/a/48968694.
     * @param {Object} exportObj The downloaded JSON from the response.
     * @return {void}
     */
    function saveFile(exportObj, fileName) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        const a = document.createElement("a");
        a.href = dataStr;
        a.download = fileName;
        document.body.appendChild(a);  // Required for Firefox
        a.click();
        a.remove();
    }

    function fillNumber(startRecord, length) {
        var startRecordToDisplay = (startRecord - 1) / 1000;
        var result = startRecordToDisplay.toString();
        while (result.length < length) {
            result = "0" + result;
        }
        return result;
    }

    function addPublications(responseJson) {
        responseJson.searchRetrieveResponse.records.record.forEach(function (inputRecord) {
            const feature = {
                // Example "kapvergunning"
                "type": (
                    // Sometimes multiple subjects, when both bouwvergunning and omgevingsvergunning are requested
                    Array.isArray(inputRecord.recordData.gzd.originalData.meta.owmsmantel.subject)
                    ? inputRecord.recordData.gzd.originalData.meta.owmsmantel.subject[0].$
                    : inputRecord.recordData.gzd.originalData.meta.owmsmantel.subject.$
                ),
                // Example: "Besluit apv vergunning Verleend Overtoom 10-H"
                "title": inputRecord.recordData.gzd.originalData.meta.owmskern.title,
                // Example: "TVM 2 vakken - Overtoom 10-12 13 februari 2023, Overtoom 10-H"
                "description": inputRecord.recordData.gzd.originalData.meta.owmsmantel.description,
                // Example: "2023-02-10"
                "date": new Date(inputRecord.recordData.gzd.originalData.meta.tpmeta.geldigheidsperiode_startdatum),
                // Example: "https:\/\/zoek.officielebekendmakingen.nl\/gmb-2023-59059.html"
                "url": inputRecord.recordData.gzd.originalData.meta.tpmeta.bronIdentifier
            };
            if (Array.isArray(inputRecord.recordData.gzd.originalData.meta.tpmeta.locatiepunt)) {
                // Example: ["52.36374 4.877971"]
                feature.location = [];
                Array.prototype.push.apply(feature.location, inputRecord.recordData.gzd.originalData.meta.tpmeta.locatiepunt);
            } else {
                // Example: "52.36374 4.877971"
                feature.location = inputRecord.recordData.gzd.originalData.meta.tpmeta.locatiepunt;
            }
            publicationsArray.push(feature);
        });
    }

    function loadDataForMunicipality(municipality, startRecord) {
        const lookupMunicipality = (
            municipalities[municipality].hasOwnProperty("lookupName")
            ? municipalities[municipality].lookupName
            : municipality
        );
        // Show loading indicator
        loadingIndicator.style.display = "block";
        fetch(
            proxyHost + "proxy-server/index.php?type=list&municipality=" + encodeURIComponent(lookupMunicipality) + "&startRecord=" + startRecord,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    var isMoreDataAvailable;
                    if (municipality !== activeMunicipality) {
                        // We are loading a different municipality, but user selected another one.
                        return;
                    }
                    if (startRecord === 1) {
                        publicationsArray = [];
                        // Show all labels except selected one
                        municipalityMarkers.forEach(function (markerObject) {
                            if (markerObject.municipalityName === activeMunicipality) {
                                markerObject.marker.setVisible(false);
                            }
                        });
                    }
                    addPublications(responseJson);
                    // Option to save the history to a file
                    //saveFile(responseJson, lookupMunicipality.toLowerCase().replace(/\s/g, "-") + "-2023-01-" + fillNumber(startRecord, 2) + ".json");
                    console.log("Found " + responseJson.searchRetrieveResponse.records.record.length + " bekendmakingen of " + responseJson.searchRetrieveResponse.numberOfRecords + " in " + municipality);
                    isMoreDataAvailable = responseJson.searchRetrieveResponse.hasOwnProperty("nextRecordPosition");
                    if (isMoreDataAvailable) {
                        // Add next page:
                        loadDataForMunicipality(municipality, responseJson.searchRetrieveResponse.nextRecordPosition);
                    }
                    addMarkers(startRecord, isMoreDataAvailable);
                });
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function clearMarkers() {
        // https://developers.google.com/maps/documentation/javascript/markers#remove
        markersArray.forEach(function (markerObject) {
            markerObject.marker.setMap(null);
        });
        municipalityMarkers.forEach(function (markerObject) {
            markerObject.marker.setVisible(true);
        });
        markersArray = [];
        delayedMarkersArray = [];
    }

    function loadData() {
        const municipalityComboElm = document.getElementById("idCbxMunicipality");
        if (municipalityComboElm !== null) {
            activeMunicipality = municipalityComboElm.value;
            clearMarkers();
            console.log("Navigating to " + activeMunicipality);
            navigateTo(activeMunicipality);
        }
        loadDataForMunicipality(activeMunicipality, 1);
    }

    internalInitMap();
    loadData();
}
