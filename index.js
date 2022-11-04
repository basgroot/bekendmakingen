/*jslint browser: true, for: true, long: true, unordered: true */
/*global window console demonstrationHelper */

(function () {
    let inputData;

    function bekendmakingToText(bekendmaking) {
        const bekendmakingsDate = new Date(bekendmaking.properties.datum_tijdstip);
        return bekendmakingsDate.toISOString() + ";" + bekendmaking.properties.url + ";\"" + bekendmaking.properties.titel + "\";\"" + bekendmaking.properties.beschrijving + "\"";
    }

    function isKnownBekendmakingType(titel) {
        const filters = [
            "besluit",
            "ontwerpbesluit",
            "gemeente amsterdam",
            "verlenging",
            "aanvraag",
            "vergunning verleend"
        ];
        let isKnown = false;
        filters.forEach(function (filter) {
            if (titel.substring(0, filter.length).toLowerCase() === filter) {
                isKnown = true;
            }
        });
        return isKnown;
    }

    function collectBezwaartermijn(websiteUrl) {

        function getGmbNumberFromUrl() {
            return websiteUrl.substr(40, websiteUrl.length - 45);
        }

        function getYearFromUrl() {
            return websiteUrl.substr(44, 4);
        }

        // URL: https://zoek.officielebekendmakingen.nl/gmb-2022-425209.html
        // Endpoint: https://repository.overheid.nl/frbr/officielepublicaties/gmb/2022/gmb-2022-425209/1/xml/gmb-2022-425209.xml
        const gmbNumber = getGmbNumberFromUrl();
        alert("'" + getYearFromUrl() + "'");
        const url = "https://repository.overheid.nl/frbr/officielepublicaties/gmb/" + getYearFromUrl() + "/" + gmbNumber + "/1/xml/" + gmbNumber + ".xml";
        fetch(
            url,
            {
                "method": "GET",
                "headers": {
                }
            }
        ).then(function (response) {
            if (response.ok) {
                response.xml().then(function (responseXml) {

                });
            } else {
                demo.processError(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function loadData() {
        const url = "https://api.data.amsterdam.nl/v1/wfs/bekendmakingen/?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=bekendmakingen&OUTPUTFORMAT=geojson";
        fetch(
            url,
            {
                "method": "GET",
                "headers": {
                }
            }
        ).then(function (response) {
            if (response.ok) {
                response.json().then(function (responseJson) {
                    const text = [];
                    inputData = responseJson;
                    console.log("Found " + inputData.features.length + " bekendmakingen in Amsterdam.");
                    inputData.features.forEach(function (bekendmaking) {
                        text.push(bekendmakingToText(bekendmaking));
                        if (!isKnownBekendmakingType(bekendmaking.properties.titel)) {
                            console.error("Bekendmaking zonder tag: " + bekendmaking.properties.titel);
                        }
                    });
                    text.sort();
                    document.getElementById("idBekendmakingen").value = text.join("\n");
                });
            } else {
                demo.processError(response);
            }
        }).catch(function (error) {
            console.error(error);
        });
    }

    function filterVerleend() {
        const filter1 = "aanvraag";
        const filter2 = "verlenging";
        const text = [];
        inputData.features.forEach(function (bekendmaking) {
            if (bekendmaking.properties.titel.substring(0, filter1.length).toLowerCase() !== filter1 && bekendmaking.properties.titel.substring(0, filter2.length).toLowerCase() !== filter2) {
                text.push(bekendmakingToText(bekendmaking));
            }
        });
        text.sort();
        document.getElementById("idBekendmakingen").value = text.join("\n");
    }

    function collectBezwaartermijnen() {
        document.getElementById("idBekendmakingen").value.split("\n").forEach(function (bekendmaking) {
            collectBezwaartermijn(bekendmaking.split(";")[1]);
        });
    }

    loadData();

    document.getElementById("idBtnFilterVerleend").addEventListener("click", filterVerleend);
    document.getElementById("idBtnCollectBezwaartermijnen").addEventListener("click", collectBezwaartermijnen);
}());
