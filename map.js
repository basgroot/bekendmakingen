/*jslint browser: true, for: true, long: true, unordered: true */
/*global window console google */

// Todo houtopstand
// todo oplaadplaats verkeersbesluit

// This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
function initMap() {
    var map;
    var infoWindow;
    var inputData;
    var proxyHost = "https://basement.nl/";
    var markersArray = [];
    var delayedMarkersArray = [];
    var initialZoomLevel = 16;
    var zIndex = 2147483647;  // Some high number
    var activeMunicipality = "Amsterdam";
    var municipalities = {
        "Alkmaar": {
            "center": {
                "lat": 52.632537715707635,
                "lng": 4.7440344469319635
            },
            "outOfBoundariesLocation": {
                "lat": 52.63071912212641,
                "lng": 4.785791317273437
            },
            "topLeft": {
                "lat": 52.71543517416514,
                "lng": 4.693307715910542
            },
            "bottomRight": {
                "lat": 52.48166613438109,
                "lng": 4.996166361044465
            }
        },
        "Amsterdam": {
            "center": {
                "lat": 52.37316382970684,
                "lng": 4.891668068639931
            },
            "outOfBoundariesLocation": {
                "lat": 52.38064494967111,
                "lng": 4.929089861461639
            },
            "topLeft": {
                "lat": 52.45795157026,
                "lng": 4.67850240510
            },
            "bottomRight": {
                "lat": 52.2582676433,
                "lng": 5.0932702714
            }
        },
        "Enkhuizen": {
            "center": {
                "lat": 52.70377677370959,
                "lng": 5.292977507978052
            },
            "outOfBoundariesLocation": {
                "lat": 52.696134665287985,
                "lng": 5.291385252509872
            },
            "topLeft": {
                "lat": 52.73680990277149,
                "lng": 5.21718274791674
            },
            "bottomRight": {
                "lat": 52.66735157297621,
                "lng": 5.318838693002863
            }
        },
        "Hoorn": {
            "center": {
                "lat": 52.63934466558749,
                "lng": 5.059246352878882
            },
            "outOfBoundariesLocation": {
                "lat": 52.63137532899831,
                "lng": 5.0603241485226995
            },
            "topLeft": {
                "lat": 52.69284247732121,
                "lng": 4.995165086595127
            },
            "bottomRight": {
                "lat": 52.61656595669616,
                "lng": 5.158588525124523
            }
        },
        "Land van Cuijk": {
            "center": {
                "lat": 51.59628376948155,
                "lng": 6.010974779479997
            },
            "outOfBoundariesLocation": {
                "lat": 51.71876529499613,
                "lng": 5.92705687347763
            },
            "topLeft": {
                "lat": 51.78021971492207,
                "lng": 5.68705377313658
            },
            "bottomRight": {
                "lat": 51.52473113459177,
                "lng": 6.193971634401763
            }
        },
        "Utrecht": {
            "center": {
                "lat": 52.090794732191675,
                "lng": 5.121395209571712
            },
            "outOfBoundariesLocation": {
                "lat": 52.065686835354505,
                "lng": 5.149651282630879
            },
            "topLeft": {
                "lat": 52.19995884981444,
                "lng": 4.947455124765134
            },
            "bottomRight": {
                "lat": 51.97326219532962,
                "lng": 5.292356769041799
            }
        },
        "Zaanstad": {
            "center": {
                "lat": 52.438994120373096,
                "lng": 4.824222540987905
            },
            "outOfBoundariesLocation": {
                "lat": 52.453661242986456,
                "lng": 4.847946629673501
            },
            "topLeft": {
                "lat": 52.53921830233221,
                "lng": 4.644745522818427
            },
            "bottomRight": {
                "lat": 52.40413541633434,
                "lng": 4.910918619309868
            }
        }
    };

    function getInitialMapSettings() {
        var zoomLevel = initialZoomLevel;
        var center = {
            "lat": 52.3545428061,
            "lng": 4.8963664691
        };
        var urlParams;
        var zoomParam;
        var centerParam;
        var lat;
        var lng;
        // ?zoom=15&center=52.436606513567,4.844183950027
        if (window.URLSearchParams) {
            urlParams = new window.URLSearchParams(window.location.search);
            zoomParam = urlParams.get("zoom");
            centerParam = urlParams.get("center");
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
        datumGepubliceerd = new Date(datumGepubliceerd.toDateString());
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

    function addCenterControlStyle(elm) {
        elm.style.backgroundColor = "#fff";
        elm.style.border = "2px solid #fff";
        elm.style.borderRadius = "3px";
        elm.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
        elm.style.color = "rgb(25,25,25)";
        elm.style.cursor = "default";
        elm.style.fontFamily = "Roboto,Arial,sans-serif";
        elm.style.fontSize = "16px";
        elm.style.lineHeight = "38px";
        elm.style.height = "40px";
        elm.style.margin = "8px 0 22px";
        elm.style.padding = "0 5px";
        elm.style.textAlign = "center";
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

    function createCenterControlMunicipalities() {
        const centerControlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        combobox.addEventListener("change", loadData);
        combobox.add(createOptionEx("Alkmaar"));
        combobox.add(createOptionEx("Amsterdam"));
        combobox.add(createOptionEx("Enkhuizen"));
        combobox.add(createOptionEx("Hoorn"));
        combobox.add(createOptionEx("Land van Cuijk"));
        combobox.add(createOptionEx("Utrecht"));
        combobox.add(createOptionEx("Zaanstad"));
        combobox.id = "idCbxMunicipality";
        addCenterControlStyle(combobox);
        centerControlDiv.appendChild(combobox);
        // Add the control to the map at a designated control position by pushing it on the position's array.
        // This code will implicitly add the control to the DOM, through the Map object. You should not attach the control manually.
        map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
    }

    function createCenterControlPeriods() {
        const centerControlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        combobox.addEventListener("change", updateDisplayLevel);
        combobox.add(createOption("3d", "Publicaties van laatste drie dagen", false));
        combobox.add(createOption("7d", "Publicaties van laatste week", false));
        combobox.add(createOption("14d", "Publicaties van laatste twee weken", true));
        combobox.add(createOption("all", "Alle recente publicaties", false));
        combobox.id = "idCbxPeriod";
        addCenterControlStyle(combobox);
        centerControlDiv.appendChild(combobox);
        // Add the control to the map at a designated control position by pushing it on the position's array.
        // This code will implicitly add the control to the DOM, through the Map object. You should not attach the control manually.
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
    }

    function createCenterControls() {
        createCenterControlMunicipalities();
        createCenterControlPeriods();
    }

    function getGmbNumberFromUrl(websiteUrl) {
        // gmb-2022-425209
        return websiteUrl.substr(40, websiteUrl.length - 45);
    }

    function getIcon(title) {
        // Images are converted to SVG using https://png2svg.com/
        // Resized to 35x45 using https://www.iloveimg.com/resize-image/resize-svg#resize-options,pixels
        // Optmized using https://svgoptimizer.com/
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
            return {
                "url": "img/aanvraag.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.substring(0, apvFilter.length) === apvFilter) {
            return {
                "url": "img/apv.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.indexOf("exploitatievergunning") >= 0 || title.indexOf("alcoholwetvergunning") >= 0) {
            return {
                "url": "img/bar.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.indexOf("evenement") >= 0) {
            return {
                "url": "img/evenement.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        if (title.indexOf("bed & breakfast") >= 0 || title.indexOf("vakantieverhuur") >= 0) {
            return {
                "url": "img/hotel.png",
                "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
            };
        }
        return {
            "url": "img/constructie.png",
            "size": new google.maps.Size(35, 45)  // Make sure image is already scaled
        };
    }

    function findUniquePosition(proposedCoordinate, title) {

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

        function isOutsideAmsterdam(coordinate) {
            return coordinate.lat < municipalities[activeMunicipality].bottomRight.lat || coordinate.lat > municipalities[activeMunicipality].topLeft.lat || coordinate.lng < municipalities[activeMunicipality].topLeft.lng || coordinate.lng > municipalities[activeMunicipality].bottomRight.lng;
        }

        if (isOutsideAmsterdam(proposedCoordinate)) {
            // When the location of a marker is outside Amsterdam (sometimes "Nieuw-Amsterdam", don't ask), the markers are located in the center
            proposedCoordinate = Object.assign({}, municipalities[activeMunicipality].outOfBoundariesLocation);
            municipalities[activeMunicipality].outOfBoundariesLocation.lat = municipalities[activeMunicipality].outOfBoundariesLocation.lat + 0.000011;
            municipalities[activeMunicipality].outOfBoundariesLocation.lng = municipalities[activeMunicipality].outOfBoundariesLocation.lng + 0.000155;
            console.log("Location outside municipality " + activeMunicipality + " : " + title);
        } else {
            while (!isCoordinateAvailable(proposedCoordinate)) {
                proposedCoordinate.lat = proposedCoordinate.lat + 0.000017;
                proposedCoordinate.lng = proposedCoordinate.lng + 0.000016;
            }
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
        var datumGepubliceerd = new Date(feature.recordData.gzd.originalData.meta.tpmeta.geldigheidsperiode_startdatum);
        var age = getDaysPassed(datumGepubliceerd);
        var marker = new google.maps.Marker({
            "map": map,
            "position": position,
            "clickable": true,
            "optimized": true,
            //"scaleControl": true,
            "visible": isMarkerVisible(age, periodToShow),
            "icon": getIcon(feature.recordData.gzd.originalData.meta.owmskern.title),
            "zIndex": zIndex,
            "title": feature.recordData.gzd.originalData.meta.owmskern.title
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
                var gmbNumber = getGmbNumberFromUrl(feature.recordData.gzd.originalData.meta.tpmeta.bronIdentifier);
                var description = feature.recordData.gzd.originalData.meta.owmsmantel.description + "<br /><br />Meer info: <a href=\"" + feature.recordData.gzd.originalData.meta.tpmeta.bronIdentifier + "\" target=\"blank\">" + feature.recordData.gzd.originalData.meta.tpmeta.bronIdentifier + "</a>.";
                showInfoWindow(marker, feature.recordData.gzd.originalData.meta.owmskern.title, "<div id=\"" + gmbNumber + "\"><br /><br /><br /></div>" + description);
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

    function addMarkers(startRecord) {
        const periodToShow = getPeriodToShow();
        const bounds = map.getBounds();
        var position;
        var i;
        var feature;
        console.log("Adding markers " + startRecord + " to " + inputData.searchRetrieveResponse.records.record.length);
        for (i = startRecord - 1; i < inputData.searchRetrieveResponse.records.record.length; i += 1) {
            feature = inputData.searchRetrieveResponse.records.record[i];
            if (typeof feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt === "string") {
                position = findUniquePosition(createCoordinate(feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt), feature.recordData.gzd.originalData.meta.owmskern.title);
                prepareToAddMarker(feature, periodToShow, position, bounds);
            } else if (Array.isArray(feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt)) {
                feature.recordData.gzd.originalData.meta.tpmeta.locatiepunt.forEach(function (locatiepunt) {
                    position = findUniquePosition(createCoordinate(locatiepunt), feature.recordData.gzd.originalData.meta.owmskern.title);
                    prepareToAddMarker(feature, periodToShow, position, bounds);
                });
            } else {
                console.error("Unsupported feature:");
                console.error(feature);
            }
        }
    }

    function updateDisplayLevel() {
        const periodToShow = getPeriodToShow();
        markersArray.forEach(function (markerObject) {
            markerObject.marker.setVisible(isMarkerVisible(markerObject.age, periodToShow));
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
        var containerElm = document.getElementById("map");
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
                "gestureHandling": "greedy",  // When scrolling, keep scrolling
                "zoom": mapSettings.zoomLevel
            }
        );
        createCenterControls();
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

    function loadDataForMunicipality(municipality, startRecord) {
        fetch(
            proxyHost + "proxy-server/index.php?type=list&municipality=" + encodeURIComponent(municipality) + "&startRecord=" + startRecord,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    if (municipality !== activeMunicipality) {
                        // We are loading a different municipality, but user selected another one.
                        return;
                    }
                    if (startRecord === 1) {
                        inputData = responseJson;
                    } else {
                        Array.prototype.push.apply(inputData.searchRetrieveResponse.records.record, responseJson.searchRetrieveResponse.records.record);
                    }
                    console.log("Found " + inputData.searchRetrieveResponse.records.record.length + " bekendmakingen of " + inputData.searchRetrieveResponse.numberOfRecords + " in " + municipality);
                    if (responseJson.searchRetrieveResponse.hasOwnProperty("nextRecordPosition")) {
                        // Add next page:
                        loadDataForMunicipality(municipality, responseJson.searchRetrieveResponse.nextRecordPosition);
                    }
                    addMarkers(startRecord);
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
        markersArray = [];
        delayedMarkersArray = [];
    }

    function loadData() {
        const municipalityComboElm = document.getElementById("idCbxMunicipality");
        if (municipalityComboElm !== null) {
            activeMunicipality = municipalityComboElm.value;
            clearMarkers();
            navigateTo(activeMunicipality);
        }
        loadDataForMunicipality(activeMunicipality, 1);
    }

    internalInitMap();
    loadData();
}
