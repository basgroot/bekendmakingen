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
        // The initial period to show:
        "initialPeriod": "14d",
        // The marker objects of the municipalities:
        "municipalityMarkers": [],
        // The list with markers on the map:
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
        // Wait cursor when loading data:
        "loadingIndicator": document.createElement("img"),
        // The info window shown when clicking on a marker:
        "infoWindow": null,
        // Start date of the query and indication if history must be retrieved:
        "requestPeriod": {},
        // License id of the publication whose info-window is currently open
        // (used to deep-link via ?pub=<licenseId> and to avoid re-opening it):
        "openedPublicationLicenseId": null,
        // True for a brief window after a user gesture (wheel / pointer / key).
        // The zoom-driven period auto-shrink only fires when this is true, so
        // programmatic zoom changes (initial map load, panTo for permalink,
        // history.replaceState navigation) do NOT clobber ?period=.
        "isUserZooming": false,
        // Timeout id for clearing isUserZooming.
        "userZoomingTimeout": null
    };

    /**
     * Find the municipality by name, case insensitive. This must match: ?in=beverwijk
     * @param {string} municipalityName
     * @returns {string|boolean} Municipality key or false if not found.
     */
    function getMunicipalityFromUrl(municipalityName) {
        if (!municipalityName) {
            return false;
        }
        const municipalityToFind = municipalityName.toLowerCase();
        let foundMunicipality = false;
        Object.keys(appState.municipalities).forEach(function (municipalityKey) {
            if (municipalityKey.toLowerCase() === municipalityToFind) {
                foundMunicipality = municipalityKey;
            }
        });
        return foundMunicipality;
    }

    /**
     * Customize the map based on query parameters.
     * Examples:
     *   ?in=Hoorn&zoom=15.67&center=52.66031%2C5.06090
     *   ?in=Oostzaan
     * @return {!Object} Map settings.
     */
    function getInitialMapSettings() {
        let zoomLevel = appState.initialZoomLevel;
        let center = Object.assign({}, appState.municipalities[appState.activeMunicipality].center); // Create new copy
        let lat;
        let lng;
        if (globalThis.URLSearchParams) {
            const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
            let zoomParam = urlSearchParams.get("zoom");
            let centerParam = urlSearchParams.get("center");
            const municipalityParam = getMunicipalityFromUrl(urlSearchParams.get("in"));
            if (municipalityParam) {
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
            updateUrlForLocation(zoomLevel, new google.maps.LatLng(center.lat, center.lng));
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
     * @param {string} title Title (plain text).
     * @param {string} description Description (plain text).
     * @param {string} urlDoc Link to the official publication.
     * @param {?string} licenseId License id, or null when there is no detail
     * @return {void}
     */
    function showInfoWindow(marker, iconName, title, description, urlDoc, licenseId) {
        let map;
        const container = document.createElement("div");

        const img = document.createElement("img");
        img.src = "img/" + iconName + ".svg";
        img.width = 105;
        img.height = 135;
        img.className = "info_window_image";
        img.alt = "";
        container.appendChild(img);

        const heading = document.createElement("h2");
        heading.className = "info_window_heading";
        heading.textContent = title;
        container.appendChild(heading);

        const body = document.createElement("div");
        body.className = "info_window_body";

        // Placeholder element that parseBekendmaking() locates via getElementById
        // and fills with the bezwaartermijn details. Setting .id as a property
        // is safe regardless of what characters licenseId contains.
        if (licenseId !== null) {
            const placeholder = document.createElement("div");
            placeholder.id = licenseId;
            // Reserve some vertical space (matches previous layout).
            placeholder.appendChild(document.createElement("br"));
            placeholder.appendChild(document.createElement("br"));
            placeholder.appendChild(document.createElement("br"));
            body.appendChild(placeholder);
        }

        const descriptionPara = document.createElement("p");
        descriptionPara.textContent = description;
        body.appendChild(descriptionPara);

        // Only render the link when urlDoc is an http(s) URL. This blocks
        // javascript:, data:, and other scheme-based XSS vectors that would
        // otherwise be executed when the user clicks the link. Parsing via
        // the URL constructor (with location.href as the base) accepts both
        // absolute and protocol-relative/relative forms.
        if (urlDoc) {
            let parsedUrl = null;
            try {
                parsedUrl = new URL(urlDoc, globalThis.location.href);
            } catch (ignore) {
                // parsedUrl remains null
            }
            if (parsedUrl !== null && (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:")) {
                const linkPara = document.createElement("p");
                linkPara.appendChild(document.createTextNode("Meer info: "));
                const link = document.createElement("a");
                link.href = parsedUrl.href;
                // Original code had target="blank" (a named window called "blank")
                // instead of "_blank" (new tab). Use the correct value plus rel
                // attributes that prevent the opened page from accessing this one.
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = parsedUrl.href;
                linkPara.appendChild(link);
                linkPara.appendChild(document.createTextNode("."));
                body.appendChild(linkPara);
            }
        }

        // "Kopieer link" button: copies the current URL (including ?pub=) to
        // the clipboard so the deep link to this info-window can be shared.
        if (licenseId) {
            const copyPara = document.createElement("p");
            const copyButton = document.createElement("button");
            copyButton.type = "button";
            copyButton.className = "info_window_copy_link";
            copyButton.textContent = "Kopieer link";
            copyButton.addEventListener("click", function () {
                // Make sure the URL reflects the currently shown publication
                // before copying (in case the user clicked very quickly).
                updateUrlForPublication(licenseId);
                const url = globalThis.location.href;
                const showCopied = function () {
                    const original = copyButton.textContent;
                    copyButton.textContent = "Gekopieerd";
                    globalThis.setTimeout(function () {
                        copyButton.textContent = original;
                    }, 1500);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(showCopied, function (err) {
                        console.error("Clipboard write failed", err);
                        globalThis.prompt("Kopieer deze link:", url);
                    });
                } else {
                    globalThis.prompt("Kopieer deze link:", url);
                }
            });
            copyPara.appendChild(copyButton);
            body.appendChild(copyPara);
        }

        container.appendChild(body);
        appState.infoWindow.setContent(container);
        // Reflect the currently open publication in the URL, so it can be shared.
        appState.openedPublicationLicenseId = licenseId || null;
        updateUrlForPublication(licenseId || null);
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
        appState.infoWindow.setMap(map); // Workaround for issue with infoWindow not showing in Street View: https://issuetracker.google.com/issues/35828818?pli=1
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
                [
                    '<extref doc="https://www.alkmaar.nl/bestuur-en-organisatie/het-ergens-niet-mee-eens-zijn/bezwaar-en-beroep">website</extref>',
                    "website"
                ], // Alkmaar https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-77888/1/xml/gmb-2023-77888.xml
                ['<extref doc="https://www.alkmaar.nl/direct-regelen/wonen-verhuizen-en-verbouwen/bezwaar-en-beroep">website</extref>', "website"], // Alkmaar https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-23049/1/xml/gmb-2023-23049.xml
                ["<!--Element br verwijderd -->", ""], // Zaanstad https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-77748/1/xml/gmb-2023-77748.xml
                ['<nadruk type="vet">', ""], // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74922/1/xml/gmb-2023-74922.xml
                ['<nadruk type="cur">', ""], // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-577976/1/xml/gmb-2022-577976.xml
                ['<nadruk type="ondlijn">', ""], // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-32648/1/xml/gmb-2023-32648.xml
                ["</nadruk>", ""], // Hoorn
                [" :", ":"] // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-81009/1/xml/gmb-2023-81009.xml
            ];
            let result = value;
            // Remove all double spaces in all forms: Landsmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74508/1/xml/gmb-2023-74508.xml
            result = result.replace(/\s\s+/g, " ");
            tags.forEach(function (tag) {
                result = result.replaceAll(tag[0], tag[1]);
            });
            return result;
        }

        const parser = new globalThis.DOMParser();
        let xmlDoc;
        try {
            xmlDoc = parser.parseFromString(replaceTags(responseXml).toLowerCase(), "text/xml");
        } catch (e) {
            console.error("Error parsing " + responseXml);
            console.error(e);
            return [];
        }
        // gemeenteblad / zakelijke-mededeling / zakelijke-mededeling-tekst / tekst / <al>Verzonden naar aanvrager op: 20-09-2022</al>
        const zakelijkeMededeling = xmlDoc.getElementsByTagName("zakelijke-mededeling-tekst");
        return zakelijkeMededeling.length === 0 ? [] : zakelijkeMededeling[0].querySelectorAll("al,tussenkop"); // Tussenkop is required for Den Haag https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-78971/1/xml/gmb-2023-78971.xml
    }

    /**
     * Calculate the period since the license was granted, to see if it is applicable for formal objection.
     * @param {!Date} date Decision date.
     * @return {number} Number of days passed.
     */
    function getDaysPassed(date) {
        const today = new Date(new Date().toDateString()); // Rounded date
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
            return value
                .replace("januari", "01")
                .replace("februari", "02")
                .replace("maart", "03")
                .replace("april", "04")
                .replace("mei", "05")
                .replace("juni", "06")
                .replace("juli", "07")
                .replace("augustus", "08")
                .replace("september", "09")
                .replace("oktober", "10")
                .replace("november", "11")
                .replace("december", "12");
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
            if (Number.isNaN(parseInt(year, 10)) || Number.isNaN(parseInt(month, 10)) || Number.isNaN(parseInt(day, 10))) {
                console.error("Error parsing date (" + value + ") of license " + publication.urlApi);
                return result;
            }
            const datumBekendgemaakt = new Date(year + "-" + month + "-" + day);
            result.date = new Date(datumBekendgemaakt.toDateString()); // Rounded date
            result.isValid = true;
            return result;
        }

        /**
         * Retrieves the date from the given text value.
         * @param {string} value The text value to extract the date from.
         * @param {boolean} isNextValueBekendmakingsDate Whether the previous
         *     text node was the "datum bekendmaking besluit:" marker, meaning
         *     the current value should be interpreted as that date (Den Haag).
         * @return {!Object} Object with parsed date (when isValid is true) and
         *     the updated isNextValueBekendmakingsDate flag for the next call.
         */
        function getDateFromText(value, isNextValueBekendmakingsDate) {
            const identifier = "@@@";
            const identifiersStart = [
                "verzonden naar aanvrager op: ",
                "de gemeente heeft op ",
                "de gemeente opmeer heeft op ", // Opmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-79622/1/xml/gmb-2023-79622.xml
                "besluit verzonden: ", // Zaandam https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-580371/1/xml/gmb-2022-580371.xml
                "besluitdatum: ", // Landsmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74508/1/xml/gmb-2023-74508.xml
                "gemeente amstelveen heeft op ", // Amstelveen https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-95322/1/xml/gmb-2023-95322.xml
                "verzonden op: ", // Dijk en Waard https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-85385/1/xml/gmb-2023-85385.xml
                "(verzonden ", // Waterland https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-67428/1/xml/gmb-2023-67428.xml
                "verzonden ", // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-86314/1/xml/gmb-2023-86314.xml
                "verleende omgevingsvergunning is verzonden op ", // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-84721/1/xml/gmb-2023-84721.xml
                "verleende omgevingsvergunning is verzonden ", // Hoorn https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-29091/1/xml/gmb-2023-29091.xml
                "verzenddatum besluit: ", // Koggenland https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-68991/1/xml/gmb-2023-68991.xml
                "verzenddatum: ", // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-2603/1/xml/gmb-2023-2603.xml
                "verzendatum: ", // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-59281/1/xml/gmb-2023-59281.xml
                "bekendmakingsdatum: ", // Heemskerk https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-67866/1/xml/gmb-2023-67866.xml
                "datum besluit: ", // Edam-Volendam https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-74723/1/xml/gmb-2023-74723.xml
                "datum verzending besluit: ", // Almere https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-31954/1/xml/gmb-2023-31954.xml
                "de burgemeester van den helder maakt bekend, dat hij op " // Den Helder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-20399/1/xml/gmb-2023-20399.xml
            ];
            const identifiersStartWithObjectionStart = [
                "de termijn voor het indienen van een bezwaar start op " // Gouda https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-37420/1/xml/gmb-2023-37420.xml
            ];
            const identifiersWithDeadline = [
                "als u het niet eens bent met dit besluit dan kunt u binnen zes weken na de verzenddatum bezwaar maken. op onze website kunt u lezen hoe u online of per post uw bezwaar kunt indienen. uw bezwaarschrift moet vóór ", // Alkmaar
                "u kunt het college van de gemeente heemstede tot en met ", // Heemstede https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-77700/1/xml/gmb-2023-77700.xml
                "u kunt de gemeente tot " // Dijk en Waard https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-76678/1/xml/gmb-2023-76678.xml
            ];
            const identifiersMiddle = [
                " het besluit is verzonden op ", // Bloemendaal https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-94061/1/xml/gmb-2023-94061.xml
                " (verzonden ", // Texel
                ", verzonden ", // Haarlem https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-31494/1/xml/gmb-2023-31494.xml
                ", verzenddatum ", // Bergen NH https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-76348/1/xml/gmb-2023-76348.xml
                " (verzenddatum ", // Groningen https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-79536/1/xml/gmb-2023-79536.xml
                ", verleend op ", // Beverwijk https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-81123/1/xml/gmb-2023-81123.xml
                " (datum besluit ", // Rotterdam https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-92486/1/xml/gmb-2023-92486.xml
                "de termijn voor het indienen van een bezwaarschrift start op " // Aalsmeer https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-63996/1/xml/gmb-2023-63996.xml
            ];
            const identifiersAfter = [
                " is een omgevingsvergunning verleend" // Noordoostpolder https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-93843/1/xml/gmb-2023-93843.xml
            ];
            const identifierNextValueIsDate = "datum bekendmaking besluit:"; // Den Haag https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-79557/1/xml/gmb-2023-79557.xml
            let i;
            let pos;
            let isDateOfDeadline = false;
            let isObjectionStartDate = false;
            let result;
            if (value === identifierNextValueIsDate) {
                // Marker text only - the actual date is in the next text node.
                // Skip the rest of the identifier matching since none can match
                // the marker itself.
                return {
                    "isValid": false,
                    "isNextValueBekendmakingsDate": true
                };
            }
            value = convertMonthNames(value);
            if (isNextValueBekendmakingsDate === true) {
                value = identifier + value;
            }
            isNextValueBekendmakingsDate = false;
            // If not found, try the regular way of publishing:
            if (!value.startsWith(identifier)) {
                for (i = 0; i < identifiersStart.length; i += 1) {
                    if (value.startsWith(identifiersStart[i])) {
                        value = value.replace(identifiersStart[i], identifier);
                        break;
                    }
                }
            }
            // If not found, try the regular way of publishing objection start date:
            if (!value.startsWith(identifier)) {
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
            if (!value.startsWith(identifier)) {
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
            if (!value.startsWith(identifier)) {
                for (i = 0; i < identifiersWithDeadline.length; i += 1) {
                    if (value.startsWith(identifiersWithDeadline[i])) {
                        value = value.replace(identifiersWithDeadline[i], identifier);
                        isDateOfDeadline = true;
                        break;
                    }
                }
            }
            // If not found, try the Texel way of publishing:
            if (!value.startsWith(identifier)) {
                // Velsen repeats part of title (Zeeweg 343, interne constructiewijziging (07/02/2022) 143528-2022):
                identifiersMiddle.push(publication.title.substring(publication.title.length - 4).toLowerCase() + " ("); // Velsen https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-69953/1/xml/gmb-2023-69953.xml
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
            if (value.startsWith(identifier)) {
                value = value.substring(identifier.length);
                if (value.substring(1, 2) === " " || value.substring(1, 2) === "-") {
                    value = "0" + value;
                }
                // Remove time from dates:
                result = parseDate(value);
                if (result.isValid) {
                    if (isDateOfDeadline) {
                        // This is the last date you can object to a decision. Extract 6 weeks.
                        result.date.setDate(result.date.getDate() - 7 * 6);
                    } else if (isObjectionStartDate) {
                        result.date.setDate(result.date.getDate() - 1); // Objection period starts one day after date 'verzonden'
                    }
                    result.isNextValueBekendmakingsDate = isNextValueBekendmakingsDate;
                    return result;
                }
            }
            return {
                "isValid": false,
                "isNextValueBekendmakingsDate": isNextValueBekendmakingsDate
            };
        }

        const alineas = getAlineas(responseXml);
        const maxLooptijd = 6 * 7 + 1; // 6 weken de tijd om bezwaar te maken
        const dateFormatOptions = { "weekday": "long", "year": "numeric", "month": "long", "day": "numeric" };
        let datumBekendgemaakt; // Datum verzonden aan belanghebbende(n)
        let looptijd;
        let resterendAantalDagenBezwaartermijn;
        let i;
        let j;
        let alinea;
        let textToShow = "";
        let textToShowBold = "";
        let isNextValueBekendmakingsDate = false;
        let isBezwaartermijnFound = false;
        for (i = 0; i < alineas.length; i += 1) {
            alinea = alineas[i];
            if (alinea.childNodes.length > 0) {
                for (j = 0; j < alinea.childNodes.length; j += 1) {
                    if (alinea.childNodes[j].nodeName === "#text") {
                        datumBekendgemaakt = getDateFromText(alinea.childNodes[j].nodeValue.trim(), isNextValueBekendmakingsDate);
                        isNextValueBekendmakingsDate = datumBekendgemaakt.isNextValueBekendmakingsDate;
                        if (datumBekendgemaakt.isValid) {
                            isBezwaartermijnFound = true;
                            looptijd = getDaysPassed(datumBekendgemaakt.date);
                            resterendAantalDagenBezwaartermijn = maxLooptijd - looptijd;
                            textToShow =
                                "Gepubliceerd: " +
                                publication.date.toLocaleDateString("nl-NL", dateFormatOptions) +
                                ".\nBekendgemaakt aan belanghebbende: " +
                                datumBekendgemaakt.date.toLocaleDateString("nl-NL", dateFormatOptions) +
                                ".";
                            textToShowBold =
                                resterendAantalDagenBezwaartermijn > 0 ?
                                    "Resterend aantal dagen voor bezwaar: " + resterendAantalDagenBezwaartermijn + "."
                                :   "Geen bezwaar meer mogelijk.";
                        }
                        break;
                    }
                }
            }
        }
        if (!isBezwaartermijnFound) {
            textToShow = "Gepubliceerd: " + publication.date.toLocaleDateString("nl-NL", dateFormatOptions) + ".";
        }
        const licenseIdElm = document.getElementById(licenseId);
        if (licenseIdElm !== null) {
            licenseIdElm.textContent = "";
            const textNode = document.createTextNode(textToShow);
            licenseIdElm.appendChild(textNode);
            if (textToShowBold) {
                licenseIdElm.appendChild(document.createElement("br"));
                const bold = document.createElement("b");
                bold.textContent = textToShowBold;
                licenseIdElm.appendChild(bold);
            }
            licenseIdElm.appendChild(document.createElement("br"));
            licenseIdElm.appendChild(document.createElement("br"));
        }
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
        console.debug("Retrieving " + publication.urlApi + "..");
        fetch(publication.urlApi, {
            "method": "GET"
        })
            .then(function (response) {
                if (response.ok) {
                    response.text().then(function (xml) {
                        parseBekendmaking(xml, publication, licenseId);
                    });
                } else {
                    console.error(response);
                }
            })
            .catch(function (error) {
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
        const controlDiv = document.createElement("div"); // Create a DIV to attach the control UI to the Map.
        controlDiv.appendChild(appState.loadingIndicator);
        appState.map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(controlDiv);
    }

    /**
     * Create the drop down with all municipalities of The Netherlands.
     * Uses an input + datalist so the user can type to filter the list.
     * @return {void}
     */
    function createMapsControlMunicipalities() {
        const controlDiv = document.createElement("div"); // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("input");
        const datalist = document.createElement("datalist");
        const municipalityNames = Object.keys(appState.municipalities);
        const datalistId = "idDlMunicipality";
        combobox.id = "idCbxMunicipality";
        combobox.title = "Gemeente selecteren";
        combobox.type = "text";
        combobox.setAttribute("list", datalistId);
        combobox.setAttribute("autocomplete", "off");
        combobox.setAttribute("spellcheck", "false");
        combobox.placeholder = "Zoek gemeente\u2026";
        combobox.value = appState.activeMunicipality;
        datalist.id = datalistId;
        municipalityNames.forEach(function (municipalityName) {
            const option = document.createElement("option");
            option.value = municipalityName;
            datalist.appendChild(option);
        });
        combobox.addEventListener("change", function () {
            // Only act on a valid municipality; otherwise revert.
            if (appState.municipalities[combobox.value] === undefined) {
                combobox.value = appState.activeMunicipality;
            } else {
                loadData(true);
            }
        });
        // Clear the field on focus so the full list is shown again (Chrome/Edge).
        combobox.addEventListener("focus", function () {
            combobox.dataset.previousValue = combobox.value;
            combobox.value = "";
        });
        combobox.addEventListener("blur", function () {
            if (combobox.value === "" || appState.municipalities[combobox.value] === undefined) {
                combobox.value = combobox.dataset.previousValue || appState.activeMunicipality;
            }
        });
        combobox.classList.add("controlStyle");
        combobox.classList.add("municipalityCombo");
        controlDiv.appendChild(combobox);
        controlDiv.appendChild(datalist);
        appState.map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
    }

    /**
     * Create the drop down with time filter. This is shown in the bottom center.
     * @return {void}
     */
    function createMapsControlPeriods() {
        /**
         * Get the period to select based on the URL parameter or the default value.
         * @return {string} Period key.
         */
        function getPeriodToSelect() {
            if (globalThis.URLSearchParams) {
                const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
                let periodParam = urlSearchParams.get("period");
                if (periodParam) {
                    // Verify if the period is valid:
                    const periodKeys = appState.periods.map(function (period) {
                        return period.key;
                    });
                    if (periodKeys.includes(periodParam)) {
                        appState.initialPeriod = periodParam;
                        console.log("Adjusted period from URL: " + periodParam);
                    } else {
                        updateUrlForPeriod(appState.initialPeriod);
                        console.error("Invalid period in URL");
                    }
                }
            }
            return appState.initialPeriod;
        }

        // Get the period from the URL parameter or default to 2weeks:
        let selectedPeriod = getPeriodToSelect();

        const controlDiv = document.createElement("div"); // Create a DIV to attach the control UI to the Map.
        const combobox = document.createElement("select");
        combobox.id = "idCbxPeriod";
        combobox.title = "Periode van de bekendmaking selecteren";
        appState.periods.forEach(function (period) {
            combobox.add(createOption(period.key, period.val, selectedPeriod));
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
        const controlDiv = document.createElement("div"); // Create a DIV to attach the control UI to the Map.
        const button = document.createElement("button");
        button.id = "idBtnSource";
        button.textContent = "Broncode";
        button.title = "Source op GitHub bekijken";
        button.type = "button";
        button.addEventListener("click", function () {
            const url = "https://github.com/basgroot/bekendmakingen";
            if (globalThis.open(url) === null) {
                // Popup blocker or something preventing a new tab
                globalThis.location.href = url;
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
        const exploitatievergunningen = ["brandveilig gebruik"];
        const milieuvergunningen = ["milieu", "natuur"];
        const verkeersvergunningen = ["uitweg en inrit"];
        const bouwvergunningen = ["bouwen", "slopen"];
        title = title.toLowerCase();
        if (title.includes("aanvraag") || title.includes("verlenging")) {
            return "aanvraag"; // Halfwitty, CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0, via Wikimedia Commons
        }
        if (exploitatievergunningen.includes(type) || title.includes("exploitatievergunning") || title.includes("alcoholwetvergunning")) {
            return "bar";
        }
        if (title.includes("evenement") || title.includes("loterij")) {
            return "evenement";
        }
        if (title.includes("bed & breakfast") || title.includes("vakantieverhuur")) {
            return "hotel";
        }
        if (type === "kappen" || title.includes("houtopstand") || title.includes("(kap)")) {
            return "boomkap";
        }
        if (title.includes("oplaadplaats") || title.includes("opladen") || title.includes("laadpaal")) {
            return "laadpaal";
        }
        if (title.includes("apv vergunning") || title.includes("parkeervakken") || title.includes("tvm")) {
            // Verify this after 'laadpaal':
            return "tvm";
        }
        if (verkeersvergunningen.includes(type)) {
            // Verify this after 'parkeervakken/tvm':
            return "verkeer";
        }
        if (title.includes("onttrekkingsvergunning") || title.includes("omzettingsvergunning")) {
            return "kamerverhuur"; // EpicPupper, CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0, via Wikimedia Commons
        }
        if (title.includes("water")) {
            return "boot"; // Barbetorte, CC BY-SA 3.0 https://creativecommons.org/licenses/by-sa/3.0, via Wikimedia Commons
        }
        if (type === "reclame") {
            return "reclame"; // Verdy_p (complete construction and vectorisation, based on mathematical properties of the symbol, and not drawn manually, and then manually edited without using any SVG editor)., Public domain, via Wikimedia Commons
        }
        if (milieuvergunningen.includes(type)) {
            return "milieu";
        }
        if (bouwvergunningen.includes(type)) {
            return "constructie";
        }
        return "wetboek"; // By No machine-readable author provided. Chris-martin assumed (based on copyright claims). Own work assumed (based on copyright claims)., CC BY-SA 3.0, https://commons.wikimedia.org/w/index.php?curid=1010176
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
            let isAvailable = true; // Be positive
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
            if (isAvailable) {
                // Off-screen markers are queued in delayedMarkersArray with
                // their already-resolved positions; they must also count as
                // occupied so that further publications at the same base
                // coordinate get fanned out instead of stacking on top.
                for (i = 0; i < appState.delayedMarkersArray.length; i += 1) {
                    marker = appState.delayedMarkersArray[i];
                    if (marker.position.lat === coordinate.lat && marker.position.lng === coordinate.lng) {
                        isAvailable = false;
                        break;
                    }
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
        // Pigeonhole bound: along a strictly monotonic shift sequence, an
        // unoccupied coordinate must be reached within
        // markersArray.length + delayedMarkersArray.length + 1 iterations.
        // The +1 covers the initial check at the proposed point.
        const maxIterations = appState.markersArray.length + appState.delayedMarkersArray.length + 1;
        let iterations = 0;
        while (!isCoordinateAvailable(destinationCoordinate)) {
            destinationCoordinate.lat = destinationCoordinate.lat + latShift;
            destinationCoordinate.lng = destinationCoordinate.lng + lngShift;
            iterations += 1;
            if (iterations > maxIterations) {
                // Defensive guard: should be unreachable given the pigeonhole
                // bound above. Log and return the current shifted position
                // rather than hanging the UI.
                console.error("findUniquePosition exceeded " + maxIterations + " iterations; returning shifted coordinate.");
                break;
            }
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
     * @param {number} width Width of the image.
     * @param {number} height Height of the image.
     * @param {string=} label Optional label.
     * @return {!HTMLDivElement} Marker node containing the image.
     */
    function createMarkerIcon(sourceUrl, width, height, label) {
        const iconContainer = document.createElement("div");
        const icon = document.createElement("img");
        icon.src = sourceUrl;
        icon.width = width;
        icon.height = height;
        icon.alt = "";
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
                showInfoWindow(marker, iconName, publication.title, publication.description, publication.urlDoc, null);
            } else {
                showInfoWindow(marker, iconName, publication.title, publication.description, publication.urlDoc, licenseId);
                collectBezwaartermijn(licenseId, publication);
            }
        }

        /**
         * Handles the hover event. Highlight the icon (and related icons) on hover.
         */
        function handleMarkerMouseOver() {
            appState.markersArray.forEach(function (markerObject) {
                if (markerObject.url === publication.urlDoc) {
                    markerObject.marker.content.getElementsByTagName("img")[0].src = "img/" + iconName + "-highlight.png";
                }
            });
        }

        /**
         * Handles the mouse out event. Remove the highlight.
         */
        function handleMarkerMouseOut() {
            appState.markersArray.forEach(function (markerObject) {
                if (markerObject.url === publication.urlDoc) {
                    markerObject.marker.content.getElementsByTagName("img")[0].src = "img/" + iconName + ".png";
                }
            });
        }

        // 2022-09-05T09:04:57.175Z;
        // https://zoek.officielebekendmakingen.nl/gmb-2022-396401.html;
        // "Besluit apv vergunning Verleend Monnikendammerweg 27";
        // "TVM- 7 PV reserveren - Monnikendammerweg 27-37 - 03-07/10/2022, Monnikendammerweg 27";
        // 125171;
        // 488983
        // https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerElementOptions
        const age = getDaysPassed(publication.date);
        const iconName = getIconName(publication.title, publication.type);
        // Use the publication's modification date (in Unix seconds) as zIndex so
        // that newer markers are always on top of older ones, regardless of when
        // they happen to be added (e.g. delayed off-screen markers added later
        // via the "idle" handler, or historical data appended after live data).
        // Unix seconds (~1.77e9 in 2026) fit comfortably within 32-bit int range.
        const markerZIndex = Math.floor(publication.date.getTime() / 1000);
        const marker = new AdvancedMarkerElement({
            "map": isMarkerVisible(age, periodToShow) ? appState.map : null,
            "position": position,
            "content": createMarkerIcon("img/" + iconName + ".png", 35, 45),
            "zIndex": markerZIndex,
            "title": publication.title
        });
        const markerObject = {
            "url": publication.urlDoc,
            "age": age,
            "position": position,
            "isSvg": true,
            "marker": marker
        };
        appState.markersArray.push(markerObject);
        marker.addListener("gmp-click", onClick);
        // Highlight the icon (and related icons) on hover
        marker.content.addEventListener("mouseover", handleMarkerMouseOver);
        marker.content.addEventListener("mouseout", handleMarkerMouseOut);
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
         * Checks if a value represents a historical period. Historical periods are noted like '2023-11'.
         * @param {string} value The value to check.
         * @return {boolean} Returns true if the value represents a historical period, otherwise returns false.
         */
        function isHistoricalPeriod(value) {
            // Values of historical periods are notated like '2023-03'
            return value.length === 7 && value.substring(4, 5) === "-";
        }

        const periodElm = document.getElementById("idCbxPeriod");
        // Fall back to appState.initialPeriod when the combobox is not yet
        // in the DOM. The period control is added via map.controls.push(),
        // which is asynchronous, so during the initial loadData(true) call
        // the combobox can still be missing - without this fallback we'd
        // default to "14d" and a historical view (e.g. ?period=2022-10)
        // would render every marker invisible because the publications are
        // far older than 14 days.
        const activePeriod = periodElm === null ? appState.initialPeriod : periodElm.value;
        const result = {
            "elm": periodElm,
            "period": activePeriod,
            "periodToShow": activePeriod,
            "isHistory": false
        };
        if (isHistoricalPeriod(activePeriod)) {
            result.periodToShow = "all";
            result.isHistory = true;
        }
        return result;
    }

    /**
     * Create (new) latitude/longitude object.
     * @param {string} locatiepunt Latitude/longitude. Input example: "52.35933 4.893097".
     * @return {?Object} Coordinate, or null when input cannot be parsed to two finite numbers.
     */
    function createCoordinate(locatiepunt) {
        // Tolerate "lat lng", "lat,lng", or any mix of whitespace/comma separators.
        const coordinate = String(locatiepunt)
            .split(/[\s,]+/)
            .filter(Boolean);
        const lat = parseFloat(coordinate[0]);
        const lng = parseFloat(coordinate[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            console.warn("createCoordinate: unparseable locatiepunt " + JSON.stringify(locatiepunt));
            return null;
        }
        return {
            "lat": lat,
            "lng": lng
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
                        const baseCoordinate = createCoordinate(locatiepunt);
                        if (baseCoordinate === null) {
                            console.warn(
                                "addMarkers: skipping publication " +
                                    (publication.urlDoc || publication.id || "?") +
                                    " due to unparseable location " +
                                    JSON.stringify(locatiepunt)
                            );
                            return;
                        }
                        position = findUniquePosition(baseCoordinate);
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
            tryOpenPublicationFromUrl();
        }
    }

    /**
     * If the URL contains ?pub=<licenseId>, locate the matching marker and
     * synthesize a click on it so the deep-linked info-window opens.
     * Idempotent: does nothing if no parameter is present or no match is found.
     * @return {void}
     */
    function tryOpenPublicationFromUrl() {
        if (!globalThis.URLSearchParams) {
            return;
        }
        const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
        const wantedLicenseId = urlSearchParams.get("pub");
        if (!wantedLicenseId) {
            return;
        }
        if (appState.openedPublicationLicenseId === wantedLicenseId) {
            return; // Already open
        }
        // 1. Look on the map first (markers currently rendered).
        const match = appState.markersArray.find(function (markerObject) {
            return getLicenseIdFromUrl(markerObject.url) === wantedLicenseId;
        });
        if (match) {
            console.log("Opening info-window for ?pub=" + wantedLicenseId);
            appState.openedPublicationLicenseId = wantedLicenseId;
            google.maps.event.trigger(match.marker, "gmp-click");
            return;
        }
        // 2. Not yet on the map: maybe it's in the delayed (off-screen) queue.
        //    Pan to its position so the "idle" handler will materialize it,
        //    then we run again on the next addMarkers/idle cycle.
        const delayed = appState.delayedMarkersArray.find(function (item) {
            return getLicenseIdFromUrl(item.publication.urlDoc) === wantedLicenseId;
        });
        if (delayed) {
            console.log("Panning to off-screen ?pub=" + wantedLicenseId);
            appState.map.panTo(delayed.position);
            return;
        }
        console.log("No marker (yet) for ?pub=" + wantedLicenseId);
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
                "map": municipalityName === appState.activeMunicipality ? null : appState.map,
                "position": municipalityObject.center,
                "content": createMarkerIcon("img/gemeente.png", 50, 61, municipalityName),
                "title": municipalityName
            });
            appState.municipalityMarkers.push({
                "municipalityName": municipalityName,
                "marker": marker
            });
            marker.addListener("gmp-click", function () {
                const municipalityComboElm = document.getElementById("idCbxMunicipality");
                if (municipalityComboElm !== null) {
                    municipalityComboElm.value = municipalityName;
                }
                appState.activeMunicipality = municipalityName;
                loadData(true);
            });
        });
    }

    /**
     * Show or hide a marker. This replaces the setVisibility function of the legacy marker element.
     * @param {!Object} marker Marker object.
     * @param {boolean} isVisible Set visibility.
     * @return {void}
     */
    function setMarkerVisibility(marker, isVisible) {
        marker.setMap(isVisible ? appState.map : null);
    }

    /**
     * Reset time filter. This is done when the zoom level is changed, or when a different combo box option is selected.
     * @return {void}
     */
    function updatePeriodFilter() {
        const periodFilter = getPeriodFilter();
        if (periodFilter.isHistory) {
            console.log("Loading historical data of period " + periodFilter.periodToShow);
            loadHistory(periodFilter.period, true);
        } else {
            console.log("Filtering period to " + periodFilter.periodToShow);
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
        updateUrlForPeriod(periodFilter.period);
    }

    /**
     * Add the period parameter to the URL, so the view can be shared.
     * @param {string} period Selected period.
     * @return {void}
     */
    function updateUrlForPeriod(period) {
        if (globalThis.URLSearchParams) {
            const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
            urlSearchParams.set("period", period);
            console.log("Updated URL for period " + period);
            globalThis.history.replaceState(null, "", globalThis.location.pathname + "?" + urlSearchParams.toString());
        }
    }

    /**
     * Add or remove the publication (pub) parameter to the URL, so the deep
     * link to a single info-window can be shared.
     * @param {?string} licenseId License id, or null/false to remove the parameter.
     * @return {void}
     */
    function updateUrlForPublication(licenseId) {
        if (!globalThis.URLSearchParams) {
            return;
        }
        const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
        if (licenseId) {
            if (urlSearchParams.get("pub") === licenseId) {
                return; // No change needed
            }
            urlSearchParams.set("pub", licenseId);
        } else {
            if (!urlSearchParams.has("pub")) {
                return;
            }
            urlSearchParams.delete("pub");
        }
        const search = urlSearchParams.toString();
        globalThis.history.replaceState(null, "", globalThis.location.pathname + (search ? "?" + search : ""));
    }

    /**
     * Add municipality and other parameters to the URL, so the view can be shared.
     * @param {number|string} zoom Zoom level.
     * @param {!Object} center Coordinate of center of map.
     * @return {void}
     */
    function updateUrlForLocation(zoom, center) {
        /**
         * Remove trailing zeros from a number represented as a string.
         * @param {string} value
         * @returns {string} Value without trailing zeros.
         */
        function removeTrailingZeros(value) {
            if (!value.includes(".")) {
                return value; // Prevent removing zeros from integers
            }
            while (value.endsWith("0")) {
                value = value.slice(0, -1);
            }
            if (value.endsWith(".")) {
                value = value.slice(0, -1);
            }
            return value;
        }

        // Add to URL: /?in=Alkmaar&zoom=15.76&center=52.4366,4.8441
        // Round zoom and center to have an accurate, but short URL
        const zoomDecimals = 2;
        const centerDecimals = 5;
        if (globalThis.URLSearchParams) {
            const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
            urlSearchParams.set("in", appState.activeMunicipality);
            // This only works with isFractionalZoomEnabled set to true in the map options
            urlSearchParams.set("zoom", removeTrailingZeros(zoom.toFixed(zoomDecimals)));
            // https://developers.google.com/maps/documentation/javascript/reference/coordinates#LatLng.toUrlValue
            urlSearchParams.set("center", center.toUrlValue(centerDecimals));
            globalThis.history.replaceState(null, "", globalThis.location.pathname + "?" + urlSearchParams.toString());
        }
        document.title = "Bekendmakingen " + appState.activeMunicipality;
        // Update the meta tags for the preview on social media:
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute("content", document.title);
        }
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
            twitterTitle.setAttribute("content", document.title);
        }
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
        const radius = 6371e3; // metres
        const a1 = (from.lat * Math.PI) / 180; // φ1: φ, λ in radians
        const a2 = (to.lat * Math.PI) / 180; // φ2
        const latDelta = ((to.lat - from.lat) * Math.PI) / 180; // Δφ
        const lngDelta = ((to.lng - from.lng) * Math.PI) / 180; // Δλ
        const a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) + Math.cos(a1) * Math.cos(a2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return radius * c; // Distance in meters
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
        if (globalThis.URLSearchParams) {
            const urlSearchParams = new globalThis.URLSearchParams(globalThis.location.search);
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
        const url = "https://basement.nl/proxy-server/location.php";
        console.debug("Retrieving " + url + "..");
        fetch(url, {
            "method": "GET"
        })
            .then(function (response) {
                if (response.ok) {
                    response.json().then(function (responseJson) {
                        if (appState.municipalities[responseJson.city] === undefined) {
                            // Try to locate the closest municipality:
                            activateClosestMunicipality({
                                "lat": responseJson.lat,
                                "lng": responseJson.lng
                            });
                        } else {
                            // Name of the city is the same as the municipality.
                            console.log("Client location in municipality " + responseJson.city);
                            appState.activeMunicipality = responseJson.city;
                        }
                        internalInitMap();
                    });
                } else {
                    console.error(response);
                    internalInitMap();
                }
            })
            .catch(function (error) {
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
            return; // The location is explicitly requested. Don't adapt location based on visitors IP address.
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
            return n > 9 ? String(n) : "0" + n;
        }

        const currentDate = new Date();
        const previousMonth = new Date();
        previousMonth.setDate(0); // Set to last day of previous month
        const previousMonthString = previousMonth.getFullYear() + "-" + addLeadingZero(previousMonth.getMonth() + 1);
        const periodId = appState.periods.findIndex(function (period) {
            return period.key === previousMonthString;
        });
        const WEEKS_BACK = 6;
        appState.requestPeriod.startDate = new Date();
        appState.requestPeriod.startDate.setDate(appState.requestPeriod.startDate.getDate() - WEEKS_BACK * 7);
        if (periodId >= 0) {
            appState.requestPeriod.historyFile = previousMonthString;
            appState.requestPeriod.startDateString = currentDate.getFullYear() + "-" + addLeadingZero(currentDate.getMonth() + 1) + "-" + "01"; // Start of current month, because history is already available in a faster to retrieve format
            console.log("Historical file to add to view: " + appState.requestPeriod.historyFile);
        } else {
            appState.requestPeriod.startDateString =
                appState.requestPeriod.startDate.getFullYear() +
                "-" +
                addLeadingZero(appState.requestPeriod.startDate.getMonth() + 1) +
                "-" +
                addLeadingZero(appState.requestPeriod.startDate.getDate());
        }
        console.log("StartDate: " + appState.requestPeriod.startDateString);
    }

    /**
     * Setup map.
     * @return {void}
     */
    function internalInitMap() {
        /**
         * Close the shared info window.
         * @return {void}
         */
        function closeInfoWindow() {
            appState.infoWindow.close(); // https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.close
            appState.openedPublicationLicenseId = null;
            updateUrlForPublication(null);
        }

        const containerElm = document.getElementById("map");
        const mapSettings = getInitialMapSettings();
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        appState.loadingIndicator.id = "idLoadingIndicator";
        appState.loadingIndicator.style.width = Math.max((screenWidth / 100) * 12, 70) + "px";
        appState.loadingIndicator.src = "img/ajax-loader.gif"; // ConnectedWizard, CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0>, via Wikimedia Commons
        // https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions
        appState.infoWindow = new google.maps.InfoWindow();
        // When the user closes the info-window via the built-in [x], drop the
        // ?pub= parameter from the URL.
        appState.infoWindow.addListener("closeclick", function () {
            appState.openedPublicationLicenseId = null;
            updateUrlForPublication(null);
        });
        // https://developers.google.com/maps/documentation/javascript/overview#MapOptions
        appState.map = new google.maps.Map(containerElm, {
            "backgroundColor": "#9CC0F9", // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.backgroundColor
            "clickableIcons": false, // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.clickableIcons
            "center": new google.maps.LatLng(mapSettings.center.lat, mapSettings.center.lng),
            "mapTypeId": google.maps.MapTypeId.ROADMAP, // https://developers.google.com/maps/documentation/javascript/reference/map#MapTypeId
            "gestureHandling": "greedy", // When scrolling, keep scrolling
            "zoom": mapSettings.zoomLevel,
            "isFractionalZoomEnabled": true, // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.isFractionalZoomEnabled
            // If VECTOR, the map freezes sometimes when a lot of markers are added. RASTER seems more stable.
            "renderingType": google.maps.RenderingType.RASTER, // https://developers.google.com/maps/documentation/javascript/map-rendering-type#rendering-type
            "mapId": "9913fa533c4bf328"
        });
        determineRequestPeriod();
        createMapsControls();
        addMunicipalitiyMarkers();
        // Maps events: https://developers.google.com/maps/documentation/javascript/events
        appState.map.addListener("dragend", closeInfoWindow);
        appState.map.addListener("click", closeInfoWindow);
        // Mark a short window during which any zoom_changed event is
        // attributed to a user gesture. Programmatic zoom changes (initial
        // load, panTo, etc.) happen outside this window and therefore do not
        // trigger the period auto-shrink below.
        const markUserZooming = function () {
            appState.isUserZooming = true;
            if (appState.userZoomingTimeout !== null) {
                globalThis.clearTimeout(appState.userZoomingTimeout);
            }
            appState.userZoomingTimeout = globalThis.setTimeout(function () {
                appState.isUserZooming = false;
                appState.userZoomingTimeout = null;
            }, 750);
        };
        containerElm.addEventListener("wheel", markUserZooming, { "passive": true });
        containerElm.addEventListener("pointerdown", markUserZooming);
        containerElm.addEventListener("dblclick", markUserZooming);
        containerElm.addEventListener("keydown", function (event) {
            // Arrow keys, +, -, PageUp/PageDown all manipulate the map.
            if (
                event.key === "+" ||
                event.key === "-" ||
                event.key === "=" ||
                event.key.startsWith("Arrow") ||
                event.key === "PageUp" ||
                event.key === "PageDown"
            ) {
                markUserZooming();
            }
        });
        appState.map.addListener("zoom_changed", function () {
            // Add to URL: /?zoom=15.81&center=52.43660,4.84418
            const periodFilter = getPeriodFilter();
            const zoom = appState.map.getZoom();
            // Only auto-shrink on user-initiated zoom, not on programmatic
            // zooms (initial load, panTo for permalink, etc.). This keeps
            // ?period=…&pub=… working from a shared link.
            if (!periodFilter.isHistory && appState.isUserZooming) {
                // Iterate over markers and call setVisible
                if (zoom <= 13 && (periodFilter.period === "7d" || periodFilter.period === "14d" || periodFilter.period === "all")) {
                    // Set to 3 days
                    periodFilter.elm.value = "3d";
                    updatePeriodFilter();
                } else if (zoom <= 14 && (periodFilter.period === "14d" || periodFilter.period === "all")) {
                    // Set to 7 days
                    periodFilter.elm.value = "7d";
                    updatePeriodFilter();
                } else if (zoom <= 15 && periodFilter.period === "all") {
                    // Set to 14 days
                    periodFilter.elm.value = "14d";
                    updatePeriodFilter();
                }
            }
            closeInfoWindow();
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
            updateUrlForLocation(appState.map.getZoom(), appState.map.getCenter());
            console.log("Remaining items to add to the map: " + appState.delayedMarkersArray.length);
            // After delayed markers became real markers, retry deep-link.
            tryOpenPublicationFromUrl();
        });
        loadData(true);
        console.log("Using Maps version " + google.maps.version); // https://developers.google.com/maps/documentation/javascript/releases
        console.log("Map renderingType " + appState.map.renderingType);
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
        return (
            "https://repository.overheid.nl/frbr/officielepublicaties/" +
            licenseIdArray[0] +
            "/" +
            licenseIdArray[1] +
            "/" +
            licenseId +
            "/1/xml/" +
            licenseId +
            ".xml"
        );
    }

    /**
     * Parse API response.
     * @param {!Object} responseJson JSON response.
     * @return {boolean} True if records are found.
     */
    function addPublications(responseJson) {
        /**
         * Sort raw API records by modification date (newest first), with title
         * and URL as tiebreakers. Operates on the raw response so the cost is
         * bounded by the page size, not the growing publicationsArray. Don't
         * trust the API's claimed sort order.
         * @param {!Object} a Raw record.
         * @param {!Object} b Raw record.
         * @return {number} Comparison result.
         */
        function sortRecords(a, b) {
            /**
             * Extract the modification-date string from a raw SRU record.
             * @param {!Object} record Raw SRU record.
             * @return {string} ISO-like timestamp string to compare. Empty string when the field is missing.
             */
            function getRawDate(record) {
                const meta = record.recordData.gzd.originalData.meta;
                if (meta.hasOwnProperty("tpmeta") && meta.tpmeta.hasOwnProperty("datumTijdstipWijzigingWork")) {
                    return meta.tpmeta.datumTijdstipWijzigingWork; // ISO-ish string, lexicographically comparable
                }
                return "";
            }

            /**
             * Extract the title from a raw SRU record. Used as a secondary sort key to keep the order stable when two records share the modification date.
             * @param {!Object} record Raw SRU record.
             * @return {string} Title, or empty string when missing.
             */
            function getRawTitle(record) {
                const meta = record.recordData.gzd.originalData.meta;
                if (meta.hasOwnProperty("owmskern") && meta.owmskern.hasOwnProperty("title") && typeof meta.owmskern.title === "string") {
                    return meta.owmskern.title;
                }
                return "";
            }

            /**
             * Extract the canonical URL from a raw SRU record. Used as a tertiary sort key.
             * @param {!Object} record Raw SRU record.
             * @return {string} Preferred URL, or empty string when missing.
             */
            function getRawUrl(record) {
                const enriched = record.recordData.gzd.enrichedData;
                if (enriched.hasOwnProperty("preferredUrl") && typeof enriched.preferredUrl === "string") {
                    return enriched.preferredUrl;
                }
                return "";
            }

            const dateA = getRawDate(a);
            const dateB = getRawDate(b);
            if (dateA !== dateB) {
                return dateA < dateB ? 1 : -1; // Newest first
            }
            return (getRawTitle(a) + getRawUrl(a)).localeCompare(getRawTitle(b) + getRawUrl(b), "nl");
        }

        /**
         * Convert a single raw SRU record into a publication object and append it to appState.publicationsArray.
         * @param {!Object} inputRecord Raw SRU record.
         * @return {void}
         */
        function addPublication(inputRecord) {
            /**
             * Determine the publication type from the record's metadata.
             * Prefers the fine-grained tpmeta.activiteit when present, falls back to the generic owmskern.type, and finally to "onbekend".
             * @param {!Object} meta originalData.meta object.
             * @return {string} Type slug (e.g. "bouwen", "kappen").
             */
            function getType(meta) {
                if (meta.hasOwnProperty("tpmeta") && meta.tpmeta.hasOwnProperty("activiteit")) {
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
                if (meta.hasOwnProperty("owmskern") && meta.owmskern.hasOwnProperty("type")) {
                    return Array.isArray(meta.owmskern.type) ? meta.owmskern.type[0].$.trim() : meta.owmskern.type.$.trim();
                }
                console.warn("Type fallback to 'onbekend' because no better available: " + JSON.stringify(meta, null, 4));
                return "onbekend";
            }

            /**
             * Determine the publication date from the record's metadata.
             * Rounds to midnight so all publications from a single day share an identical Date value. Falls back to today when the field is missing.
             * @param {!Object} meta originalData.meta object.
             * @return {!Date} Midnight-aligned publication date.
             */
            function getDate(meta) {
                if (meta.hasOwnProperty("tpmeta") && meta.tpmeta.hasOwnProperty("datumTijdstipWijzigingWork")) {
                    const date = new Date(meta.tpmeta.datumTijdstipWijzigingWork);
                    // Remove the time from the date:
                    date.setHours(0, 0, 0, 0);
                    return date;
                }
                // Return today as fallback:
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                console.warn("Date fallback to today because no better available: " + JSON.stringify(meta, null, 4));
                return today;
            }

            /**
             * Determine the human-readable title. Prefers owmskern.title, falls back to owmsmantel.abstract, and finally to the type slug when neither is a usable string.
             * @param {!Object} meta originalData.meta object.
             * @param {string} type Type slug to use as last-resort fallback.
             * @return {string} Publication title.
             */
            function getTitle(meta, type) {
                if (meta.hasOwnProperty("owmskern") && meta.owmskern.hasOwnProperty("title") && typeof meta.owmskern.title === "string") {
                    return meta.owmskern.title.trim();
                }
                if (meta.hasOwnProperty("owmsmantel") && meta.owmsmantel.hasOwnProperty("abstract") && typeof meta.owmsmantel.abstract === "string") {
                    // Abstract can be a number in some cases (Enkhuizen, December 2024)
                    return meta.owmsmantel.abstract.trim();
                }
                console.warn("Title fallback to " + type + " because no better available: " + JSON.stringify(meta, null, 4));
                return type;
            }

            /**
             * Determine the long-form description. Prefers owmsmantel.abstract, falls back to owmskern.title, and finally to "-" when neither is a usable string.
             * @param {!Object} meta originalData.meta object.
             * @return {string} Publication description.
             */
            function getDescription(meta) {
                if (meta.hasOwnProperty("owmsmantel") && meta.owmsmantel.hasOwnProperty("abstract") && typeof meta.owmsmantel.abstract === "string") {
                    // Abstract can be a number in some cases (Enkhuizen, December 2024)
                    return meta.owmsmantel.abstract.trim();
                }
                if (meta.hasOwnProperty("owmskern") && meta.owmskern.hasOwnProperty("title") && typeof meta.owmskern.title === "string") {
                    return meta.owmskern.title.trim();
                }
                console.warn("Abstract fallback to '-' because no better available: " + JSON.stringify(meta, null, 4));
                return "-";
            }

            /**
             * Parse a gebiedsmarkering (area marker) in any of its historical formats (POINT / LINESTRING / POLYGON / legacy Rijksdriehoek) and append the resulting "lat lng" strings to the provided list.
             * @param {!Array<string>} list Mutable target list receiving "lat lng" coordinate strings.
             * @param {*} gebiedsmarkering Area marker structure from the SRU record; may be a string, object, or array of either.
             * @return {void}
             */
            function processCoordinate(list, gebiedsmarkering) {
                /**
                 * Append a "lat lng" coordinate to the outer list, skipping exact duplicates (common when the same point appears as both the first and last vertex of a closed polygon).
                 * @param {string} coordinate "lat lng" coordinate string.
                 * @return {void}
                 */
                function addCoordinateToList(coordinate) {
                    // Prevent duplicates:
                    if (list.includes(coordinate)) {
                        console.debug("Coordinate already added: " + coordinate);
                    } else {
                        list.push(coordinate);
                    }
                }

                /**
                 * Convert a legacy Rijksdriehoek (RD / EPSG:28992) coordinate pair to WGS84 lat/lng. Reference implementation from
                 * https://thomasv.nl/2019/02/rijksdriehoek-coordinates-to-wgs84/
                 * @param {number} x RD easting in metres.
                 * @param {number} y RD northing in metres.
                 * @return {!Object} Object with numeric "lat" and "lng".
                 */
                function convertRijksdriehoekToLatLng(x, y) {
                    // The city "Amersfoort" is used as reference "Rijksdriehoek" coordinate.
                    const referenceRdX = 155000;
                    const referenceRdY = 463000;
                    const dX = (x - referenceRdX) * Math.pow(10, -5);
                    const dY = (y - referenceRdY) * Math.pow(10, -5);
                    const sumN =
                        3235.65389 * dY +
                        -32.58297 * Math.pow(dX, 2) +
                        -0.2475 * Math.pow(dY, 2) +
                        -0.84978 * Math.pow(dX, 2) * dY +
                        -0.0655 * Math.pow(dY, 3) +
                        -0.01709 * Math.pow(dX, 2) * Math.pow(dY, 2) +
                        -0.00738 * dX +
                        0.0053 * Math.pow(dX, 4) +
                        -0.00039 * Math.pow(dX, 2) * Math.pow(dY, 3) +
                        0.00033 * Math.pow(dX, 4) * dY +
                        -0.00012 * dX * dY;
                    const sumE =
                        5260.52916 * dX +
                        105.94684 * dX * dY +
                        2.45656 * dX * Math.pow(dY, 2) +
                        -0.81885 * Math.pow(dX, 3) +
                        0.05594 * dX * Math.pow(dY, 3) +
                        -0.05607 * Math.pow(dX, 3) * dY +
                        0.01199 * dY +
                        -0.00256 * Math.pow(dX, 3) * Math.pow(dY, 2) +
                        0.00128 * dX * Math.pow(dY, 4) +
                        0.00022 * Math.pow(dY, 2) +
                        -0.00022 * Math.pow(dX, 2) +
                        0.00026 * Math.pow(dX, 5);
                    // The city "Amersfoort" is used as reference "WGS84" coordinate.
                    const referenceWgs84X = 52.15517;
                    const referenceWgs84Y = 5.387206;
                    const latitude = referenceWgs84X + sumN / 3600;
                    const longitude = referenceWgs84Y + sumE / 3600;
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

                /**
                 * Parse a LINESTRING gebiedsmarkering (or a comma-separated point fallback) and append each vertex to the coordinate list.
                 * @param {string|!Array<string>} locatiegebied LINESTRING WKT or a single "lat,lng" point (legacy).
                 * @return {void}
                 */
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

                /**
                 * Parse a POLYGON gebiedsmarkering and append each vertex to the coordinate list.
                 * @param {string|!Array<string>} locatiegebied POLYGON WKT or a legacy point/line encoding.
                 * @return {void}
                 */
                function processPolygon(locatiegebied) {
                    if (Array.isArray(locatiegebied)) {
                        locatiegebied.forEach(processPolygon);
                        return;
                    }
                    // Single-ring: POLYGON((4.6486927 51.821361,4.6486994 51.821359,...))
                    // Multi-ring (donut/island): POLYGON((outer...),(inner1...),(inner2...))
                    // We render every vertex regardless of which ring it belongs to, so flatten all rings by stripping every "(" and ")".
                    if (locatiegebied.startsWith("POLYGON")) {
                        const coordinates = locatiegebied
                            .replace(/^POLYGON\s*/, "")
                            .replace(/[()]/g, "")
                            .split(",");
                        coordinates.forEach(function (coordinate) {
                            const latLng = coordinate.trim().split(" ");
                            if (latLng.length === 2) {
                                addCoordinateToList(latLng[1] + " " + latLng[0]);
                            } else {
                                console.error(
                                    "Unable to convert polygon coordinate " + locatiegebied + " " + JSON.stringify(gebiedsmarkering, null, 4)
                                );
                            }
                        });
                    } else if (locatiegebied.startsWith("LINESTRING")) {
                        console.log("Found LINESTRING in locatiegebied, calling processLine() for " + locatiegebied);
                        processLine(locatiegebied);
                    } else if (locatiegebied.includes(" ")) {
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

                /**
                 * Parse a legacy Rijksdriehoek geometry (POINT or POLYGON in RD coordinates) and append the WGS84-converted vertices to the coordinate list.
                 * @param {string} geometrie WKT in RD coordinates.
                 * @return {void}
                 */
                function processPointLegacy(geometrie) {
                    // Single-ring: POLYGON ((177456.11 361401.39, 177459.78 361374.02, ..., 177456.11 361401.39))
                    // Multi-ring is also possible; flatten all rings by stripping every "(" and ")".
                    if (geometrie.startsWith("POLYGON")) {
                        const coordinates = geometrie
                            .replace(/^POLYGON\s*/, "")
                            .replace(/[()]/g, "")
                            .split(",");
                        coordinates.forEach(function (coordinate) {
                            const latLngRijksdriehoek = coordinate.trim().split(/\s+/);
                            if (latLngRijksdriehoek.length === 2) {
                                const latLng = convertRijksdriehoekToLatLng(parseFloat(latLngRijksdriehoek[0]), parseFloat(latLngRijksdriehoek[1]));
                                addCoordinateToList(latLng.lat + " " + latLng.lng);
                                console.log("Converted " + geometrie + " to " + latLng.lat + " " + latLng.lng);
                            } else {
                                console.error(
                                    "Unable to convert legacy point as polygon coordinate " +
                                        geometrie +
                                        " " +
                                        JSON.stringify(gebiedsmarkering, null, 4)
                                );
                            }
                        });
                    } else {
                        // POINT(120097.26  488031.32)
                        const coordinates = geometrie.replace("POINT", "").trim().replace("(", "").replace(")", "").split("  ");
                        if (coordinates.length === 2) {
                            const latLng = convertRijksdriehoekToLatLng(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
                            addCoordinateToList(latLng.lat + " " + latLng.lng);
                            console.log("Converted " + geometrie + " to " + latLng.lat + " " + latLng.lng);
                        } else {
                            console.error("Unable to convert legacy point " + geometrie);
                        }
                    }
                }

                if (gebiedsmarkering.hasOwnProperty("Punt") && gebiedsmarkering.Punt.hasOwnProperty("locatiepunt")) {
                    addCoordinateToList(gebiedsmarkering.Punt.locatiepunt); // "51.5153294378518 4.6993593555447"
                } else if (gebiedsmarkering.hasOwnProperty("Punt") && gebiedsmarkering.Punt.hasOwnProperty("geometrie")) {
                    processPointLegacy(gebiedsmarkering.Punt.geometrie); // "POINT(120097.26  488031.32)"
                } else if (gebiedsmarkering.hasOwnProperty("Adres") && gebiedsmarkering.Adres.hasOwnProperty("locatiepunt")) {
                    addCoordinateToList(gebiedsmarkering.Adres.locatiepunt); // "51.5153294378518 4.6993593555447"
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
                } else if (
                    gebiedsmarkering.hasOwnProperty("Gemeente") ||
                    gebiedsmarkering.hasOwnProperty("Woonplaats") ||
                    gebiedsmarkering.hasOwnProperty("Waterschap") ||
                    gebiedsmarkering.hasOwnProperty("Provincie")
                ) {
                    // Ignore this.
                } else {
                    console.error("Format of gebiedsmarkering not supported: " + JSON.stringify(gebiedsmarkering, null, 4));
                }
            }

            try {
                const urlDoc =
                    (
                        inputRecord.recordData.gzd.enrichedData.hasOwnProperty("preferredUrl") &&
                        typeof inputRecord.recordData.gzd.enrichedData.preferredUrl === "string"
                    ) ?
                        inputRecord.recordData.gzd.enrichedData.preferredUrl.trim()
                    :   "";

                const description = getDescription(inputRecord.recordData.gzd.originalData.meta);
                const type = getType(inputRecord.recordData.gzd.originalData.meta);
                const publication = {
                    // Example: "2023-02-10"
                    "date": getDate(inputRecord.recordData.gzd.originalData.meta),
                    // Example: "https://zoek.officielebekendmakingen.nl/gmb-2023-59059.html"
                    "urlDoc": urlDoc,
                    // Example: "https://repository.overheid.nl/frbr/officielepublicaties/gmb/2023/gmb-2023-59059/1/xml/gmb-2023-59059.xml"
                    "urlApi": getUrlApi(urlDoc),
                    // Example "kapvergunning"
                    "type": type,
                    // Example: "Besluit apv vergunning Verleend Overtoom 10-H"
                    "title": getTitle(inputRecord.recordData.gzd.originalData.meta, type),
                    // Example: "TVM 2 vakken - Overtoom 10-12 13 februari 2023, Overtoom 10-H"
                    "description": description
                };
                publication.location = [];
                if (
                    inputRecord.recordData.gzd.originalData.meta.hasOwnProperty("tpmeta") &&
                    inputRecord.recordData.gzd.originalData.meta.tpmeta.hasOwnProperty("gebiedsmarkering")
                ) {
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
            } catch (error) {
                console.error("Error processing publication: " + JSON.stringify(inputRecord, null, 4) + " Error: " + error);
            }
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
            // Sort the raw records before pushing them into publicationsArray.
            responseJson.searchRetrieveResponse.records.record.sort(sortRecords);
            responseJson.searchRetrieveResponse.records.record.forEach(addPublication);
        }
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
     * Show an error banner inside the map container. Unlike globalThis.alert(),
     * this works in iframes, can be styled, and does not block the UI thread.
     * @param {string} message Error message to display.
     * @return {void}
     */
    function showError(message) {
        const banner = document.createElement("div");
        banner.setAttribute("role", "alert");
        banner.textContent = message;
        banner.style.cssText =
            "position:absolute;top:10px;left:50%;transform:translateX(-50%);" +
            "background:#b00020;color:#fff;padding:12px 20px;border-radius:6px;" +
            "font-size:14px;max-width:80%;text-align:center;cursor:pointer;z-index:9999;box-shadow:0 2px 6px rgba(0,0,0,.4);";
        const container = document.getElementById("map") || document.body;
        container.appendChild(banner);
        const remove = function () {
            if (banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
        };
        banner.addEventListener("click", remove);
    }

    /**
     * Download json from the Github Live Pages.
     * @param {string} path Path and file name to retrieve.
     * @param {function} callback Function when request is successful.
     * @return {!Promise<*>} Promise that resolves with the parsed JSON, or
     *     rejects on network error / non-OK response. The optional callback
     *     is still invoked for backward compatibility.
     */
    function getData(path, callback) {
        const host = "https://basgroot.github.io";
        const url = host + path;
        console.debug("Retrieving " + url + "..");
        return fetch(url, { "method": "GET" })
            .then(function (response) {
                if (!response.ok) {
                    console.error(response);
                    throw new Error("HTTP " + response.status + " for " + url);
                }
                return response.json();
            })
            .then(function (json) {
                if (typeof callback === "function") {
                    callback(json);
                }
                return json;
            })
            .catch(function (error) {
                console.error(error);
                throw error;
            });
    }

    /**
     * Open an historical file, where data is stored per month.
     * @param {string} period Month to display, formatted as "YYYY-MM".
     * @param {boolean} isNewRequest When true, replace the current view:
     *     clear existing markers, show the loading indicator and overwrite
     *     publicationsArray with the response. When false, append the
     *     response to the existing view (used to extend the visible range
     *     with an older month without discarding what is already loaded).
     * @return {void}
     */
    function loadHistory(period, isNewRequest) {
        const lookupMunicipality =
            appState.municipalities[appState.activeMunicipality].hasOwnProperty("lookupName") ?
                appState.municipalities[appState.activeMunicipality].lookupName
            :   appState.activeMunicipality;
        const periodArray = period.split("-");
        if (periodArray.length !== 2) {
            throw new Error("Invalid period: " + period);
        }
        const url =
            "/bekendmakingen/history/" +
            periodArray[0] +
            "/" +
            encodeURIComponent(lookupMunicipality.toLowerCase().replace(/\s/g, "-")) +
            "-" +
            period +
            ".json";
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
                    console.log(
                        "Deleting " +
                            (responseJson.publications.length - publicationIndex) +
                            " historical items from before " +
                            appState.requestPeriod.startDate.toDateString()
                    );
                    responseJson.publications = responseJson.publications.slice(0, publicationIndex);
                }
                appState.publicationsArray = appState.publicationsArray.concat(responseJson.publications);
                appState.isFullyLoaded = true;
            }
            if (responseJson.publications.length > 0 || isNewRequest) {
                addMarkers(startRecord, false);
            } else {
                // Nothing to add (e.g. all historical items were older than
                // the cutoff date), but loading is complete.
                setLoadingIndicatorVisibility("hide");
                tryOpenPublicationFromUrl();
            }
        }).catch(function (error) {
            console.error("Failed to load history " + url, error);
            setLoadingIndicatorVisibility("hide");
            if (isNewRequest) {
                showError("Er is een probleem opgetreden bij het laden van de historische bekendmakingen.\nProbeer het later nogmaals.");
            }
        });
    }

    /**
     * Call the API to get live data.
     * @param {string} municipality Municipality to load.
     * @param {number} startRecord Start of batch.
     * @return {void}
     */
    function loadDataForMunicipality(municipality, startRecord) {
        /**
         * Process the API response.
         * @param {Object} responseJson
         * @returns
         */
        function processResponse(responseJson) {
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
                const recordCount =
                    responseJson.searchRetrieveResponse.numberOfRecords === 1 ? 1 : responseJson.searchRetrieveResponse.records.record.length;
                console.log(
                    "Found " + recordCount + " bekendmakingen of " + responseJson.searchRetrieveResponse.numberOfRecords + " in " + municipality
                );
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
        }

        /**
         * Fetch data and retry when something goes wrong.
         * @param {string} url
         * @param {number} retriesLeft
         * @return {void}
         */
        function loadDataWithRetries(url, retriesLeft) {
            if (retriesLeft <= 0) {
                console.error("Giving up loading " + url + " after multiple retries.");
                showError("Er is een probleem opgetreden bij het laden van de bekendmakingen van " + municipality + ".\nProbeer het later nogmaals.");
                setLoadingIndicatorVisibility("hide");
                return;
            }
            console.debug("Retrieving " + url + " (" + retriesLeft + " retries left)..");
            fetch(
                // Example: https://repository.overheid.nl/sru?query=c.product-area==officielepublicaties%20AND%20dt.modified%3E=2025-05-01%20AND%20dt.creator=%22Amsterdam%22%20sortBy%20dt.modified%20/sort.descending&maximumRecords=1000&startRecord=1&httpAccept=application/json
                url,
                {
                    "method": "GET"
                }
            )
                .then(function (response) {
                    if (response.ok) {
                        response.json().then(processResponse);
                    } else {
                        console.error(response);
                        // This happens when response is 503 Service Unavailable, for example.
                        loadDataWithRetries(url, retriesLeft - 1);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                    loadDataWithRetries(url, retriesLeft - 1);
                });
        }

        const lookupMunicipality =
            appState.municipalities[municipality].hasOwnProperty("lookupName") ? appState.municipalities[municipality].lookupName : municipality;
        setLoadingIndicatorVisibility("show");
        const url =
            "https://repository.overheid.nl/sru?query=c.product-area==officielepublicaties%20AND%20dt.modified%3E=" +
            appState.requestPeriod.startDateString +
            "%20AND%20dt.creator=%22" +
            encodeURIComponent(lookupMunicipality) +
            "%22%20sortBy%20dt.modified%20/sort.descending&maximumRecords=500&startRecord=" +
            startRecord +
            "&httpAccept=application/json";
        loadDataWithRetries(url, 3);
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
            markerObject.marker = null;
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
        if (municipalityComboElm !== null) {
            appState.activeMunicipality = municipalityComboElm.value;
            clearMarkers("");
            if (isNavigationNeeded) {
                console.log("Navigating to " + appState.activeMunicipality);
                navigateTo(appState.activeMunicipality);
            }
            if (appState.isHistoryActive && isNavigationNeeded) {
                // Switching to a different municipality while a historical
                // period is active: drop the historical view and fall back to
                // live data for the new municipality.
                appState.isHistoryActive = false;
                const periodFilter = getPeriodFilter();
                periodFilter.elm.value = appState.initialPeriod;
                updateUrlForPeriod(appState.initialPeriod);
            }
        }
        // If the active period is a historical month (e.g. because the
        // page was loaded with ?period=2022-10), bypass the live SRU fetch
        // and load that month's static history file directly. Without this,
        // the initial load would fetch live data for the past 6 weeks and
        // append "previous month" history, completely ignoring the
        // requested historical period until the user re-selected it.
        const periodFilter = getPeriodFilter();
        if (periodFilter.isHistory) {
            appState.isFullyLoaded = false;
            loadHistory(periodFilter.period, true);
            return;
        }
        appState.isFullyLoaded = false;
        loadDataForMunicipality(appState.activeMunicipality, 1);
    }

    /**
     * Application entry point. Loads the static periods and municipalities
     * configuration files in parallel, then resolves the user's location and
     * kicks off the initial SRU fetch.
     * @return {void}
     */
    function init() {
        Promise.all([getData("/bekendmakingen/periods.json"), getData("/bekendmakingen/municipalities.json")])
            .then(function (results) {
                const periodsJson = results[0];
                const municipalitiesJson = results[1];
                appState.periods = periodsJson.periods;
                // Source: https://organisaties.overheid.nl/Gemeenten/
                appState.municipalities = municipalitiesJson;
                getLocationAndLoadData();
            })
            .catch(function (error) {
                console.error("Failed to load configuration", error);
                setLoadingIndicatorVisibility("hide");
                showError("Er is een probleem opgetreden bij het laden van de configuratie.\nProbeer het later nogmaals.");
            });
    }

    init();
}
