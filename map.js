/**
 * Op zoek naar de website?
 * Bezoek https://basgroot.github.io/bekendmakingen/?in=Hoorn
 *
 * This function is called by Google Maps API, after loading the library. Function name is sent as query parameter.
 * @return {void}
 */
/* eslint-disable no-unused-vars */
async function initMap() {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const appState = {
        // The map itself:
        "map": null,
        // Periods
        "periods": null,
        // Municipalities
        "municipalities": null,
        // The selected (or initial) municipality:
        "activeMunicipality": "Hoorn",
        // The zoom level when starting the app:
        "initialZoomLevel": 16,
        // The marker objects of the municipalities:
        "municipalityMarkers": [],
        // Te list with markers on the map:
        "markersArray": [],
        // The markers outside the screen, to be shown after becoming visible (scroll):
        "delayedMarkersArray": [],
        // The publications to display:
        "publicationsArray": [],
        // Backup of the recent publications, because loading them again is slow:
        "publicationsArrayBackup": [],
        // Indicates the status of the time filter:
        "isHistoryActive": false,
        // Indicates if all parts are loaded:
        "isFullyLoaded": false,
        // Order of different license markers, newest on top. Set to some high number:
        "zIndex": 2147483647,
        // Wait custor when loading data:
        "loadingIndicator": document.createElement("img"),
        // The info window shown when clicking on a marker:
        "infoWindow": null,
        // Start date of the query and indication if history must be retrieved:
        "requestPeriod": {}
    };

    /**
     * Customize the map based on query parameters.
     * Examples:
     *   ?in=Hoorn&zoom=15&center=52.6603118963%2C5.0608995325
     *   ?in=Oostzaan
     * @return {!Object} Map settings.
     */
    function getInitialMapSettings() {
        let zoomLevel = appState.initialZoomLevel;
        let center = Object.assign({}, appState.municipalities[appState.activeMunicipality].center);  // Create new copy
        let lat;
        let lng;
        if (window.URLSearchParams) {
            const urlSearchParams = new window.URLSearchParams(window.location.search);
            let zoomParam = urlSearchParams.get("zoom");
            let centerParam = urlSearchParams.get("center");
            const municipalityParam = urlSearchParams.get("in");
            if (municipalityParam && appState.municipalities[municipalityParam] !== undefined) {
                appState.activeMunicipality = municipalityParam;
                console.log("Adjusted municipality from URL: " + municipalityParam);
            }
            center = Object.assign({}, appState.municipalities[appState.activeMunicipality].center);
            if (zoomParam && centerParam) {
                zoomParam = parseFloat(zoomParam);
                if (zoomParam > 14 && zoomParam < 20) {
                    zoomLevel = zoomParam;
                    console.log("Adjusted zoom level from URL: " + zoomParam);
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

    /**
     * Display the popup window.
     * https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.open
     * @param {!Object} marker Marker showing the popup.
     * @param {string} iconName Icon file name.
     * @param {string} header Title.
     * @param {string} body Contents.
     * @return {void}
     */
    function showInfoWindow(marker, iconName, header, body) {
        let map;
        appState.infoWindow.setContent("<div><img src=\"img/" + iconName + ".svg\" width=\"105\" height=\"135\" class=\"info_window_image\"><h2 class=\"info_window_heading\">" + header + "</h2><div class=\"info_window_body\"><p>" + body + "</p></div></div>");
        if (appState.map.getStreetView().getVisible()) {
            console.log("Streetview is visible. Showing infoWindow there.");
            map = appState.map.getStreetView();
        } else {
            map = appState.map;
        }
        appState.infoWindow.open({
            "anchor": marker,
            "map": map,
            "shouldFocus": true
        });
        appState.infoWindow.setMap(map);  // Workaround for issue with infoWindow not showing in Street View: https://issuetracker.google.com/issues/35828818?pli=1
    }

    /**
     * Parse the response of the license document to find the date the license is granted.
     * @param {string} responseXml XML.
     * @return {!Array<?>|!NodeList<!Element>} Alineas.
     */
    function getAlineas(responseXml) {

        /**
         * Replaces tags in the given value.
         * @param {string} value The value to replace tags in.
         * @return {string} The value with tags replaced.
         */
        function replaceTags(value) {
            const tags = [
                ["<extref doc=\"https://www.alkmaar.nl/bestuur-en-organisatie/het-ergens-niet-mee-eens-zijn/bezwaar-en-beroep\">website</extref>", "website"],  // Alkmaar https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-77888/1/xml/gmb-2023-77888.xml
                ["<extref doc=\"https://www.alkmaar.nl/direct-regelen/wonen-verhuizen-en-verbouwen/bezwaar-en-beroep\">website</extref>", "website"],  // Alkmaar https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-23049/1/xml/gmb-2023-23049.xml
                ["<!--Element br verwijderd -->", ""],  // Zaanstad https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-77748/1/xml/gmb-2023-77748.xml
                ["<nadruk type=\"vet\">", ""],  // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74922/1/xml/gmb-2023-74922.xml
                ["<nadruk type=\"cur\">", ""],  // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-577976/1/xml/gmb-2022-577976.xml
                ["<nadruk type=\"ondlijn\">", ""],  // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-32648/1/xml/gmb-2023-32648.xml
                ["</nadruk>", ""],  // Hoorn
                [" :", ":"]  // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-81009/1/xml/gmb-2023-81009.xml
            ];
            let result = value;
            // Remove all double spaces in all forms: Landsmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74508/1/xml/gmb-2023-74508.xml
            result = result.replace(/\s\s+/g, " ");
            tags.forEach(function (tag) {
                result = result.replaceAll(tag[0], tag[1]);
            });
            return result;
        }

        const parser = new window.DOMParser();
        let xmlDoc;
        let zakelijkeMededeling;
        try {
            xmlDoc = parser.parseFromString(replaceTags(responseXml).toLowerCase(), "text/xml");
        } catch (e) {
            console.error("Error parsing " + responseXml);
            console.error(e);
            return [];
        }
        // gemeenteblad / zakelijke-mededeling / zakelijke-mededeling-tekst / tekst / <al>Verzonden naar aanvrager op: 20-09-2022</al>
        zakelijkeMededeling = xmlDoc.getElementsByTagName("zakelijke-mededeling-tekst");
        return (
            zakelijkeMededeling.length === 0
            ? []
            : zakelijkeMededeling[0].querySelectorAll("al,tussenkop")  // Tussenkop is required for Den Haag https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-78971/1/xml/gmb-2023-78971.xml
        );
    }

    /**
     * Calculate the period since the license was granted, to see if it is applicable for formal objection.
     * @param {!Date} date Decision date.
     * @return {number} Number of days passed.
     */
    function getDaysPassed(date) {
        const today = new Date(new Date().toDateString());  // Rounded date
        const dateFrom = new Date(date.toDateString());
        return Math.round((today.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Parse the response of the license document to find the date the license is granted.
     * @param {string} responseXml XML response.
     * @param {!Object} publication Publication object.
     * @param {string} licenseId License ID.
     * @return {void}
     */
    function parseBekendmaking(responseXml, publication, licenseId) {

        /**
         * Converts month names to their corresponding numeric values.
         * @param {string} value The month name to convert.
         * @return {string} The numeric value of the month.
         */
        function convertMonthNames(value) {
            return value.replace("januari", "01").replace("februari", "02").replace("maart", "03").replace("april", "04").replace("mei", "05").replace("juni", "06").replace("juli", "07").replace("augustus", "08").replace("september", "09").replace("oktober", "10").replace("november", "11").replace("december", "12");
        }

        /**
         * Parses a date value.
         * @param {string} value The date value to parse.
         * @return {!Object} Object with parsed date, if valid.
         */
        function parseDate(value) {
            const result = {
                "isValid": false
            };
            const year = value.substring(6, 10);
            const month = value.substring(3, 5);
            const day = value.substring(0, 2);
            let datumBekendgemaakt;
            if (Number.isNaN(parseInt(year, 10)) || Number.isNaN(parseInt(month, 10)) || Number.isNaN(parseInt(day, 10))) {
                console.error("Error parsing date (" + value + ") of license " + publication.urlApi);
                return result;
            }
            datumBekendgemaakt = new Date(year + "-" + month + "-" + day);
            result.date = new Date(datumBekendgemaakt.toDateString());  // Rounded date
            result.isValid = true;
            return result;
        }

        /**
         * Retrieves the date from the given text value.
         * @param {string} value The text value to extract the date from.
         * @param {!Object} publication The publication source.
         * @return {!Object} Object with parsed date, if valid.
         */
        function getDateFromText(value, publication) {
            const identifier = "@@@";
            const identifiersStart = [
                "verzonden naar aanvrager op: ",
                "de gemeente heeft op ",
                "de gemeente opmeer heeft op ",  // Opmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-79622/1/xml/gmb-2023-79622.xml
                "besluit verzonden: ",  // Zaandam https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-580371/1/xml/gmb-2022-580371.xml
                "besluitdatum: ",  // Landsmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74508/1/xml/gmb-2023-74508.xml
                "gemeente amstelveen heeft op ",  // Amstelveen https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-95322/1/xml/gmb-2023-95322.xml
                "verzonden op: ",  // Dijk en Waard https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-85385/1/xml/gmb-2023-85385.xml
                "(verzonden ",  // Waterland https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-67428/1/xml/gmb-2023-67428.xml
                "verzonden ",  // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-86314/1/xml/gmb-2023-86314.xml
                "verleende omgevingsvergunning is verzonden op ",  // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-84721/1/xml/gmb-2023-84721.xml
                "verleende omgevingsvergunning is verzonden ",  // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-29091/1/xml/gmb-2023-29091.xml
                "verzenddatum besluit: ",  // Koggenland https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-68991/1/xml/gmb-2023-68991.xml
                "verzenddatum: ",  // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-2603/1/xml/gmb-2023-2603.xml
                "verzendatum: ",  // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-59281/1/xml/gmb-2023-59281.xml
                "bekendmakingsdatum: ",  // Heemskerk https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-67866/1/xml/gmb-2023-67866.xml
                "datum besluit: ",  // Edam-Volendam https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74723/1/xml/gmb-2023-74723.xml
                "datum verzending besluit: ",  // Almere https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-31954/1/xml/gmb-2023-31954.xml
                "de burgemeester van den helder maakt bekend, dat hij op "  // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-20399/1/xml/gmb-2023-20399.xml
            ];
            const identifiersStartWithObjectionStart = [
                "de termijn voor het indienen van een bezwaar start op "  // Gouda https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-37420/1/xml/gmb-2023-37420.xml
            ];
            const identifiersWithDeadline = [
                "als u het niet eens bent met dit besluit dan kunt u binnen zes weken na de verzenddatum bezwaar maken. op onze website kunt u lezen hoe u online of per post uw bezwaar kunt indienen. uw bezwaarschrift moet vóór ",  // Alkmaar
                "u kunt het college van de gemeente heemstede tot en met ",  // Heemstede https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-77700/1/xml/gmb-2023-77700.xml
                "u kunt de gemeente tot "  // Dijk en Waard https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-76678/1/xml/gmb-2023-76678.xml
            ];
            const identifiersMiddle = [
                " het besluit is verzonden op ",  // Bloemendaal https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-94061/1/xml/gmb-2023-94061.xml
                " (verzonden ",  // Texel
                ", verzonden ",  // Haarlem https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-31494/1/xml/gmb-2023-31494.xml
                ", verzenddatum ",  // Bergen NH https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-76348/1/xml/gmb-2023-76348.xml
                " (verzenddatum ",  // Groningen https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-79536/1/xml/gmb-2023-79536.xml
                ", verleend op ",  // Beverwijk https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-81123/1/xml/gmb-2023-81123.xml
                " (datum besluit ", // Rotterdam https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-92486/1/xml/gmb-2023-92486.xml
                "de termijn voor het indienen van een bezwaarschrift start op "  // Aalsmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-63996/1/xml/gmb-2023-63996.xml
            ];
            const identifiersAfter = [
                " is een omgevingsvergunning verleend"  // Noordoostpolder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-93843/1/xml/gmb-2023-93843.xml
            ];
            const identifierNextValueIsDate = "datum bekendmaking besluit:";  // Den Haag https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-79557/1/xml/gmb-2023-79557.xml
            let i;
            let pos;
            let isDateOfDeadline = false;
            let isObjectionStartDate = false;
            let result;
            if (value === identifierNextValueIsDate) {
                isNextValueBekendmakingsDate = true;
            } else {
                value = convertMonthNames(value);
                if (isNextValueBekendmakingsDate === true) {
                    value = identifier + value;
                }
                isNextValueBekendmakingsDate = false;
            }
            // If not found, try the regular way of publishing:
            if (value.substring(0, identifier.length) !== identifier) {
                for (i = 0; i < identifiersStart.length; i += 1) {
                    if (value.substring(0, identifiersStart[i].length) === identifiersStart[i]) {
                        value = value.replace(identifiersStart[i], identifier);
                        break;
                    }
                }
            }
            // If not found, try the regular way of publishing objection start date:
            if (value.substring(0, identifier.length) !== identifier) {
                for (i = 0; i < identifiersStartWithObjectionStart.length; i += 1) {
                    pos = value.indexOf(identifiersStartWithObjectionStart[i]);
                    if (pos !== -1) {
                        value = identifier + value.substring(pos + identifiersStartWithObjectionStart[i].length);
                        isObjectionStartDate = true;
                        break;
                    }
                }
            }
            // If not found, try the Noordoostpolder way of publishing:
            if (value.substring(0, identifier.length) !== identifier) {
                for (i = 0; i < identifiersAfter.length; i += 1) {
                    // Noordoostpolder has this in the title: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-93843/1/xml/gmb-2023-93843.xml
                    pos = value.indexOf(identifiersAfter[i]);
                    if (pos !== -1) {
                        value = identifier + value.substring(pos - 10, pos);
                        break;
                    }
                }
            }
            // If not found, try the Alkmaar way of publishing:
            if (value.substring(0, identifier.length) !== identifier) {
                for (i = 0; i < identifiersWithDeadline.length; i += 1) {
                    if (value.substring(0, identifiersWithDeadline[i].length) === identifiersWithDeadline[i]) {
                        value = value.replace(identifiersWithDeadline[i], identifier);
                        isDateOfDeadline = true;
                        break;
                    }
                }
            }
            // If not found, try the Texel way of publishing:
            if (value.substring(0, identifier.length) !== identifier) {
                // Velsen repeats part of title (Zeeweg 343, interne constructiewijziging (07/02/2022) 143528-2022):
                identifiersMiddle.push(publication.title.substring(publication.title.length - 4).toLowerCase() + " (");  // Velsen https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-69953/1/xml/gmb-2023-69953.xml
                for (i = 0; i < identifiersMiddle.length; i += 1) {
                    // Bergen, Castricum etc. have this in the title: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-76348/1/xml/gmb-2023-76348.xml
                    pos = publication.title.indexOf(identifiersMiddle[i]);
                    if (pos !== -1) {
                        // Haarlem: ...activiteit handelen in strijd met regels ruimtelijke ordening, verzonden 16 januari 2023
                        value = identifier + convertMonthNames(publication.title.substring(pos + identifiersMiddle[i].length));
                        break;
                    }
                    pos = value.indexOf(identifiersMiddle[i]);
                    if (pos !== -1) {
                        value = identifier + value.substring(pos + identifiersMiddle[i].length);
                        break;
                    }
                }
            }
            if (value.substring(0, identifier.length) === identifier) {
                value = value.substring(identifier.length);
                if (value.substring(1, 2) === " " || value.substring(1, 2) === "-") {
                    value = "0" + value;
                }
                // Remove time from dates:
                result = parseDate(value);
                if (result.isValid) {
                    if (isDateOfDeadline) {
                        // This is the last date you can object to a decision. Extract 6 weeks.
                        result.date.setDate(result.date.getDate() - (7 * 6));
                    } else if (isObjectionStartDate) {
                        result.date.setDate(result.date.getDate() - 1);  // Objection period starts one day after date 'verzonden'
                    }
                    return result;
                }
            }
            return {
                "isValid": false
            };
        }

        const alineas = getAlineas(responseXml);
        const maxLooptijd = (6 * 7) + 1;  // 6 weken de tijd om bezwaar te maken
        const dateFormatOptions = {"weekday": "long", "year": "numeric", "month": "long", "day": "numeric"};
        let datumBekendgemaakt;  // Datum verzonden aan belanghebbende(n)
        let looptijd;
        let resterendAantalDagenBezwaartermijn;
        let i;
        let j;
        let alinea;
        let textToShow = "";
        let isNextValueBekendmakingsDate = false;
        let isBezwaartermijnFound = false;
        for (i = 0; i < alineas.length; i += 1) {
            alinea = alineas[i];
            if (alinea.childNodes.length > 0) {
                for (j = 0; j < alinea.childNodes.length; j += 1) {
                    if (alinea.childNodes[j].nodeName === "#text") {
                        datumBekendgemaakt = getDateFromText(alinea.childNodes[j].nodeValue.trim(), publication);
                        if (datumBekendgemaakt.isValid) {
                            isBezwaartermijnFound = true;
                            looptijd = getDaysPassed(datumBekendgemaakt.date);
                            resterendAantalDagenBezwaartermijn = maxLooptijd - looptijd;
                            textToShow = "Gepubliceerd: " + publication.date.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br />Bekendgemaakt aan belanghebbende: " + datumBekendgemaakt.date.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br />" + (
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
        if (!isBezwaartermijnFound) {
            textToShow = "Gepubliceerd: " + publication.date.toLocaleDateString("nl-NL", dateFormatOptions) + ".<br /><br />";
        }
        document.getElementById(licenseId).innerHTML = textToShow;
    }

    /**
     * Call the government API for a specific license, to get more details. This is done to get the date the license is granted.
     * @param {string} licenseId License ID.
     * @param {!Object} publication Publication object.
     * @return {void}
     */
    function collectBezwaartermijn(licenseId, publication) {
        if (publication.urlApi === "UNAVAILABLE") {
            console.error("Unable to get data for license " + publication.urlDoc);
            return;
        }
        // Endpoint: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-425209/1/xml/gmb-2022-425209.xml
        fetch(
            publication.urlApi,
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.text().then(function (xml) {
                    parseBekendmaking(xml, publication, licenseId);
                });
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    /**
     * Create the option of a drop down element. This is used for the municipality drop down and the period drop down.
     * @param {string} value Key.
     * @param {string} displayValue Value.
     * @param {boolean} isSelected Selected or not?
     * @return {!HTMLOptionElement} Option element.
     */
    function createOption(value, displayValue, isSelected) {
        const option = document.createElement("option");
        option.text = displayValue;
        option.value = value;
        if (isSelected) {
            option.setAttribute("selected", true);
        }
        return option;
    }

    /**
     * Create the spinner shown when retrieving all licenses. This is shown in the center right.
     * @return {void}
     */
    function createMapsControlLoadingIndicator() {
        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        controlDiv.appendChild(appState.loadingIndicator);
        appState.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(controlDiv);
    }

    /**
     * Create the drop down with all municipalities of The Netherlands.
     * @return {void}
     */
    function createMapsControlMunicipalities() {

        /**
         * Creates an option element with the specified value. The active municipality is selected by default.
         * @param {string} value The value of the option.
         * @return {!HTMLOptionElement} The created option element.
         */
        function createOptionEx(value) {
            return createOption(value, value, value === appState.activeMunicipality);
        }

        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        const municipalityNames = Object.keys(appState.municipalities);
        combobox.id = "idCbxMunicipality";
        combobox.title = "Gemeente selecteren";
        municipalityNames.forEach(function (municipalityName) {
            combobox.add(createOptionEx(municipalityName));
        });
        combobox.addEventListener("change", function () {
            loadData(true);
        });
        combobox.classList.add("controlStyle");
        controlDiv.appendChild(combobox);
        appState.map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
    }

    /**
     * Create the drop down with time filter. This is shown in the bottom center.
     * @return {void}
     */
    function createMapsControlPeriods() {

         /**
          * Creates an option element with the specified value. Period 14d is selected by default.
          * @param {string} value The value of the option.
          * @param {string} displayValue The value of the option to display.
          * @return {!HTMLOptionElement} The created option element.
          */
        function createOptionEx(value, displayValue) {
            return createOption(value, displayValue, value === "14d");
        }

        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        combobox.id = "idCbxPeriod";
        combobox.title = "Periode van de bekendmaking selecteren";
        appState.periods.forEach(function (period) {
            combobox.add(createOptionEx(period.key, period.val));
        });
        combobox.addEventListener("change", updatePeriodFilter);
        combobox.classList.add("controlStyle");
        controlDiv.appendChild(combobox);
        appState.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(controlDiv);
    }

    /**
     * Create the button linking to this source code. This is shown in the bottom left.
     * @return {void}
     */
    function createMapsControlSource() {
        const controlDiv = document.createElement("div");  // Create a DIV to attach the control UI to the Map.
        const button = document.createElement("button");
        button.id = "idBtnSource";
        button.textContent = "Broncode";
        button.title = "Source op GitHub bekijken";
        button.type = "button";
        button.addEventListener("click", function () {
            const url = "https://github.com/basgroot/bekendmakingen";
            if (window.open(url) === null) {
                // Popup blocker or something preventing a new tab
                window.location.href = url;
            }
        });
        button.classList.add("controlStyle");
        controlDiv.appendChild(button);
        appState.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(controlDiv);
    }

    /**
     * Create the elements on the map. This includes the loading indicator, the municipality drop down and the period drop down.
     * https://developers.google.com/maps/documentation/javascript/examples/control-custom
     * @return {void}
     */
    function createMapsControls() {
        createMapsControlLoadingIndicator();
        createMapsControlMunicipalities();
        createMapsControlPeriods();
        createMapsControlSource();
    }

    /**
     * Parse the license ID. This is the last part of the URL.
     * Options: https://zoek.officielebekendmakingen.nl/prb-2023-962.html
     *          https://zoek.officielebekendmakingen.nl/gmb-2023-56454.html
     *          https://zoek.officielebekendmakingen.nl/wsb-2023-801.html
     *          https://zoek.officielebekendmakingen.nl/stcrt-2023-128.html
     * @param {string} websiteUrl Link to document.
     * @return {string|boolean} License ID or false.
     */
    function getLicenseIdFromUrl(websiteUrl) {
        const startOfUrl = "https://zoek.officielebekendmakingen.nl/";
        const endOfUrl = ".html";
        if (websiteUrl.startsWith(startOfUrl)) {
            return websiteUrl.substring(startOfUrl.length, websiteUrl.length - endOfUrl.length);
        }
        return false;
    }

    /**
     * Choose what image to use for a license type.
     * Text mining to get distinguish the different license states and types
     * Images are converted to SVG using https://png2svg.com/
     * Resized to 35x45 using https://www.iloveimg.com/resize-image/resize-svg#resize-options,pixels
     * Optmized using https://svgoptimizer.com/
     * @param {string} title Name of permit.
     * @param {string} type Permit type.
     * @return {string} Icon file name without extension.
     */
    function getIconName(title, type) {
        const exploitatievergunningen = [
            "brandveilig gebruik"
        ];
        const milieuvergunningen = [
            "milieu",
            "natuur"
        ];
        const verkeersvergunningen = [
            "uitweg en inrit"
        ];
        const bouwvergunningen = [
            "bouwen",
            "slopen"
        ];
        title = title.toLowerCase();
        if (title.indexOf("aanvraag") !== -1 || title.indexOf("verlenging") !== -1) {
            return "aanvraag";  // Halfwitty, CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0, via Wikimedia Commons
        }
        if (exploitatievergunningen.indexOf(type) !== -1 || title.indexOf("exploitatievergunning") !== -1 || title.indexOf("alcoholwetvergunning") !== -1) {
            return "bar";
        }
        if (title.indexOf("evenement") !== -1 || title.indexOf("loterij") !== -1) {
            return "evenement";
        }
        if (title.indexOf("bed & breakfast") !== -1 || title.indexOf("vakantieverhuur") !== -1) {
            return "hotel";
        }
        if (type === "kappen" || title.indexOf("houtopstand") !== -1 || title.indexOf("(kap)") !== -1) {
            return "boomkap";
        }
        if (title.indexOf("oplaadplaats") !== -1 || title.indexOf("opladen") !== -1 || title.indexOf("laadpaal") !== -1) {
            return "laadpaal";
        }
        if (title.indexOf("apv vergunning") !== -1 || title.indexOf("parkeervakken") !== -1 || title.indexOf("tvm") !== -1) {
            // Verify this after 'laadpaal':
            return "tvm";
        }
        if (verkeersvergunningen.indexOf(type) !== -1) {
            // Verify this after 'parkeervakken/tvm':
            return "verkeer";
        }
        if (title.indexOf("onttrekkingsvergunning") !== -1 || title.indexOf("omzettingsvergunning") !== -1) {
            return "kamerverhuur";  // EpicPupper, CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0, via Wikimedia Commons
        }
        if (title.indexOf("water") !== -1) {
            return "boot";  // Barbetorte, CC BY-SA 3.0 https://creativecommons.org/licenses/by-sa/3.0, via Wikimedia Commons
        }
        if (type === "reclame") {
            return "reclame";  // Verdy_p (complete construction and vectorisation, based on mathematical properties of the symbol, and not drawn manually, and then manually edited without using any SVG editor)., Public domain, via Wikimedia Commons
        }
        if (milieuvergunningen.indexOf(type) !== -1) {
            return "milieu";
        }
        if (bouwvergunningen.indexOf(type) !== -1) {
            return "constructie";
        }
        return "wetboek";  // By No machine-readable author provided. Chris-martin assumed (based on copyright claims). Own work assumed (based on copyright claims)., CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=1010176
        // "ruimtelijke ordening",
    }

    /**
     * When two licenses are on the same location, move the second, to see them both.
     * @param {!Object} proposedCoordinate Coordinate to place marker.
     * @return {!Object} Coordinate to place marker.
     */
    function findUniquePosition(proposedCoordinate) {

        /**
         * Checks if a coordinate is available.
         * @param {!Object} coordinate The coordinate to check.
         * @return {boolean} True if the coordinate is available, false otherwise.
         */
        function isCoordinateAvailable(coordinate) {
            let isAvailable = true;  // Be positive
            let i;
            let marker;
            for (i = 0; i < appState.markersArray.length; i += 1) {
                // Don't use forEach, to gain some performance.
                marker = appState.markersArray[i];
                if (marker.position.lat === coordinate.lat && marker.position.lng === coordinate.lng) {
                    isAvailable = false;
                    break;
                }
            }
            return isAvailable;
        }

        const destinationCoordinate = {
            "lat": proposedCoordinate.lat,
            "lng": proposedCoordinate.lng
        };
        // The deviation from the original coordinate
        const latShift = 0.000017;
        const lngShift = 0.000016;
        while (!isCoordinateAvailable(destinationCoordinate)) {
            destinationCoordinate.lat = destinationCoordinate.lat + latShift;
            destinationCoordinate.lng = destinationCoordinate.lng + lngShift;
        }
        return destinationCoordinate;
    }

    /**
     * Set visibility of the markers, based on time filter.
     * @param {number} age Days in the past.
     * @param {string} periodToShow Selected period.
     * @return {boolean} Is marker visible?
     */
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

    /**
     * Create a marker icon.
     * @param {string} sourceUrl Link to marker image.
     * @param {string=} label Optional label.
     * @return {!HTMLDivElement} Marker node containing the image.
     */
    function createMarkerIcon(sourceUrl, label) {
        const iconContainer = document.createElement("div");
        const icon = document.createElement("img");
        icon.src = sourceUrl;
        iconContainer.appendChild(icon);
        if (label === undefined) {
            return iconContainer;
        }
        iconContainer.classList.add("municipalityContainer");
        const labelContainer = document.createElement("div");
        labelContainer.classList.add("municipalityLabel");
        labelContainer.innerText = label;
        iconContainer.appendChild(labelContainer);
        return iconContainer;
    }

    /**
     * Add a marker to the map.
     * @param {!Object} publication Publication object.
     * @param {string} periodToShow Selected period.
     * @param {!Object} position Coordinate.
     * @return {!Object} Marker object. This is used to remove the marker later.
     */
    function addMarker(publication, periodToShow, position) {

        /**
         * Handles the click event. Show the info window.
         */
        function onClick() {
            const description = publication.description + "<br /><br />Meer info: <a href=\"" + publication.urlDoc + "\" target=\"blank\">" + publication.urlDoc + "</a>.";
            const licenseId = getLicenseIdFromUrl(publication.urlDoc);
            // Supported is "Gemeentelijk blad (gmb)", "Provinciaal blad (prb)", "Waterschapsblad (wsb) and Staatscourant (stcrt)"
            // Options: https://zoek.officielebekendmakingen.nl/prb-2023-962.html
            //          https://zoek.officielebekendmakingen.nl/gmb-2023-56454.html
            //          https://zoek.officielebekendmakingen.nl/wsb-2023-801.html
            //          https://zoek.officielebekendmakingen.nl/stcrt-2023-128.html
            // Not supported:
            //          https://www.zaanstad.nl/mozard/!suite42.scherm1260?mObj=211278
            //          https://bekendmakingen.amsterdam.nl/bekendmakingen/overige/decos/C174AC3CD0754F9089D1553C31CD5B7A
            if (licenseId === false) {
                // Errors:  https://www.zaanstad.nl/mozard/!suite42.scherm1260?mObj=211278
                //          https://bekendmakingen.amsterdam.nl/bekendmakingen/overige/decos/C174AC3CD0754F9089D1553C31CD5B7A
                showInfoWindow(marker, iconName, publication.title, description);
            } else {
                showInfoWindow(marker, iconName, publication.title, "<div id=\"" + licenseId + "\"><br /><br /><br /></div>" + description);
                collectBezwaartermijn(licenseId, publication);
            }
        }

        /**
         * Handles the hover event. Highlight the icon (and related icons) on hover.
         */
        function onMouseOver() {
            appState.markersArray.forEach(function (markerObject) {
                if (markerObject.url === publication.urlDoc) {
                    markerObject.marker.content.getElementsByTagName("img")[0].src = "img/" + iconName + "-highlight.png";
                }
            });
        }

        /**
         * Handles the mouse out event. Remove the highlight.
         */
        function onMouseOut() {
            appState.markersArray.forEach(function (markerObject) {
                if (markerObject.url === publication.urlDoc) {
                    markerObject.marker.content.getElementsByTagName("img")[0].src = "img/" + iconName + ".png";
                }
            });
        }

        // 2022-09-05T09:04:57.175Z;
        // https://zoek.officielebekendmakingen.nl/gmb-2022-396401.html;
        // "Besluit apv vergunning Verleend Monnikendammerweg 27";
        // "TVM- 7 PV reserveren - Monnikendammerweg 27-37 - 03-07/10/2022, Monnikendammerweg 27";
        // 125171;
        // 488983
        // https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerElementOptions
        const age = getDaysPassed(publication.date);
        const iconName = getIconName(publication.title, publication.type);
        const marker = new AdvancedMarkerElement({
            "map": (
                isMarkerVisible(age, periodToShow)
                ? appState.map
                : null
            ),
            "position": position,
            "content": createMarkerIcon("img/" + iconName + ".png"),
            "zIndex": appState.zIndex,
            "title": publication.title
        });
        const markerObject = {
            "url": publication.urlDoc,
            "age": age,
            "position": position,
            "isSvg": true,
            "marker": marker
        };
        appState.zIndex -= 1;  // Input is sorted by modification date - most recent first. Give them a higher zIndex, so Besluit is in front of Verlenging (which is in front of Aanvraag)
        appState.markersArray.push(markerObject);
        marker.addListener("click", onClick);
        // Highlight the icon (and related icons) on hover
        marker.content.addEventListener("mouseover", onMouseOver);
        marker.content.addEventListener("mouseout", onMouseOut);
        return markerObject;
    }

    /**
     * If visible, create the marker. Otherwise move it to a list and show it when the map is scrolled.
     * This reduces load in the browser.
     * @param {!Object} publication Publication object.
     * @param {string} periodToShow Selected period.
     * @param {!Object} position Coordinate.
     * @param {!Object} bounds Visible map.
     * @return {void}
     */
    function prepareToAddMarker(publication, periodToShow, position, bounds) {
        if (bounds.contains(position)) {
            addMarker(publication, periodToShow, position);
        } else {
            appState.delayedMarkersArray.push({
                "publication": publication,
                "position": position
            });
        }
    }

    /**
     * Determine what time filter must be used.
     * @return {!Object} Time filter.
     */
    function getPeriodFilter() {

        /**
         * Checks if a value represents a historical period. Historical periods are notated like '2023-11'.
         * @param {string} value The value to check.
         * @return {boolean} Returns true if the value represents a historical period, otherwise returns false.
         */
        function isHistoricalPeriod(value) {
            // Values of historical periods are notated like '2023-03'
            return value.length === 7 && value.substring(4, 5) === "-";
        }

        const result = {
            "elm": document.getElementById("idCbxPeriod"),
            "period": "14d",
            "periodToShow": "14d",
            "isHistory": false
        };
        if (result.elm === null) {
            return result;  // Default when loading
        }
        // If this is an historical period, default to 'all':
        result.period = result.elm.value;
        if (isHistoricalPeriod(result.elm.value)) {
            result.periodToShow = "all";
            result.isHistory = true;
        } else {
            result.periodToShow = result.elm.value;
        }
        return result;
    }

    /**
     * Create (new) latitude/longitude object.
     * @param {string} locatiepunt Latitude/longitude. Input example: "52.35933 4.893097".
     * @return {!Object} Coordinate.
     */
    function createCoordinate(locatiepunt) {
        const coordinate = locatiepunt.split(" ");
        return {
            "lat": parseFloat(coordinate[0]),
            "lng": parseFloat(coordinate[1])
        };
    }

    /**
     * Add markers to the map. This is done in batches, to improve performance.
     * @param {number} startRecord Number of record of current batch.
     * @param {boolean} isMoreDataAvailable More to load?
     * @return {void}
     */
    function addMarkers(startRecord, isMoreDataAvailable) {
        const periodFilter = getPeriodFilter();
        const bounds = appState.map.getBounds();
        let position;
        let i;
        let publication;
        if (appState.publicationsArray.length > 0) {
            console.log("Adding markers " + startRecord + " to " + appState.publicationsArray.length);
        }
        for (i = startRecord - 1; i < appState.publicationsArray.length; i += 1) {
            publication = appState.publicationsArray[i];
            try {
                if (publication.location.length === 0) {
                    // Take the center of the municipality:
                    position = findUniquePosition(appState.municipalities[appState.activeMunicipality].center);
                    prepareToAddMarker(publication, periodFilter.periodToShow, position, bounds);
                } else {
                    publication.location.forEach(function (locatiepunt) {
                        position = findUniquePosition(createCoordinate(locatiepunt));
                        prepareToAddMarker(publication, periodFilter.periodToShow, position, bounds);
                    });
                }
            } catch (e) {
                console.error(e);
                console.error(JSON.stringify(publication, null, 4));
            }
        }
        if (!isMoreDataAvailable) {
            setLoadingIndicatorVisibility("hide");
            if (!appState.isHistoryActive) {
                appState.isFullyLoaded = true;
            }
        }
    }

    /**
     * Add municipality markers to the map. This is done in batches, to improve performance.
     * @return {void}
     */
    function addMunicipalitiyMarkers() {
        const municipalityNames = Object.keys(appState.municipalities);
        municipalityNames.forEach(function (municipalityName) {
            const municipalityObject = appState.municipalities[municipalityName];
            const marker = new AdvancedMarkerElement({
                "map": (
                    municipalityName === appState.activeMunicipality
                    ? null
                    : appState.map
                ),
                "position": municipalityObject.center,
                "content": createMarkerIcon("img/gemeente.png", municipalityName),
                "title": municipalityName
            });
            appState.municipalityMarkers.push({
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
                    appState.activeMunicipality = municipalityName;
                    loadData(true);
                }
            );
        });
    }

    /**
     * Show or hide a marker. This replaces the setVisibility function of the legacy marker element.
     * @param {!Object} marker Marker object.
     * @param {boolean} isVisible Set visibility.
     * @return {void}
     */
    function setMarkerVisibility(marker, isVisible) {
        if (isVisible) {
            marker.map = appState.map;
        } else {
            marker.map = null;
        }
    }

    /**
     * Reset time filter. This is done when the municipality is changed.
     * @return {void}
     */
    function updatePeriodFilter() {
        const periodFilter = getPeriodFilter();
        if (periodFilter.isHistory) {
            console.log("Loading historical data of period " + periodFilter.periodToShow);
            loadHistory(periodFilter.period, true);
        } else {
            console.log("Filtering period to: " + periodFilter.periodToShow);
            if (appState.isHistoryActive) {
                appState.isHistoryActive = false;
                if (appState.isFullyLoaded) {
                    clearMarkers(appState.activeMunicipality);
                    // Restore the backup
                    appState.publicationsArray = [].concat(appState.publicationsArrayBackup);
                    console.log("Backup restored");
                    addMarkers(1, false);
                } else {
                    loadData(false);
                }
            }
            appState.markersArray.forEach(function (markerObject) {
                setMarkerVisibility(markerObject.marker, isMarkerVisible(markerObject.age, periodFilter.periodToShow));
            });
        }
    }

    /**
     * Add municipality and other parameters to the URL, so the view can be shared.
     * @param {number|string} zoom Zoom level.
     * @param {!Object} center Coordinate of center of map.
     * @return {void}
     */
    function updateUrl(zoom, center) {
        // Add to URL: /?in=Alkmaar&zoom=15&center=52.43660651356703,4.84418395002761
        if (window.URLSearchParams) {
            const urlSearchParams = new window.URLSearchParams(window.location.search);
            urlSearchParams.set("in", appState.activeMunicipality);
            urlSearchParams.set("zoom", zoom.toString());
            urlSearchParams.set("center", center.toUrlValue(10));
            window.history.replaceState(null, "", window.location.pathname + "?" + urlSearchParams.toString());
        }
        document.title = "Bekendmakingen " + appState.activeMunicipality;
    }

    /**
     * Calculate the distance between two points, using the haversine formula.
     * @param {!Object} from Coordinate 1.
     * @param {!Object} to Coordinate 2.
     * @return {number} Distance in meters.
     */
    function computeDistanceBetween(from, to) {
        // Source: http://www.movable-type.co.uk/scripts/latlong.html
        // Maps API covers this function as well:
        // https://developers.google.com/maps/documentation/javascript/reference/geometry#spherical.computeDistanceBetween
        const radius = 6371e3;  // metres
        const a1 = from.lat * Math.PI / 180;  // φ1: φ, λ in radians
        const a2 = to.lat * Math.PI / 180;  // φ2
        const latDelta = (to.lat - from.lat) * Math.PI / 180;  // Δφ
        const lngDelta = (to.lng - from.lng) * Math.PI / 180;  // Δλ
        const a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) + Math.cos(a1) * Math.cos(a2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return radius * c;  // Distance in meters
    }

    /**
     * Not accurate, but try to find the closest municipality center.
     * @param {!Object} position Coordinate to start.
     * @return {void}
     */
    function activateClosestMunicipality(position) {
        const municipalityNames = Object.keys(appState.municipalities);
        let distance = 1000000;
        municipalityNames.forEach(function (municipalityName) {
            const municipalityObject = appState.municipalities[municipalityName];
            const distanceBetweenMunicipalityAndViewer = computeDistanceBetween(position, municipalityObject.center) / 1000;
            if (distanceBetweenMunicipalityAndViewer < distance) {
                console.log("Found closer municipality: " + municipalityName);
                distance = distanceBetweenMunicipalityAndViewer;
                appState.activeMunicipality = municipalityName;
            }
        });
    }

    /**
     * Determine if the municipality is part of the URL.
     * @return {boolean} Is the municipality part of the URL?
     */
    function isLocationInUrl() {
        if (window.URLSearchParams) {
            const urlSearchParams = new window.URLSearchParams(window.location.search);
            const municipalityParam = urlSearchParams.get("in");
            if (municipalityParam && appState.municipalities[municipalityParam] !== undefined) {
                return true;
            }
        }
        return false;
    }

    /**
     * Try to find the municipality of the visitor, by using an IP geolocation API. This is a fallback for when the device does not support GPS.
     * @return {void}
     */
    function getLocationByIp() {
        fetch(
            "https://basement.nl/proxy-server/location.php",
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    if (appState.municipalities[responseJson.city] !== undefined) {
                        // Name of the city is the same as the municipality.
                        console.log("Client location in municipality " + responseJson.city);
                        appState.activeMunicipality = responseJson.city;
                    } else {
                        // Try to locate the closest municipality:
                        activateClosestMunicipality({
                            "lat": responseJson.lat,
                            "lng": responseJson.lng
                        });
                    }
                    internalInitMap();
                });
            } else {
                console.error(response);
                internalInitMap();
            }
        }).catch(function (error) {
            console.error(error);
            internalInitMap();
        });
    }

    /**
     * Try to find the municipality of the visitor, by using the device position, or IP geolocation API.
     * @return {void}
     */
    function getLocationAndLoadData() {

        /**
         * Callback function for when the device's location is found.
         * @param {!Object} position The position object containing the device's coordinates.
         */
        function deviceLocationFound(position) {
            activateClosestMunicipality({
                "lat": position.coords.latitude,
                "lng": position.coords.longitude
            });
            internalInitMap();
        }

        /**
         * This function is called when the device location request is rejected. This can happen when the user denies the request, or when the device does not support GPS.
         */
        function deviceLocationRequestRejected() {
            console.log("Unable to retrieve device location.");
            // Fallback:
            getLocationByIp();
        }

        if (isLocationInUrl()) {
            internalInitMap();
            return;  // The location is explicitly requested. Don't adapt location based on visitors IP address.
        }
        // Try to get the location of the device:
        if (!navigator.geolocation) {
            // GPS is not available for this browser. Determine the location by IP Address:
            getLocationByIp();
            return;
        }
        // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
        navigator.geolocation.getCurrentPosition(deviceLocationFound, deviceLocationRequestRejected);
    }

    /**
     * Determine the start date. This is used to determine if the history file can be loaded, which improves performance.
     * @return {void}
     */
    function determineRequestPeriod() {

        /**
         * Prefix number with zero, if it has one digit.
         * @param {number} n The one or two digit number representing day or month.
         * @return {string} The formatted number.
         */
        function addLeadingZero(n) {
            return (
                n > 9
                ? String(n)
                : "0" + n
            );
        }

        const currentDate = new Date();
        const previousMonth = new Date();
        previousMonth.setDate(0);  // Set to last day of previous month
        const previousMonthString = previousMonth.getFullYear() + "-" + addLeadingZero(previousMonth.getMonth() + 1);
        const periodId = appState.periods.findIndex(function (period) {
            return period.key === previousMonthString;
        });
        appState.requestPeriod.startDate = new Date();
        appState.requestPeriod.startDate.setDate(appState.requestPeriod.startDate.getDate() - 42);  // Substract 6 weeks
        if (periodId >= 0) {
            appState.requestPeriod.historyFile = previousMonthString;
            appState.requestPeriod.startDateString = currentDate.getFullYear() + "-" + addLeadingZero(currentDate.getMonth() + 1) + "-" + "01";  // Start of current month, because history is already available in a faster to retrieve format
            console.log("Historical file to add to view: " + appState.requestPeriod.historyFile);
        } else {
            appState.requestPeriod.startDateString = appState.requestPeriod.startDate.getFullYear() + "-" + addLeadingZero(appState.requestPeriod.startDate.getMonth() + 1) + "-" + addLeadingZero(appState.requestPeriod.startDate.getDate());
        }
        console.log("StartDate: " + appState.requestPeriod.startDateString);
    }

    /**
     * Setup map.
     * @return {void}
     */
    function internalInitMap() {

        function closeInfoWindow() {
            appState.infoWindow.close();  // https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.close
        }

        const containerElm = document.getElementById("map");
        const mapSettings = getInitialMapSettings();
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        appState.loadingIndicator.id = "idLoadingIndicator";
        appState.loadingIndicator.style.width = Math.max((screenWidth / 100) * 12, 70) + "px";
        appState.loadingIndicator.src = "img/ajax-loader.gif";  // ConnectedWizard, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons
        // https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions
        appState.infoWindow = new google.maps.InfoWindow();
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        appState.map = new google.maps.Map(
            containerElm,
            {
                "backgroundColor": "#9CC0F9",  // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.backgroundColor
                "clickableIcons": false,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.clickableIcons
                "center": new google.maps.LatLng(mapSettings.center.lat, mapSettings.center.lng),
                "mapTypeId": google.maps.MapTypeId.ROADMAP,  // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
                "gestureHandling": "greedy",  // When scrolling, keep scrolling
                "zoom": mapSettings.zoomLevel,
                "mapId": "9913fa533c4bf328"
            }
        );
        determineRequestPeriod();
        createMapsControls();
        addMunicipalitiyMarkers();
        // Maps events: https://developers.google.com/maps/documentation/javascript/events
        appState.map.addListener("dragend", closeInfoWindow);
        appState.map.addListener("click", closeInfoWindow);
        appState.map.addListener("zoom_changed", function () {
            // Add to URL: /?zoom=15&center=52.43660651356703,4.84418395002761
            const periodFilter = getPeriodFilter();
            const zoom = appState.map.getZoom();
            if (!periodFilter.isHistory) {
                // Iterate over markers and call setVisible
                if (zoom <= 13 && (periodFilter.period === "7d" || periodFilter.period === "14d" || periodFilter.period === "all")) {
                    // Set to 3 days
                    periodFilter.elm.value = "3d";
                    updatePeriodFilter();
                } else if (zoom <= 14 && (periodFilter.period === "14d" || periodFilter.period === "all")) {
                    // Set to 7 days
                    periodFilter.elm.value = "7d";
                    updatePeriodFilter();
                } else if (zoom <= 15 && (periodFilter.period === "all")) {
                    // Set to 14 days
                    periodFilter.elm.value = "14d";
                    updatePeriodFilter();
                }
            }
            closeInfoWindow();
            console.log("Zoom changed to " + zoom);
        });
        appState.map.addListener("idle", function () {
            // Time to display other markers..
            const bounds = appState.map.getBounds();
            const periodFilter = getPeriodFilter();
            let delayedMarker;
            let i = appState.delayedMarkersArray.length;
            while (i > 0) {
                i = i - 1;
                delayedMarker = appState.delayedMarkersArray[i];
                if (bounds.contains(delayedMarker.position)) {
                    addMarker(delayedMarker.publication, periodFilter.periodToShow, delayedMarker.position);
                    appState.delayedMarkersArray.splice(i, 1);
                }
            }
            updateUrl(appState.map.getZoom(), appState.map.getCenter());
            console.log("Remaining items to add to the map: " + appState.delayedMarkersArray.length);
        });
        loadData(true);
        console.log("Using Maps version " + google.maps.version);  // https://developers.google.com/maps/documentation/javascript/releases
    }

    /**
     * Scroll map to a certain coordinate (center of municipality). This is done when the municipality is changed.
     * @param {string} municipality Municipality to center.
     * @return {void}
     */
    function navigateTo(municipality) {
        const center = appState.municipalities[municipality].center;
        appState.map.setZoom(appState.initialZoomLevel);
        appState.map.setCenter(new google.maps.LatLng(center.lat, center.lng));
    }

    /**
     * Convert license URL to API endpoint.
     * URL: https://zoek.officielebekendmakingen.nl/gmb-2022-425209.html
     * Endpoint: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-425209/1/xml/gmb-2022-425209.xml
     * @param {string} urlDoc URL of publication.
     * @return {string} API endpoint.
     */
    function getUrlApi(urlDoc) {
        const licenseId = getLicenseIdFromUrl(urlDoc);
        if (licenseId === false) {
            return "UNAVAILABLE";
        }
        const licenseIdArray = licenseId.split("-");
        // Options: prb-2023-962
        //          gmb-2023-56454
        //          wsb-2023-801
        //          stcrt-2023-128
        return "https://repository.overheid.nl/frbr/officielepublicaties/" + licenseIdArray[0] + "/" + licenseIdArray[1] + "/" + licenseId + "/1/xml/" + licenseId + ".xml";
    }

    /**
     * Parse API response.
     * @param {!Object} responseJson JSON response.
     * @return {boolean} True if records are found.
     */
    function addPublications(responseJson) {

        function sortPublications(a, b) {
            // Sort by publication date, title and number.
            if (a.date === b.date) {
                return String(a.title + a.urlDoc).localeCompare(b.title + b.urlDoc, "nl");
            }
            return a.date - b.date;
        }

        function addPublication(inputRecord) {

            function getType(meta) {
                if (meta.tpmeta.hasOwnProperty("activiteit")) {
                    if (Array.isArray(meta.tpmeta.activiteit)) {
                        // Select the first one..
                        meta.tpmeta.activiteit = meta.tpmeta.activiteit[0];
                    }
                    switch (meta.tpmeta.activiteit.$) {
                    case "bouwen":
                    case "slopen":
                    case "uitweg en inrit":
                    case "kappen":
                    case "milieu":
                    case "natuur":
                    case "reclame":
                    case "brandveilig gebruik":
                    case "ruimtelijke ordening":
                        return meta.tpmeta.activiteit.$;
                    default:
                        console.error("Unexpected activiteit: '" + meta.tpmeta.activiteit.$ + "' " + JSON.stringify(meta, null, 4));
                    }
                }
                return (
                    Array.isArray(meta.owmskern.type)
                    ? meta.owmskern.type[0].$.trim()
                    : meta.owmskern.type.$.trim()
                );
            }

            function getDate(dateString) {
                const date = new Date(dateString);
                // Remove the time from the date:
                date.setHours(-date.getTimezoneOffset() / 60, 0, 0, 0);
                return date;
            }

            function getTitle(meta, type) {
                if (meta.owmskern.hasOwnProperty("title") && typeof meta.owmskern.title === "string") {
                    return meta.owmskern.title.trim();
                }
                if (meta.owmsmantel.hasOwnProperty("abstract") && typeof meta.owmsmantel.abstract === "string") {
                    // Abstract can be a number in some cases (Enkhuizen, December 2024)
                    return meta.owmsmantel.abstract.trim();
                }
                console.warn("Title fallback to " + type + " because no better available: " + JSON.stringify(meta, null, 4));
                return type;
            }

            function getDescription(meta) {
                if (meta.owmsmantel.hasOwnProperty("abstract") && typeof meta.owmsmantel.abstract === "string") {
                    // Abstract can be a number in some cases (Enkhuizen, December 2024)
                    return meta.owmsmantel.abstract.trim();
                }
                if (meta.owmskern.hasOwnProperty("title") && typeof meta.owmskern.title === "string") {
                    return meta.owmskern.title.trim();
                }
                console.warn("Abstract fallback to '-' because no better available: " + JSON.stringify(meta, null, 4));
                return "-";
            }

            function processCoordinate(list, gebiedsmarkering) {

                function addCoordinateToList(coordinate) {
                    // Prevent duplicates:
                    if (list.indexOf(coordinate) === -1) {
                        list.push(coordinate);
                    } else {
                        console.debug("Coordinate already added: " + coordinate);
                    }
                }
                function convertRijksdriehoekToLatLng(x, y) {
                    // The city "Amsterfoort" is used as reference "Rijksdriehoek" coordinate.
                    const referenceRdX = 155000;
                    const referenceRdY = 463000;
                    const dX = (x - referenceRdX) * (Math.pow(10, -5));
                    const dY = (y - referenceRdY) * (Math.pow(10, -5));
                    const sumN = (3235.65389 * dY) + (-32.58297 * Math.pow(dX, 2)) + (-0.2475 * Math.pow(dY, 2)) + (-0.84978 * Math.pow(dX, 2) * dY) + (-0.0655 * Math.pow(dY, 3)) + (-0.01709 * Math.pow(dX, 2) * Math.pow(dY, 2)) + (-0.00738 * dX) + (0.0053 * Math.pow(dX, 4)) + (-0.00039 * Math.pow(dX, 2) * Math.pow(dY, 3)) + (0.00033 * Math.pow(dX, 4) * dY) + (-0.00012 * dX * dY);
                    const sumE = (5260.52916 * dX) + (105.94684 * dX * dY) + (2.45656 * dX * Math.pow(dY, 2)) + (-0.81885 * Math.pow(dX, 3)) + (0.05594 * dX * Math.pow(dY, 3)) + (-0.05607 * Math.pow(dX, 3) * dY) + (0.01199 * dY) + (-0.00256 * Math.pow(dX, 3) * Math.pow(dY, 2)) + (0.00128 * dX * Math.pow(dY, 4)) + (0.00022 * Math.pow(dY, 2)) + (-0.00022 * Math.pow(dX, 2)) + (0.00026 * Math.pow(dX, 5));
                    // The city "Amersfoort" is used as reference "WGS84" coordinate.
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

                function processLine(locatiegebied) {
                    if (Array.isArray(locatiegebied)) {
                        locatiegebied.forEach(processLine);
                        return;
                    }
                    // LINESTRING(6.2351666 52.129457,6.2353781 52.129824,6.2369047 52.130226)
                    // Extract coordinates from string.
                    if (locatiegebied.startsWith("LINESTRING")) {
                        const coordinates = locatiegebied.replace("LINESTRING(", "").replace(")", "").split(",");
                        coordinates.forEach(function (coordinate) {
                            const latLng = coordinate.trim().split(" ");
                            if (latLng.length === 2) {
                                addCoordinateToList(latLng[1] + " " + latLng[0]);
                            } else {
                                console.error("Unable to convert line coordinate " + locatiegebied + " " + JSON.stringify(gebiedsmarkering, null, 4));
                            }
                        });
                    } else {
                        // "52.087781,5.1068402"
                        console.log("Adding locatiegebied LINESTRING as point: " + locatiegebied);
                        addCoordinateToList(locatiegebied.replace(",", " "));
                    }
                }

                function processPolygon(locatiegebied) {
                    if (Array.isArray(locatiegebied)) {
                        locatiegebied.forEach(processPolygon);
                        return;
                    }
                    // POLYGON((4.6486927 51.821361,4.6486994 51.821359,4.6490134 51.821248,4.6493861 51.82149,4.6493794 51.821528,4.6491439 51.821666,4.6490908 51.82163,4.6488611 51.821475,4.6486927 51.821361))
                    if (locatiegebied.startsWith("POLYGON")) {
                        const coordinates = locatiegebied.replace("POLYGON((", "").replace("))", "").split(",");
                        coordinates.forEach(function (coordinate) {
                            const latLng = coordinate.trim().split(" ");
                            if (latLng.length === 2) {
                                addCoordinateToList(latLng[1] + " " + latLng[0]);
                            } else {
                                console.error("Unable to convert polygon coordinate " + locatiegebied + " " + JSON.stringify(gebiedsmarkering, null, 4));
                            }
                        });
                    } else if (locatiegebied.startsWith("LINESTRING")) {
                        console.log("Found LINESTRING in locatiegebied, calling processLine() for " + locatiegebied);
                        processLine(locatiegebied);
                    } else {
                        if (locatiegebied.indexOf(" ") > 0) {
                            // "51.976387,4.6128864 51.976192,4.6125665 51.976078,4.6127763 51.976124,4.6128507 51.976143,4.6128216 51.976276,4.6130733 51.976387,4.6128864"
                            locatiegebied.split(" ").forEach(function (coordinate) {
                                console.log("Adding splitted locatiegebied " + coordinate);
                                addCoordinateToList(coordinate.replace(",", " "));
                            });
                        } else {
                            // "52.087781,5.1068402"
                            console.log("Adding locatiegebied " + locatiegebied);
                            addCoordinateToList(locatiegebied.replace(",", " "));
                        }
                    }
                }

                function processPointLegacy(geometrie) {
                    // POLYGON ((177456.1123260837 361401.39174773294, 177459.78992509528 361374.02033973142, 177472.86583269207 361378.10562450776, 177471.23134424246 361401.80027621059, 177456.1123260837 361401.39174773294))
                    if (geometrie.startsWith("POLYGON")) {
                        const coordinates = geometrie.replace("POLYGON ((", "").replace("))", "").split(",");
                        coordinates.forEach(function (coordinate) {
                            const latLngRijksdriehoek = coordinate.trim().split(" ");
                            if (latLngRijksdriehoek.length === 2) {
                                const latLng = convertRijksdriehoekToLatLng(parseFloat(latLngRijksdriehoek[0], 10), parseFloat(latLngRijksdriehoek[1], 10));
                                addCoordinateToList(latLng.lat + " " + latLng.lng);
                                console.log("Converted " + geometrie + " to " + latLng.lat + " " + latLng.lng);
                            } else {
                                console.error("Unable to convert legacy point as polygon coordinate " + geometrie + " " + JSON.stringify(gebiedsmarkering, null, 4));
                            }
                        });
                    } else {
                        // POINT(120097.26  488031.32)
                        const coordinates = geometrie.replace("POINT", "").trim().replace("(", "").replace(")", "").split("  ");
                        if (coordinates.length === 2) {
                            const latLng = convertRijksdriehoekToLatLng(parseFloat(coordinates[0], 10), parseFloat(coordinates[1], 10));
                            addCoordinateToList(latLng.lat + " " + latLng.lng);
                            console.log("Converted " + geometrie + " to " + latLng.lat + " " + latLng.lng);
                        } else {
                            console.error("Unable to convert legacy point " + geometrie);
                        }
                    }
                }

                if (gebiedsmarkering.hasOwnProperty("Punt") && gebiedsmarkering.Punt.hasOwnProperty("locatiepunt")) {
                    addCoordinateToList(gebiedsmarkering.Punt.locatiepunt);  // "51.5153294378518 4.6993593555447"
                } else if (gebiedsmarkering.hasOwnProperty("Punt") && gebiedsmarkering.Punt.hasOwnProperty("geometrie")) {
                    processPointLegacy(gebiedsmarkering.Punt.geometrie);  // "POINT(120097.26  488031.32)"
                } else if (gebiedsmarkering.hasOwnProperty("Adres") && gebiedsmarkering.Adres.hasOwnProperty("locatiepunt")) {
                    addCoordinateToList(gebiedsmarkering.Adres.locatiepunt);  // "51.5153294378518 4.6993593555447"
                } else if (gebiedsmarkering.hasOwnProperty("Vlak") && gebiedsmarkering.Vlak.hasOwnProperty("locatiegebied")) {
                    // POLYGON((4.6486927 51.821361,4.6486994 51.821359,4.6490134 51.821248,4.6493861 51.82149,4.6493794 51.821528,4.6491439 51.821666,4.6490908 51.82163,4.6488611 51.821475,4.6486927 51.821361))
                    processPolygon(gebiedsmarkering.Vlak.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("Perceel") && gebiedsmarkering.Perceel.hasOwnProperty("locatiegebied")) {
                    processPolygon(gebiedsmarkering.Perceel.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("Buurt") && gebiedsmarkering.Buurt.hasOwnProperty("locatiegebied")) {
                    processPolygon(gebiedsmarkering.Buurt.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("Wijk") && gebiedsmarkering.Wijk.hasOwnProperty("locatiegebied")) {
                    processPolygon(gebiedsmarkering.Wijk.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("GeometrieRef") && gebiedsmarkering.GeometrieRef.hasOwnProperty("locatiegebied")) {
                    processPolygon(gebiedsmarkering.GeometrieRef.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("Weg") && gebiedsmarkering.Weg.hasOwnProperty("locatiegebied")) {
                    processLine(gebiedsmarkering.Weg.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("Lijn") && gebiedsmarkering.Lijn.hasOwnProperty("locatiegebied")) {
                    processLine(gebiedsmarkering.Lijn.locatiegebied);
                } else if (gebiedsmarkering.hasOwnProperty("Gemeente") ||
                    gebiedsmarkering.hasOwnProperty("Woonplaats") ||
                    gebiedsmarkering.hasOwnProperty("Waterschap") ||
                    gebiedsmarkering.hasOwnProperty("Provincie")) {
                    // Ignore this.
                } else {
                    console.error("Format of gebiedsmarkering not supported: " + JSON.stringify(gebiedsmarkering, null, 4));
                }
            }

            const urlDoc = inputRecord.recordData.gzd.enrichedData.preferredUrl.trim();
            const description = getDescription(inputRecord.recordData.gzd.originalData.meta);
            const type = getType(inputRecord.recordData.gzd.originalData.meta);
            const publication = {
                // Example: "2023-02-10"
                "date": getDate(inputRecord.recordData.gzd.originalData.meta.tpmeta.datumTijdstipWijzigingWork),
                // Example: "https://zoek.officielebekendmakingen.nl/gmb-2023-59059.html"
                "urlDoc": urlDoc,
                // Example: "https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-59059/1/xml/gmb-2023-59059.xml"
                "urlApi": getUrlApi(urlDoc),
                // Example "kapvergunning"
                "type": type,
                // Example: "Besluit apv vergunning Verleend Overtoom 10-H"
                "title": getTitle(inputRecord.recordData.gzd.originalData.meta, type),
                // Example: "TVM 2 vakken - Overtoom 10-12 13 februari 2023, Overtoom 10-H"
                "description": description
            };
            publication.location = [];
            if (inputRecord.recordData.gzd.originalData.meta.tpmeta.hasOwnProperty("gebiedsmarkering")) {
                if (Array.isArray(inputRecord.recordData.gzd.originalData.meta.tpmeta.gebiedsmarkering)) {
                    // Process one by one.
                    inputRecord.recordData.gzd.originalData.meta.tpmeta.gebiedsmarkering.forEach(function (gebiedsmarkering) {
                        processCoordinate(publication.location, gebiedsmarkering);
                    });
                } else {
                    // Process one.
                    processCoordinate(publication.location, inputRecord.recordData.gzd.originalData.meta.tpmeta.gebiedsmarkering);
                }
            }
            appState.publicationsArray.push(publication);
        }

        if (responseJson.searchRetrieveResponse.numberOfRecords === 0) {
            // Nothing to do.
            return false;
        }
        if (!responseJson.searchRetrieveResponse.hasOwnProperty("records")) {
            console.error("Unexpected malformed searchRetrieveResponse loaded: " + JSON.stringify(responseJson, null, 4));
            return false;
        }
        if (responseJson.searchRetrieveResponse.numberOfRecords === 1) {
            // Somehow this is not an array when there is only one.
            addPublication(responseJson.searchRetrieveResponse.records.record);
        } else {
            responseJson.searchRetrieveResponse.records.record.forEach(addPublication);
        }
        appState.publicationsArray.sort(sortPublications);
        return true;
    }

    /**
     * Hide the active municipality marker, since this overlaps the licenses.
     * @return {void}
     */
    function hideActiveMunicipalityMarker() {
        appState.municipalityMarkers.forEach(function (markerObject) {
            if (markerObject.municipalityName === appState.activeMunicipality) {
                setMarkerVisibility(markerObject.marker, false);
            }
        });
    }

    /**
     * Show or hide the loading indicator.
     * @param {string} visibility Change visibility. Options: "show", or "hide".
     * @return {void}
     */
    function setLoadingIndicatorVisibility(visibility) {
        if (visibility === "show") {
            // Show loading indicator
            appState.loadingIndicator.style.display = "block";
        } else {
            // Hide loading indicator - don't use style.visibility = "hidden", because then it keeps occupying space and prevents clicking on the map.
            appState.loadingIndicator.style.display = "none";
        }
    }

    /**
     * Download json from the Github Live Pages.
     * @param {string} path Path and file name to retrieve.
     * @param {function} callback Function when request is successful.
     * @return {void}
     */
    function getData(path, callback) {
        const host = "https://basgroot.github.io";
        const url = host + path;
        console.log("Loading file " + url + "..");
        fetch(url, {"method": "GET"}).then(function (response) {
            if (response.ok) {
                response.json().then(callback);
            } else {
                console.error(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    /**
     * Open an historical file, where data is stored per month.
     * @param {string} period Month to display.
     * @return {void}
     */
    function loadHistory(period, isNewRequest) {
        const lookupMunicipality = (
            appState.municipalities[appState.activeMunicipality].hasOwnProperty("lookupName")
            ? appState.municipalities[appState.activeMunicipality].lookupName
            : appState.activeMunicipality
        );
        const periodArray = period.split("-");
        if (periodArray.length !== 2) {
            throw new Error("Invalid period: " + period);
        }
        const url = "/bekendmakingen/history/" + periodArray[0] + "/" + encodeURIComponent(lookupMunicipality.toLowerCase().replace(/\s/g, "-")) + "-" + period + ".json";
        if (isNewRequest) {
            setLoadingIndicatorVisibility("show");
            clearMarkers(appState.activeMunicipality);
        }
        console.log("Loading historical data of municipality " + appState.activeMunicipality);
        getData(url, function (responseJson) {
            let startRecord = 1;
            // Preprocess data:
            responseJson.publications.forEach(function (publication) {
                publication.date = new Date(publication.date);
            });
            if (isNewRequest) {
                // This is a request for an historic month:
                if (!appState.isHistoryActive) {
                    if (appState.isFullyLoaded) {
                        // Make a backup, for when the time filter is reset
                        appState.publicationsArrayBackup = [].concat(appState.publicationsArray);
                        console.log("Backup created");
                    }
                    appState.isHistoryActive = true;
                }
                appState.publicationsArray = responseJson.publications;
            } else {
                // This is a request to add some history to the current view:
                startRecord = appState.publicationsArray.length + 1;
                // Delete the publications older than 6 weeks:
                const publicationIndex = responseJson.publications.findIndex(function (publication) {
                    return publication.date < appState.requestPeriod.startDate;
                });
                if (publicationIndex >= 0) {
                    console.log("Deleting " + (responseJson.publications.length - publicationIndex) + " historical items from before " + appState.requestPeriod.startDate.toDateString());
                    responseJson.publications = responseJson.publications.slice(0, publicationIndex - 1);
                }
                appState.publicationsArray = appState.publicationsArray.concat(responseJson.publications);
                appState.isFullyLoaded = true;
            }
            addMarkers(startRecord, false);
        });
    }

    /**
     * Call the API to get live data.
     * @param {string} municipality Municipality to load.
     * @param {number} startRecord Start of batch.
     * @return {void}
     */
    function loadDataForMunicipality(municipality, startRecord) {
        const lookupMunicipality = (
            appState.municipalities[municipality].hasOwnProperty("lookupName")
            ? appState.municipalities[municipality].lookupName
            : municipality
        );
        setLoadingIndicatorVisibility("show");
        fetch(
            // Example: https://repository.overheid.nl/sru?query=c.product-area==officielepublicaties%20AND%20dt.modified%3E=2025-05-01%20AND%20dt.creator=%22Amsterdam%22%20sortBy%20dt.modified%20/sort.descending&maximumRecords=1000&startRecord=1&httpAccept=application/json
            "https://repository.overheid.nl/sru?query=c.product-area==officielepublicaties%20AND%20dt.modified%3E=" + appState.requestPeriod.startDateString + "%20AND%20dt.creator=%22" + encodeURIComponent(lookupMunicipality) + "%22%20sortBy%20dt.modified%20/sort.descending&maximumRecords=500&startRecord=" + startRecord + "&httpAccept=application/json",
            {
                "method": "GET"
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    let isMoreDataAvailable;
                    if (municipality !== appState.activeMunicipality || appState.isHistoryActive) {
                        // We are loading a municipality, but user selected another one.
                        return;
                    }
                    if (startRecord === 1) {
                        appState.publicationsArray = [];
                        // Hide active municipality:
                        hideActiveMunicipalityMarker();
                    }
                    if (addPublications(responseJson)) {
                        console.log("Found " + responseJson.searchRetrieveResponse.records.record.length + " bekendmakingen of " + responseJson.searchRetrieveResponse.numberOfRecords + " in " + municipality);
                    } else {
                        console.log("No new bekendmakingen found in " + municipality);
                    }
                    isMoreDataAvailable = responseJson.searchRetrieveResponse.hasOwnProperty("nextRecordPosition");
                    if (isMoreDataAvailable) {
                        // Add next page:
                        console.log("Loading next page..");
                        loadDataForMunicipality(municipality, responseJson.searchRetrieveResponse.nextRecordPosition);
                    } else if (appState.requestPeriod.hasOwnProperty("historyFile")) {
                        // Load historical data and append that:
                        console.log("Adding historical file " + appState.requestPeriod.historyFile + " to complete the overview");
                        loadHistory(appState.requestPeriod.historyFile, false);
                    } else {
                        console.log("Data retrieval complete");
                        appState.isFullyLoaded = true;
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

    /**
     * Clear markers, because of a different period, or municipality. This is done when the municipality is changed.
     * @param {string} municipalityToHide Municipality to show licenses from. Empty string to show all.
     * @return {void}
     */
    function clearMarkers(municipalityToHide) {
        // https://developers.google.com/maps/documentation/javascript/markers#remove
        appState.markersArray.forEach(function (markerObject) {
            markerObject.marker.setMap(null);
        });
        appState.municipalityMarkers.forEach(function (markerObject) {
            setMarkerVisibility(markerObject.marker, markerObject.municipalityName !== municipalityToHide);
        });
        appState.markersArray = [];
        appState.delayedMarkersArray = [];
    }

    /**
     * Populate the map with markers. This is done when the municipality is changed. Or when the time filter is changed. Or when the map is scrolled.
     * @param {boolean} isNavigationNeeded Move to different center. This is done when the municipality is changed.
     * @return {void}
     */
    function loadData(isNavigationNeeded) {
        const municipalityComboElm = document.getElementById("idCbxMunicipality");
        const periodFilter = getPeriodFilter();
        if (municipalityComboElm !== null) {
            appState.activeMunicipality = municipalityComboElm.value;
            clearMarkers("");
            if (isNavigationNeeded) {
                console.log("Navigating to " + appState.activeMunicipality);
                navigateTo(appState.activeMunicipality);
            }
            if (appState.isHistoryActive) {
                appState.isHistoryActive = false;
                periodFilter.elm.value = "14d";
            }
        }
        appState.isFullyLoaded = false;
        loadDataForMunicipality(appState.activeMunicipality, 1);
    }

    function init() {
        getData("/bekendmakingen/periods.json", function (periodsJson) {
            appState.periods = periodsJson.periods;
            getData("/bekendmakingen/municipalities.json", function (municipalitiesJson) {
                // Source: https://organisaties.overheid.nl/Gemeenten/
                appState.municipalities = municipalitiesJson;
                getLocationAndLoadData();
            });
        });
    }

    init();
}
