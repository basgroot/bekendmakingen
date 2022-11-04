// This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
function initEdMap() {
    var mapDetails = {
        "initialZoomLevel": 12,
        "center": {
            "lat": 52.35573500060706,
            "lng": 4.902256946565444
        },
        "properties": [
        {
            "id": "H1B", // Hemony plek 1, bakfiets
            "icon": "bakfiets.png",
            "zIndex": 4,
            "minZoomLevel": 19,
            "maxZoomLevel": 99,
            "isPropertyPageActive": false,
            "headline": "Bakfiets Pieter Hemony",
            "description": "Locatie: Hemonystraat 12.<br />Status: wacht op plaatsing. Dit kan als auto er staat en markering is aangebracht.",
            "propertyPageUrl": "https://cargoroo.nl/",
            "position": {
                "lat": 52.35780589422096,
                "lng": 4.902029146487228
            }
        }, {
            "id": "W3B", // Willibrordus plek 3, bakfiets
            "icon": "bakfiets.png",
            "zIndex": 4,
            "minZoomLevel": 19,
            "maxZoomLevel": 99,
            "isPropertyPageActive": false,
            "headline": "Bakfiets Pieter Aertsz",
            "description": "Locatie: Pieter Aertszstraat 112.<br />Status: wacht op plaatsing. Dit kan als auto er staat en markering is aangebracht.",
            "propertyPageUrl": "https://cargoroo.nl/",
            "position": {
                "lat": 52.352986258382,
                "lng": 4.904718381631734
            }
        }, {
            "id": "HUB", // Hemony plek 1, auto+bakfiets
            "icon": "auto_bakfiets.png",
            "zIndex": 6,
            "minZoomLevel": 15,
            "maxZoomLevel": 18,
            "isPropertyPageActive": false,
            "headline": "Deelplek (auto en bakfiets)",
            "description": "Hemonystraat 13.",
            "position": {
                "lat": 52.35777521694568,
                "lng": 4.902135323017705
            }
        }, {
            "id": "H1A", // Hemony plek 1, auto
            "icon": "auto.png",
            "zIndex": 5,
            "minZoomLevel": 19,
            "maxZoomLevel": 99,
            "isPropertyPageActive": window.location.pathname === "/francois-hemony/",
            "headline": "Auto François Hemony",
            "description": "Locatie: Hemonystraat 13.<br />Status: Fiat 500 kan worden gereserveerd.",
            "propertyPageUrl": "https://elektrischdeelrijden.nl/francois-hemony/",  // Show the link only when page is not the PropertyPage
            "position": {
                "lat": 52.35777521694568,
                "lng": 4.902135323017705
            }
        }, {
            "id": "H2A",
            "icon": "auto.png",
            "zIndex": 5,
            "minZoomLevel": 15,
            "maxZoomLevel": 99,
            "isPropertyPageActive": window.location.pathname === "/jan-steen/",
            "headline": "Auto Jan Steen",
            "description": "Locatie: Tweede Jan Steenstraat 93.<br />Status: Fiat 500 kan worden gereserveerd.",
            "propertyPageUrl": "https://elektrischdeelrijden.nl/jan-steen/",  // Show the link only when page is not the PropertyPage
            "position": {
                "lat": 52.35676675100333,
                "lng": 4.902451289139401
            }
        }, {
            "id": "H3A",
            "icon": "auto.png",
            "zIndex": 5,
            "minZoomLevel": 15,
            "maxZoomLevel": 99,
            "isPropertyPageActive": window.location.pathname === "/jan-van-der-heijden/",
            "headline": "Auto Jan van der Heijden",
            "description": "Locatie: Tweede Jan van der Heijdenstraat 70.<br />Status: Skoda Citigo kan worden gereserveerd.",
            "propertyPageUrl": "https://elektrischdeelrijden.nl/jan-van-der-heijden/",  // Show the link only when page is not the PropertyPage
            "position": {
                "lat": 52.35623474965593,
                "lng": 4.903241416827072
            }
        }, {
            "id": "W1A",
            "icon": "auto.png",
            "zIndex": 5,
            "minZoomLevel": 15,
            "maxZoomLevel": 99,
            "isPropertyPageActive": window.location.pathname === "/michiel-servaesz-nouts/",
            "headline": "Auto Servaes Nouts",
            "description": "Locatie: Servaes Noutsstraat 14 (Willibrordusplein).<br />Status: Kia E-Niro kan worden gereserveerd.",
            "propertyPageUrl": "https://elektrischdeelrijden.nl/michiel-servaesz-nouts/",  // Show the link only when page is not the PropertyPage
            "position": {
                "lat": 52.35490931544342,
                "lng": 4.9035470766602645
            }
        }, {
            "id": "W2A",
            "icon": "auto.png",
            "zIndex": 5,
            "minZoomLevel": 15,
            "maxZoomLevel": 99,
            "isPropertyPageActive": window.location.pathname === "/adriaen-van-ostade/",
            "headline": "Auto Adriaen van Ostade",
            "description": "Locatie: Van Ostadestraat 385.<br />Status: Kia E-Niro kan worden gereserveerd.",
            "propertyPageUrl": "https://elektrischdeelrijden.nl/adriaen-van-ostade/",  // Show the link only when page is not the PropertyPage
            "position": {
                "lat": 52.354503526889935,
                "lng": 4.9040808199246575
            }
        }, {
            "id": "W3A",
            "icon": "auto.png",
            "zIndex": 5,
            "minZoomLevel": 19,
            "maxZoomLevel": 99,
            "isPropertyPageActive": window.location.pathname === "/pieter-aertsz/",
            "headline": "Auto Pieter Aertsz",
            "description": "Locatie: Pieter Aertszstraat 110.<br />Status: vergunning deelauto verleend, wacht op plaatsing.",
            "propertyPageUrl": "https://elektrischdeelrijden.nl/pieter-aertsz/",  // Show the link only when page is not the PropertyPage
            "position": {
                "lat": 52.35296966938074,
                "lng": 4.9045958328264385
            }
        }, {
            "id": "HUB",
            "icon": "auto_bakfiets.png",
            "zIndex": 6,
            "minZoomLevel": 15,
            "maxZoomLevel": 18,
            "isPropertyPageActive": false,
            "headline": "Deelplek (auto en bakfiets)",
            "description": "Pieter Aertszstraat 110.",
            "position": {
                "lat": 52.35296966938074,
                "lng": 4.9045958328264385
            }
        }, {
            "id": "BUURT",
            "icon": "auto_bakfiets.png",
            "zIndex": 10,
            "minZoomLevel": 13,
            "maxZoomLevel": 14,
            "isPropertyPageActive": false,
            "headline": "Hemonybuurt",
            "description": "Hemonybuurt.",
            "position": {
                "lat": 52.35719789736865,
                "lng": 4.902452741740485
            },
            "bounds": {
                "sw": {
                    "lat": 52.35504046860087,
                    "lng": 4.900293921023917
                },
                "ne": {
                    "lat": 52.35862647963468,
                    "lng": 4.904130250668165
                }
            }
        }, {
            "id": "BUURT",
            "icon": "auto_bakfiets.png",
            "zIndex": 10,
            "minZoomLevel": 13,
            "maxZoomLevel": 14,
            "isPropertyPageActive": false,
            "headline": "Willibrordusbuurt",
            "description": "Willibrordusbuurt.",
            "position": {
                "lat": 52.354058591133196,
                "lng": 4.9043275332667
            },
            "bounds": {
                "sw": {
                    "lat": 52.352400014090854,
                    "lng": 4.902122049575124
                },
                "ne": {
                    "lat": 52.35585223170553,
                    "lng": 4.9058476214904045
                }
            }
        }, {
            "id": "BUURT",
            "icon": "logo.png",
            "zIndex": 10,
            "minZoomLevel": 0,
            "maxZoomLevel": 12,
            "isPropertyPageActive": false,
            "headline": "Elektrisch Deelrijden de Pijp",
            "description": "Hemony- en Willibrordusbuurt.",
            "position": {
                "lat": 52.35556991254003,
                "lng": 4.903242927744562
            },
            "bounds": {
                "sw": {
                    "lat": 52.352400014090854,
                    "lng": 4.902122049575124
                },
                "ne": {
                    "lat": 52.35862647963468,
                    "lng": 4.904130250668165
                }
            }
        }, {
            "id": "DIKS",
            "icon": "diks.png",
            "zIndex": 1,
            "minZoomLevel": 15,
            "maxZoomLevel": 99,
            "isPropertyPageActive": false,
            "headline": "Receptie DIKS",
            "description": "We werken met DIKS samen voor de auto's. U kunt bij hen terecht met vragen over de app en de auto's. En voor 15% ledenkorting op het reguliere huuraanbod.<br /><br />Van Ostadestraat 366, telefoon: <a href='tel:0031206623366'>020 662 33 66</a><br /><br />Openingstijden:<br />Ma, Di, Wo 8:00-17:30, Do, Vr, Za 8:00-19:30, Zo 9:00-12:30.",
            "propertyPageUrl": "https://diks.net/vestigingen/amsterdam-zuid/31206623366/",
            "position": {
                "lat": 52.35328543271351,
                "lng": 4.899291847827083
            }
        }, {
            "id": "DIKS-G",
            "icon": "diks_garage.png",
            "zIndex": 10,
            "minZoomLevel": 15,
            "maxZoomLevel": 99,
            "isPropertyPageActive": false,
            "headline": "Garage DIKS",
            "description": "Dit is de garage van DIKS, niet de bezoekerslocatie, die ligt een stukje meer naar het westen in de Van Ostadestraat.",
            "propertyPageUrl": "https://diks.net/vestigingen/amsterdam-zuid/31206623366/",
            "position": {
                "lat": 52.35397067926202,
                "lng": 4.9025949536949325
            }
        }]
    };
    var map;
    var infoWindow;
    var markersArray = [];

    function isMarkerVisible(zoomLevel, minZoomLevel, maxZoomLevel) {
        return zoomLevel >= minZoomLevel && zoomLevel <= maxZoomLevel;
    }

    function showInfoWindow(marker, header, body) {
        infoWindow.setContent("<div class='info_window'><h2 class='info_window_heading'>" + header + "</h2><div class='info_window_body'><p>" + body + "</p></div></div>");
        infoWindow.open({
            "anchor": marker,
            "map": map,
            "shouldFocus": true
        });
    }

    function addMarker(property) {
        // https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions
        var marker = new google.maps.Marker({
            "map": map,
            "position": property.position,
            "clickable": true,
            "optimized": false,
            "visible": isMarkerVisible(mapDetails.initialZoomLevel, property.minZoomLevel, property.maxZoomLevel),
            "icon": "https://elektrischdeelrijden.nl/wp-content/include-me/map/" + property.icon,
            "zIndex": property.zIndex,
            "title": property.headline
        });
        marker.addListener(
            "click",
            function () {
                var newBounds;
                var description;
                switch (property.id) {
                case "BUURT":  // Hemony- en Willibrordusbuurt
                    newBounds = new google.maps.LatLngBounds(property.bounds.sw, property.bounds.ne);
                    map.fitBounds(newBounds);
                    break;
                case "HUB":  // Auto + bakfiets
                    map.setZoom(19);
                    map.setCenter(marker.getPosition());
                    break;
                default:
                    description = property.description;
                    if (!property.isPropertyPageActive) {
                        description += "<br /><br />Meer info: <a href='" + property.propertyPageUrl + "?utm_source=site-" + property.id + "'>" + property.propertyPageUrl + "</a>.";
                    }
                    showInfoWindow(marker, property.headline, description);
                }
            }
        );
        markersArray.push({
            "marker": marker,
            "maxZoomLevel": property.maxZoomLevel,
            "minZoomLevel": property.minZoomLevel
        });
        // This is the dedicated page for this property: show infoWindow
        if (property.isPropertyPageActive) {
            map.setCenter(marker.getPosition());
            window.setTimeout(function () {
                map.setZoom(19);
                window.setTimeout(function () {
                    showInfoWindow(marker, property.headline, property.description);
                }, 1000);
            }, 1000);
        }
    }

    function addMarkers() {
        mapDetails.properties.forEach(function (property) {
            addMarker(property);
        });
    }

    function addTraffic() {
        // https://developers.google.com/maps/documentation/javascript/trafficlayer
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
    }

    function internalInitMap() {
        infoWindow = new google.maps.InfoWindow();
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        map = new google.maps.Map(
            document.getElementById("overzicht-bekendmakingen"),
            {
                clickableIcons: false,
                // Paid feature - "mapId": "c2a918307d540be7",  // https://console.cloud.google.com/google/maps-apis/studio/styles?project=eddepijp
                "center": new google.maps.LatLng(mapDetails.center.lat, mapDetails.center.lng),
                "mapTypeId": google.maps.MapTypeId.ROADMAP,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
                "gestureHandling": "cooperative",  // When scrolling, keep scrolling
                "zoom": mapDetails.initialZoomLevel
            }
        );
        //addTraffic();
        //addMarkers();
        map.addListener("zoom_changed", function () {
            var zoom = map.getZoom();
            // Iterate over markers and call setVisible
            markersArray.forEach(function (marker) {
                marker.marker.setVisible(isMarkerVisible(zoom, marker.minZoomLevel, marker.maxZoomLevel));
            });
            infoWindow.close();
            console.log("ZoomLevel: " + zoom);
        });
        map.addListener("center_changed", function () {
            console.log("New center: " + map.getCenter());
        });
    }

    internalInitMap();

    document.getElementById("idBtnShowMap").addEventListener("click", addMarkers);
}
